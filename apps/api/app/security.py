from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import secrets
from fastapi import HTTPException, Response, Cookie, Header, Request
from .config import settings
from .db import SessionLocal
from .models import User

def hash_password(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p, h):
    return bcrypt.checkpw(p.encode(), h.encode())

# CSRF Protection Functions


def generate_csrf_token() -> str:
    """Gera um token CSRF aleatório e seguro"""
    return secrets.token_urlsafe(32)


def set_csrf_cookie(resp: Response, token: str):
    """Seta o cookie CSRF (não-HttpOnly para ser lido pelo JavaScript)"""
    is_prod = settings.env == "production"
    resp.set_cookie(
        "csrf_token",
        token,
        httponly=False,  # Deve ser False para ser lido pelo JS
        secure=is_prod,
        samesite="lax",
        domain=(
            settings.cookie_domain 
            if is_prod and settings.cookie_domain 
            else None
        ),
        path="/",
        max_age=60*60*12  # 12 horas
    )


def verify_csrf(request: Request):
    """Valida o token CSRF comparando header X-CSRF-Token com cookie csrf_token"""
    csrf_header = request.headers.get("X-CSRF-Token")
    csrf_cookie = request.cookies.get("csrf_token")
    
    if not csrf_header or not csrf_cookie:
        raise HTTPException(403, "CSRF token missing")
    
    if not secrets.compare_digest(csrf_header, csrf_cookie):
        raise HTTPException(403, "CSRF token mismatch")
    
    return True

def make_token(sub: int, kind: str, ttl: int):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(sub),
        "type": kind,
        "iss": settings.jwt_iss,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl)).timestamp())
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def set_auth_cookies(resp: Response, uid: int, role: str):
    """Seta cookies de autenticação e CSRF"""
    is_prod = settings.env == "production"
    
    # Access token (HttpOnly)
    resp.set_cookie(
        "access",
        make_token(uid, "access", settings.access_ttl),
        httponly=True,
        samesite="lax",
        secure=is_prod,
        domain=(
            settings.cookie_domain 
            if is_prod and settings.cookie_domain 
            else None
        ),
        path="/",
        max_age=settings.access_ttl
    )
    
    # Refresh token (HttpOnly)
    resp.set_cookie(
        "refresh",
        make_token(uid, "refresh", settings.refresh_ttl),
        httponly=True,
        samesite="lax",
        secure=is_prod,
        domain=(
            settings.cookie_domain 
            if is_prod and settings.cookie_domain 
            else None
        ),
        path="/",
        max_age=settings.refresh_ttl
    )
    
    # Role cookie (não-HttpOnly para ser lido pelo frontend)
    resp.set_cookie(
        "role",
        role,
        httponly=False,
        samesite="lax",
        secure=is_prod,
        domain=(
            settings.cookie_domain 
            if is_prod and settings.cookie_domain 
            else None
        ),
        path="/",
        max_age=settings.refresh_ttl
    )
    
    # CSRF token (não-HttpOnly para ser lido pelo JavaScript)
    csrf_token = generate_csrf_token()
    set_csrf_cookie(resp, csrf_token)

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
