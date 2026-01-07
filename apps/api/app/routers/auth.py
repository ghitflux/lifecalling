from fastapi import APIRouter, Response, HTTPException, Depends, Cookie, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from ..security import (
    set_auth_cookies,
    verify_password,
    hash_password,
    get_current_user,
    generate_csrf_token,
    set_csrf_cookie
)
from ..db import SessionLocal
from ..models import User, PasswordResetToken
from ..services.email_service import email_service
import secrets
from datetime import datetime, timedelta
import os
import re

r = APIRouter(prefix="/auth", tags=["auth"])

class LoginIn(BaseModel):
    email: str
    password: str

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

class ResetPasswordCpfIn(BaseModel):
    email: EmailStr
    cpf: str
    new_password: str

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

        access_token = set_auth_cookies(resp, user.id, user.role)

        print(f"[LOGIN] ✅ Login bem-sucedido!")
        print(f"{'='*60}\n")

        return {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "email": user.email,
            "access_token": access_token,
        }

@r.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "cpf": user.cpf,
        "phone": user.phone,
    }

@r.post("/change-password")
def change_password(payload: ChangePasswordIn, current_user: User = Depends(get_current_user)):
    if not payload.current_password or not payload.new_password:
        raise HTTPException(400, "missing fields")

    if len(payload.new_password) < 6:
        raise HTTPException(400, "password too short")

    with SessionLocal() as db:
        user = db.get(User, current_user.id)
        if not user:
            raise HTTPException(404, "user not found")

        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(400, "current password invalid")

        user.password_hash = hash_password(payload.new_password)
        db.commit()

    return {"ok": True}

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

@r.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn):
    """
    Envia e-mail de recuperação de senha.
    Gera um token único e envia link por e-mail.
    """
    print(f"\n[FORGOT PASSWORD] Solicitação para: {payload.email}")

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == payload.email).first()

        if not user:
            print(f"[FORGOT PASSWORD] ⚠️  Usuário não encontrado: {payload.email}")
            # Por segurança, sempre retorna sucesso mesmo se o e-mail não existir
            return {"message": "Se o e-mail existir em nossa base, você receberá instruções de recuperação"}

        print(f"[FORGOT PASSWORD] ✓ Usuário encontrado: {user.name}")

        # Invalidar tokens anteriores do usuário
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        db.commit()

        # Gerar novo token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()

        print(f"[FORGOT PASSWORD] ✓ Token gerado: {token[:10]}...")

        # Gerar link de recuperação
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reset-password?token={token}"

        # Enviar e-mail
        try:
            success = email_service.send_password_reset_email(
                to_email=user.email,
                user_name=user.name,
                reset_link=reset_link
            )

            if success:
                print(f"[FORGOT PASSWORD] ✅ E-mail enviado com sucesso!")
            else:
                print(f"[FORGOT PASSWORD] ❌ Falha ao enviar e-mail")
                raise HTTPException(500, "Erro ao enviar e-mail de recuperação")

        except Exception as e:
            print(f"[FORGOT PASSWORD] ❌ Erro: {str(e)}")
            raise HTTPException(500, "Erro ao enviar e-mail de recuperação")

    return {"message": "Se o e-mail existir em nossa base, você receberá instruções de recuperação"}

@r.post("/reset-password")
def reset_password(payload: ResetPasswordIn):
    """
    Redefine a senha usando o token de recuperação.
    """
    print(f"\n[RESET PASSWORD] Tentativa com token: {payload.token[:10]}...")

    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(400, "A senha deve ter no mínimo 6 caracteres")

    with SessionLocal() as db:
        # Buscar token
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == payload.token
        ).first()

        if not reset_token:
            print(f"[RESET PASSWORD] ❌ Token não encontrado")
            raise HTTPException(400, "Token inválido ou expirado")

        # Verificar se token já foi usado
        if reset_token.used:
            print(f"[RESET PASSWORD] ❌ Token já foi usado")
            raise HTTPException(400, "Token inválido ou expirado")

        # Verificar se token expirou
        if datetime.utcnow() > reset_token.expires_at:
            print(f"[RESET PASSWORD] ❌ Token expirado")
            raise HTTPException(400, "Token inválido ou expirado")

        # Buscar usuário
        user = db.get(User, reset_token.user_id)
        if not user:
            print(f"[RESET PASSWORD] ❌ Usuário não encontrado")
            raise HTTPException(404, "Usuário não encontrado")

        print(f"[RESET PASSWORD] ✓ Token válido para: {user.name}")

        # Atualizar senha
        user.password_hash = hash_password(payload.new_password)

        # Marcar token como usado
        reset_token.used = True

        db.commit()

        print(f"[RESET PASSWORD] ✅ Senha atualizada com sucesso!")

    return {"message": "Senha redefinida com sucesso!"}

@r.post("/reset-password-cpf")
def reset_password_cpf(payload: ResetPasswordCpfIn):
    """
    Redefine a senha usando email + CPF (Life Mobile).
    """
    email = (payload.email or "").strip().lower()
    cpf_digits = re.sub(r"\D", "", payload.cpf or "")

    if not email or len(cpf_digits) != 11:
        raise HTTPException(400, "dados invalidos")

    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(400, "A senha deve ter no minimo 6 caracteres")

    with SessionLocal() as db:
        user = (
            db.query(User)
            .filter(func.lower(User.email) == email)
            .first()
        )

        if not user or not user.active or user.role != "mobile_client":
            raise HTTPException(400, "dados invalidos")

        user_cpf = re.sub(r"\D", "", user.cpf or "")
        if user_cpf != cpf_digits:
            raise HTTPException(400, "dados invalidos")

        user.password_hash = hash_password(payload.new_password)
        db.commit()

    return {"message": "Senha redefinida com sucesso!"}
