from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from fastapi import HTTPException, Response, Cookie, Header
from .config import settings
from .db import SessionLocal
from .models import User

def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h): return bcrypt.checkpw(p.encode(), h.encode())

def make_token(sub:int, kind:str, ttl:int):
    now = datetime.now(timezone.utc)
    payload = {"sub": str(sub), "type": kind, "iss": settings.jwt_iss, "iat": int(now.timestamp()), "exp": int((now+timedelta(seconds=ttl)).timestamp())}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def set_auth_cookies(resp:Response, uid:int, role:str):
    # Configuração para desenvolvimento (sem domínio específico)
    resp.set_cookie(
        "access",
        make_token(uid,"access", settings.access_ttl),
        httponly=True,
        samesite="lax",
        secure=False  # CRÍTICO: False para localhost (HTTP)
        # Sem domínio específico para permitir flexibilidade
    )
    resp.set_cookie(
        "refresh",
        make_token(uid,"refresh", settings.refresh_ttl),
        httponly=True,
        samesite="lax",
        secure=False  # CRÍTICO: False para localhost (HTTP)
        # Sem domínio específico para permitir flexibilidade
    )
    resp.set_cookie(
        "role",
        role,
        httponly=False,
        samesite="lax",
        secure=False  # Consistência com outros cookies
        # Sem domínio específico para permitir flexibilidade
    )

def get_current_user(
    access: str | None = Cookie(default=None),
    refresh: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None)
):
    # Suporte a Authorization: Bearer <token>
    bearer_token = None
    if authorization:
        try:
            parts = authorization.split(" ", 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                bearer_token = parts[1].strip()
        except Exception:
            # Ignora formatações inválidas do header
            bearer_token = None

    token = bearer_token or access or refresh
    if not token:
        raise HTTPException(401, "unauthorized")
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"require": ["exp","iss"]})
    except Exception:
        raise HTTPException(401, "invalid token")
    with SessionLocal() as db:
        user = db.get(User, int(data["sub"]))
        if not user or not user.active:
            raise HTTPException(401, "inactive")
        return user
