from fastapi import APIRouter, Response, HTTPException, Depends
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

@r.post("/logout")
def logout(resp: Response):
    resp.delete_cookie("access")
    resp.delete_cookie("refresh")
    resp.delete_cookie("role")
    return {"ok": True}
