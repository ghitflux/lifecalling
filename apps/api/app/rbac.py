from fastapi import Depends, HTTPException
from .security import get_current_user

def require_roles(*roles):
    def dep(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(403, "forbidden")
        return user
    return dep
