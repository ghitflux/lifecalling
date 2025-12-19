import re
from sqlalchemy.orm import Session
from app.models import Client, ClientEnrollment

def digits(s): return re.sub(r'\\D+','', s or '')

def normalize_cpf(cpf): d=digits(cpf); return d.zfill(11) if d else d
def normalize_matricula(m): return digits(m)

def get_or_create_client_with_enrollment(db: Session, cpf: str, matricula: str|None, orgao: str|None=None, name: str|None=None):
    ncpf = normalize_cpf(cpf)
    client = db.query(Client).filter(Client.cpf==ncpf).one_or_none()
    if not client:
        client = Client(cpf=ncpf, name=name or "")
        db.add(client); db.flush()

    enrollment = None
    if matricula:
        nmat = normalize_matricula(matricula)
        enrollment = db.query(ClientEnrollment).filter_by(client_id=client.id, matricula=nmat).one_or_none()
        if not enrollment:
            enrollment = ClientEnrollment(client_id=client.id, matricula=nmat, orgao=orgao)
            db.add(enrollment); db.flush()
    return client, enrollment
