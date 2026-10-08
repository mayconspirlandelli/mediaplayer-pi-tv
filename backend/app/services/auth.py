import base64
import hashlib
import hmac
import os
import time
from typing import Optional

from fastapi import Header, HTTPException

TOKEN_TTL = int(os.getenv("AUTH_TOKEN_TTL", str(12 * 3600)))  # 12 horas


def _admin_user() -> str:
    return os.getenv("ADMIN_USER", "admin")


def _admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin123")


def _secret() -> bytes:
    # Sem SECRET_KEY definida, deriva da senha do admin (trocar a senha invalida os tokens)
    return os.getenv("SECRET_KEY", "mediaplayer:" + _admin_password()).encode()


def _sign(payload: str) -> str:
    return hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()


def verify_credentials(username: str, password: str) -> bool:
    user_ok = hmac.compare_digest(username.encode(), _admin_user().encode())
    pass_ok = hmac.compare_digest(password.encode(), _admin_password().encode())
    return user_ok and pass_ok


def create_token(username: str, now: Optional[float] = None) -> str:
    expires = int((now if now is not None else time.time()) + TOKEN_TTL)
    payload = f"{username}|{expires}"
    raw = f"{payload}|{_sign(payload)}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def verify_token(token: str, now: Optional[float] = None) -> Optional[str]:
    """Retorna o usuário se o token for válido e não expirado, senão None."""
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        username, expires, signature = raw.rsplit("|", 2)
        payload = f"{username}|{expires}"
        if not hmac.compare_digest(signature, _sign(payload)):
            return None
        if int(expires) < (now if now is not None else time.time()):
            return None
        return username
    except Exception:
        return None


def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """Dependência FastAPI: exige 'Authorization: Bearer <token>'."""
    if authorization and authorization.lower().startswith("bearer "):
        username = verify_token(authorization[7:].strip())
        if username:
            return username
    raise HTTPException(
        status_code=401,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
