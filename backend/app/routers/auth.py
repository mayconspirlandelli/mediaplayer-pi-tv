from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..services.auth import create_token, require_auth, verify_credentials

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginData(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(data: LoginData):
    """Valida usuário/senha do admin e devolve um token Bearer"""
    if not verify_credentials(data.username, data.password):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return {"token": create_token(data.username), "username": data.username}


@router.get("/me")
async def me(username: str = Depends(require_auth)):
    """Confirma que o token ainda é válido"""
    return {"username": username}
