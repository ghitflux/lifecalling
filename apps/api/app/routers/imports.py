from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import ImportBatch, ImportRow, Client, Case
from datetime import datetime
from decimal import Decimal
import re

r = APIRouter(prefix="/imports", tags=["imports"])

CPF_RGX = re.compile(r'(\d{11})')

# Linha típica (colunas largas com espaços):
# "  1    000550-9  JOANA ...        ...        458,04      001    47082976372"
ROW_RGX = re.compile(
    r'^\s*\d+\s+'          # índice
    r'(\S+)\s+'            # matricula
    r'(.+?)\s{2,}.*?'      # nome (pode conter hífens e números de cargo)
    r'(\d{1,3}(?:\.\d{3})*,\d{2})\s+'  # valor ex: 1.234,56
    r'\d{3}\s+'            # orgão pagamento (código)
    r'(\d{11})\s*$'        # cpf (só dígitos)
)

def to_centavos(brl: str) -> int:
    # "1.234,56" -> 123456
    return int((Decimal(brl.replace('.', '').replace(',', '.')) * 100).quantize(Decimal("1")))

@r.post("")
def import_txt(
    file: UploadFile = File(...),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista")),
):
    content = file.file.read().decode("utf-8", errors="ignore")
    lines = [line.rstrip("\n") for line in content.splitlines() if line.strip()]
    counters = {"created": 0, "updated": 0, "errors": 0, "skipped": 0}

    with SessionLocal() as db:
        batch = ImportBatch(filename=file.filename, created_by=user.id, counters={})
        db.add(batch)
        db.commit()
        db.refresh(batch)

        for line in lines:
            m = ROW_RGX.match(line)
            if not m:
                counters["skipped"] += 1
                db.add(ImportRow(import_id=batch.id, raw=line, status="skipped"))
                continue

            matricula, nome, valor_str, cpf = m.groups()
            valor_cent = to_centavos(valor_str)

            try:
                client = db.query(Client).filter(
                    Client.cpf == cpf, Client.matricula == matricula
                ).first()

                if not client:
                    client = Client(
                        name=nome,
                        cpf=cpf,
                        matricula=matricula,
                        orgao="Governo do Estado do Piauí"  # ajuste se quiser
                    )
                    db.add(client)
                    db.flush()
                    case = Case(client_id=client.id, status="novo", last_update_at=datetime.utcnow())
                    db.add(case)
                    counters["created"] += 1
                    status_row = "created"
                else:
                    # Atualiza dados úteis (sem apagar o que já tem)
                    if not client.name:
                        client.name = nome
                    case = db.query(Case).filter(Case.client_id == client.id).first()
                    if not case:
                        case = Case(client_id=client.id, status="novo", last_update_at=datetime.utcnow())
                        db.add(case)
                    counters["updated"] += 1
                    status_row = "updated"

                db.add(ImportRow(
                    import_id=batch.id,
                    cpf=cpf,
                    matricula=matricula,
                    parsed={"nome": nome, "valor_centavos": valor_cent},
                    raw=line,
                    status=status_row
                ))

            except Exception as e:
                counters["errors"] += 1
                db.add(ImportRow(import_id=batch.id, raw=line, status=f"error:{e}"))

        batch.counters = counters
        db.commit()

    return {"batch_id": batch.id, "counters": counters}

@r.get("/{import_id}")
def get_import(import_id: int, user=Depends(require_roles("admin","supervisor"))):
    # Retorna resumo + amostra de linhas problemáticas
    with SessionLocal() as db:
        batch = db.get(ImportBatch, import_id)
        if not batch:
            raise HTTPException(404, "import not found")
        # pega as últimas 50 linhas não-ok
        rows = db.query(ImportRow).filter(
            ImportRow.import_id == import_id,
            ImportRow.status != "created",
            ).order_by(ImportRow.id.desc()).limit(50).all()
        sample = [{"status": r.status, "raw": r.raw} for r in rows]
        return {"filename": batch.filename, "counters": batch.counters, "sample": sample}
