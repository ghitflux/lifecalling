from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Contract, ContractAttachment, Case
from ..config import settings
from datetime import datetime
import os
import shutil
import uuid

r = APIRouter(prefix="/contracts", tags=["contract_attachments"])

@r.post("/{contract_id}/attachments")
def upload_contract_attachment(
    contract_id: int,
    file: UploadFile = File(...),
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    """Upload de comprovantes para contratos"""

    with SessionLocal() as db:
        # Verificar se o contrato existe
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "Contract not found")

        # Criar diretório se não existir
        os.makedirs(settings.upload_dir, exist_ok=True)

        # Gerar nome único para o arquivo
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"contract_{contract_id}_{uuid.uuid4().hex[:8]}{file_extension}"
        dest = os.path.join(settings.upload_dir, unique_filename)

        # Salvar arquivo
        try:
            with open(dest, "wb") as f:
                shutil.copyfileobj(file.file, f)
        except Exception as e:
            raise HTTPException(500, f"Erro ao salvar arquivo: {str(e)}")

        # Persistir no banco
        attachment = ContractAttachment(
            contract_id=contract_id,
            case_id=contract.case_id,
            path=dest,
            filename=file.filename or unique_filename,
            mime=file.content_type,
            size=os.path.getsize(dest),
            type="comprovante",
            uploaded_by=user.id
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return {
            "id": attachment.id,
            "filename": attachment.filename,
            "size": attachment.size,
            "type": attachment.type,
            "uploaded_at": attachment.created_at.isoformat()
        }

@r.get("/{contract_id}/attachments")
def list_contract_attachments(contract_id: int, user=Depends(get_current_user)):
    """Listar anexos de um contrato"""

    with SessionLocal() as db:
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "Contract not found")

        attachments = db.query(ContractAttachment).filter(
            ContractAttachment.contract_id == contract_id
        ).all()

        return {"items": [
            {
                "id": a.id,
                "filename": a.filename,
                "size": a.size,
                "mime": a.mime,
                "type": a.type,
                "uploaded_at": a.created_at.isoformat() if a.created_at else None,
                "uploaded_by": a.uploaded_by
            } for a in attachments
        ]}

@r.get("/{contract_id}/attachments/{attachment_id}/download")
def download_contract_attachment(
    contract_id: int,
    attachment_id: int,
    user=Depends(get_current_user)
):
    """Download de anexo de contrato"""

    with SessionLocal() as db:
        attachment = db.query(ContractAttachment).filter(
            ContractAttachment.id == attachment_id,
            ContractAttachment.contract_id == contract_id
        ).first()

        if not attachment:
            raise HTTPException(404, "Attachment not found")

        if not os.path.exists(attachment.path):
            raise HTTPException(404, "File not found on disk")

        # Usar o nome original do arquivo ou fallback para o nome salvo
        filename = attachment.filename or os.path.basename(attachment.path)

        from fastapi.responses import FileResponse
        return FileResponse(
            path=attachment.path,
            media_type=attachment.mime or "application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

@r.delete("/{contract_id}/attachments/{attachment_id}")
def delete_contract_attachment(
    contract_id: int,
    attachment_id: int,
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    """Remover anexo de contrato"""

    with SessionLocal() as db:
        attachment = db.query(ContractAttachment).filter(
            ContractAttachment.id == attachment_id,
            ContractAttachment.contract_id == contract_id
        ).first()

        if not attachment:
            raise HTTPException(404, "Attachment not found")

        # Remover arquivo do disco
        if os.path.exists(attachment.path):
            try:
                os.remove(attachment.path)
            except Exception as e:
                print(f"Erro ao remover arquivo: {e}")

        # Remover do banco
        db.delete(attachment)
        db.commit()

        return {"message": "Attachment deleted successfully"}