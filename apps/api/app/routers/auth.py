from fastapi import APIRouter, Response, HTTPException, Depends, Cookie, Request
from pydantic import BaseModel
from ..security import set_auth_cookies, verify_password, get_current_user
from ..db import SessionLocal
from ..models import User

r = APIRouter(prefix="/auth", tags=["auth"])

class LoginIn(BaseModel):
    email: str
    password: str

@r.post("/login")
def login(payload: LoginIn, resp: Response):
    with SessionLocal() as db:
        user = db.query(User).filter(User.email==payload.email).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(401, "invalid credentials")
        set_auth_cookies(resp, user.id, user.role)
        return {"id": user.id, "name": user.name, "role": user.role}

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

@r.post("/logout")
def logout(resp: Response):
    resp.delete_cookie("access")
    resp.delete_cookie("refresh")
    resp.delete_cookie("role")
    return {"ok": True}
