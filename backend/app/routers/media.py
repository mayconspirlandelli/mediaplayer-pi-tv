from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models import Media, Schedule

router = APIRouter(prefix="/api/media", tags=["media"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Tipos de arquivo permitidos
ALLOWED_VIDEO = {".mp4", ".webm", ".avi", ".mov"}
ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

@router.get("/")
async def list_media(
    tipo: Optional[str] = None,
    ativo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Lista todas as mídias com filtros opcionais"""
    query = db.query(Media)
    
    if tipo:
        query = query.filter(Media.tipo == tipo)
    if ativo is not None:
        query = query.filter(Media.ativo == ativo)
    
    medias = query.order_by(Media.criado_em.desc()).all()
    
    return [
        {
            "id": m.id,
            "tipo": m.tipo,
            "nome": m.nome,
            "caminho_arquivo": m.caminho_arquivo,
            "texto": m.texto,
            "ativo": m.ativo,
            "criado_em": m.criado_em.isoformat(),
            "schedules_count": len(m.schedules)
        }
        for m in medias
    ]

@router.get("/{media_id}")
async def get_media(media_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma mídia específica"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    return {
        "id": media.id,
        "tipo": media.tipo,
        "nome": media.nome,
        "caminho_arquivo": media.caminho_arquivo,
        "texto": media.texto,
        "ativo": media.ativo,
        "criado_em": media.criado_em.isoformat(),
        "schedules": [
            {
                "id": s.id,
                "regiao": s.regiao,
                "data_inicio": s.data_inicio.isoformat(),
                "data_fim": s.data_fim.isoformat(),
                "hora_inicio": s.hora_inicio.isoformat(),
                "hora_fim": s.hora_fim.isoformat(),
                "duracao": s.duracao,
                "prioridade": s.prioridade,
                "ativo": s.ativo
            }
            for s in media.schedules
        ]
    }

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    tipo: str = Form(...),
    nome: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload de arquivo de vídeo ou imagem"""
    
    if tipo not in ["video", "imagem"]:
        raise HTTPException(status_code=400, detail="Tipo deve ser 'video' ou 'imagem'")
    
    # Validar extensão
    file_ext = os.path.splitext(file.filename)[1].lower()
    if tipo == "video" and file_ext not in ALLOWED_VIDEO:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato não permitido. Use: {', '.join(ALLOWED_VIDEO)}"
        )
    if tipo == "imagem" and file_ext not in ALLOWED_IMAGE:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não permitido. Use: {', '.join(ALLOWED_IMAGE)}"
        )
    
    # Gerar nome único
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
    
    # Criar registro no banco
    media = Media(
        tipo=tipo,
        nome=nome or file.filename,
        caminho_arquivo=file_path,
        ativo=True
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return {
        "id": media.id,
        "tipo": media.tipo,
        "nome": media.nome,
        "caminho_arquivo": media.caminho_arquivo,
        "message": "Upload realizado com sucesso"
    }

@router.post("/text")
async def create_text_media(
    nome: str = Form(...),
    texto: str = Form(...),
    db: Session = Depends(get_db)
):
    """Cria uma mídia de texto"""
    
    if not texto or len(texto) < 3:
        raise HTTPException(status_code=400, detail="Texto muito curto")
    
    media = Media(
        tipo="texto",
        nome=nome,
        texto=texto,
        ativo=True
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return {
        "id": media.id,
        "tipo": media.tipo,
        "nome": media.nome,
        "texto": media.texto,
        "message": "Texto criado com sucesso"
    }

@router.post("/youtube")
async def create_youtube_media(
    nome: str = Form(...),
    url: str = Form(...),
    db: Session = Depends(get_db)
):
    """Cria uma mídia de vídeo do YouTube"""
    
    if not url or ("youtube.com" not in url and "youtu.be" not in url):
        raise HTTPException(status_code=400, detail="Link do YouTube inválido")
    
    media = Media(
        tipo="youtube",
        nome=nome,
        caminho_arquivo=url,  # Armazenamos a URL aqui
        ativo=True
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return {
        "id": media.id,
        "tipo": media.tipo,
        "nome": media.nome,
        "url": media.caminho_arquivo,
        "message": "Link do YouTube cadastrado com sucesso"
    }

@router.post("/link")
async def create_link_media(
    nome: str = Form(...),
    url: str = Form(...),
    db: Session = Depends(get_db)
):
    """Cria uma mídia de link genérico (Instagram, TikTok, etc.)"""
    
    if not url:
        raise HTTPException(status_code=400, detail="URL é obrigatória")
    
    media = Media(
        tipo="link",
        nome=nome,
        caminho_arquivo=url,
        ativo=True
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return {
        "id": media.id,
        "tipo": media.tipo,
        "nome": media.nome,
        "url": media.caminho_arquivo,
        "message": "Link cadastrado com sucesso"
    }

@router.put("/{media_id}")
async def update_media(
    media_id: int,
    nome: Optional[str] = Form(None),
    texto: Optional[str] = Form(None),
    ativo: Optional[bool] = Form(None),
    db: Session = Depends(get_db)
):
    """Atualiza uma mídia existente"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    if nome:
        media.nome = nome
    if texto and media.tipo == "texto":
        media.texto = texto
    if ativo is not None:
        media.ativo = ativo
    
    db.commit()
    db.refresh(media)
    
    return {
        "id": media.id,
        "message": "Mídia atualizada com sucesso"
    }

@router.delete("/{media_id}")
async def delete_media(media_id: int, db: Session = Depends(get_db)):
    """Remove uma mídia e seus agendamentos"""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    # Remover arquivo físico se existir
    if media.caminho_arquivo and os.path.exists(media.caminho_arquivo):
        try:
            os.remove(media.caminho_arquivo)
        except Exception as e:
            print(f"Erro ao remover arquivo: {e}")
    
    db.delete(media)
    db.commit()
    
    return {"message": "Mídia removida com sucesso"}

@router.get("/stats/summary")
async def get_stats(db: Session = Depends(get_db)):
    """Retorna estatísticas gerais das mídias"""
    total = db.query(Media).count()
    videos = db.query(Media).filter(Media.tipo == "video").count()
    imagens = db.query(Media).filter(Media.tipo == "imagem").count()
    textos = db.query(Media).filter(Media.tipo == "texto").count()
    youtube = db.query(Media).filter(Media.tipo == "youtube").count()
    ativos = db.query(Media).filter(Media.ativo == True).count()
    
    return {
        "total": total,
        "videos": videos,
        "imagens": imagens,
        "youtube": youtube,
        "textos": textos,
        "ativos": ativos,
        "inativos": total - ativos
    }
