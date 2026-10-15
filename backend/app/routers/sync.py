import hmac
import os
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import sync


def require_sync_token(authorization: Optional[str] = Header(None)):
    """Dependência FastAPI: exige 'Authorization: Bearer <SYNC_TOKEN>'."""
    token = os.getenv("SYNC_TOKEN", "")
    if not token:
        raise HTTPException(status_code=503, detail="Sincronização desativada (SYNC_TOKEN não configurado)")
    if not authorization or not hmac.compare_digest(authorization.encode(), f"Bearer {token}".encode()):
        raise HTTPException(status_code=401, detail="Token de sincronização inválido")


router = APIRouter(prefix="/api/sync", tags=["sync"], dependencies=[Depends(require_sync_token)])


@router.get("/export")
async def export_content(db: Session = Depends(get_db)):
    """Mídias, agendamentos e versão do frontend para o Raspberry Pi"""
    return sync.export_data(db)


@router.get("/frontend")
async def export_frontend():
    """Build do frontend (frontend/dist) em .tar.gz"""
    data = sync.frontend_tarball()
    if data is None:
        raise HTTPException(status_code=404, detail="Build do frontend não encontrado")
    return Response(content=data, media_type="application/gzip")
