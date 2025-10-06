from fastapi import APIRouter, Response, HTTPException, Depends, Cookie, Request
from pydantic import BaseModel
from ..security import (
    set_auth_cookies, 
    verify_password, 
    get_current_user, 
    generate_csrf_token, 
    set_csrf_cookie
)
from ..db import SessionLocal
from ..models import User

r = APIRouter(prefix="/auth", tags=["auth"])

class LoginIn(BaseModel):
    email: str
    password: str

@r.post("/login")
def login(payload: LoginIn, resp: Response):
    print(f"\n{'='*60}")
    print(f"[LOGIN] Tentativa de login: {payload.email}")
    print(f"{'='*60}")

    with SessionLocal() as db:
        user = db.query(User).filter(User.email==payload.email).first()

        if not user:
            print(f"[LOGIN] ❌ Usuario nao encontrado: {payload.email}")
            raise HTTPException(401, "invalid credentials")

        print(f"[LOGIN] ✓ Usuario encontrado: {user.name} (ID: {user.id})")
        print(f"[LOGIN]   - Email: {user.email}")
        print(f"[LOGIN]   - Role: {user.role}")
        print(f"[LOGIN]   - Active: {user.active}")

        print(f"[LOGIN] Verificando senha...")
        if not verify_password(payload.password, user.password_hash):
            print(f"[LOGIN] ❌ Senha incorreta")
            raise HTTPException(401, "invalid credentials")

        print(f"[LOGIN] ✓ Senha correta")

        # Verificar se usuário está ativo
        if not user.active:
            print(f"[LOGIN] ❌ Usuario inativo")
            raise HTTPException(403, "user is inactive")

        print(f"[LOGIN] ✓ Usuario ativo")
        print(f"[LOGIN] Setando cookies...")

        set_auth_cookies(resp, user.id, user.role)

        print(f"[LOGIN] ✅ Login bem-sucedido!")
        print(f"{'='*60}\n")

        return {"id": user.id, "name": user.name, "role": user.role, "email": user.email}

@r.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@r.post("/refresh")
def refresh(resp: Response, refresh_token: str | None = Cookie(alias="refresh", default=None)):
    try:
        # Tenta obter o usuário pelo refresh token no cookie
        user = get_current_user(access=None, refresh=refresh_token)
        # Se válido, gera novos tokens
        set_auth_cookies(resp, user.id, user.role)
        return {"id": user.id, "name": user.name, "role": user.role}
    except HTTPException:
        # Se refresh token inválido, limpa cookies e retorna erro
        resp.delete_cookie("access")
        resp.delete_cookie("refresh")
        resp.delete_cookie("role")
        raise HTTPException(401, "refresh token invalid or expired")

@r.get("/debug/cookies")
def debug_cookies(request: Request):
    """Endpoint de debug para verificar cookies recebidos"""
    cookies = dict(request.cookies)
    return {
        "received_cookies": cookies,
        "has_access": "access" in cookies,
        "has_refresh": "refresh" in cookies,
        "has_role": "role" in cookies,
        "access_length": len(cookies.get("access", "")) if "access" in cookies else 0,
        "refresh_length": len(cookies.get("refresh", "")) if "refresh" in cookies else 0,
        "user_agent": request.headers.get("user-agent", ""),
        "origin": request.headers.get("origin", ""),
        "referer": request.headers.get("referer", "")
    }

@r.get("/csrf")
def get_csrf_token(resp: Response):
    """Endpoint para obter token CSRF (usado pelo frontend)"""
    csrf_token = generate_csrf_token()
    set_csrf_cookie(resp, csrf_token)
    return {"csrf_token": csrf_token}

@r.post("/logout")
def logout(resp: Response):
    """Logout que limpa todos os cookies de autenticação e CSRF"""
    resp.delete_cookie("access")
    resp.delete_cookie("refresh")
    resp.delete_cookie("role")
    resp.delete_cookie("csrf_token")
    return {"ok": True}
