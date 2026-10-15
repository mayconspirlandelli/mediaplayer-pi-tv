import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .database import init_db
from .routers import media, schedule, player, auth, sync
from .services.sync import sync_config, sync_loop, dist_dir

# Carregar variáveis de ambiente
load_dotenv()

# Inicializar banco de dados
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # No Raspberry Pi (SYNC_URL + SYNC_TOKEN), sincroniza com o servidor em segundo plano
    task = asyncio.create_task(sync_loop()) if sync_config() else None
    yield
    if task:
        task.cancel()

# Criar app FastAPI
app = FastAPI(
    lifespan=lifespan,
    title="Media Player API",
    description="API para gerenciamento de media player digital signage",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(schedule.router)
app.include_router(player.router)
app.include_router(sync.router)

# Servir arquivos estáticos (uploads)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Servir frontend (após build). No Pi o build chega pela sincronização,
# por isso os caminhos são verificados a cada requisição.
DIST_DIR = dist_dir()
app.mount("/assets", StaticFiles(directory=f"{DIST_DIR}/assets", check_dir=False), name="assets")

def _index_html():
    index = os.path.join(DIST_DIR, "index.html")
    if not os.path.exists(index):
        raise HTTPException(status_code=503, detail="Frontend ainda não disponível")
    return FileResponse(index)

@app.get("/")
async def serve_player():
    """Serve o player (frontend)"""
    return _index_html()

@app.get("/admin")
async def serve_admin():
    """Serve o painel admin (frontend)"""
    return _index_html()

@app.get("/test_player.html")
async def serve_test_player():
    """Serve página de teste do player"""
    return FileResponse("test_player.html")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "mediaplayer-backend"
    }

@app.get("/{filename}")
async def serve_frontend_file(filename: str):
    """Arquivos da raiz do build (ex.: fundo_tv_inf.png, vindos de frontend/public)"""
    path = os.path.join(DIST_DIR, filename)
    if filename.startswith(".") or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(path)

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"""
    ╔════════════════════════════════════════╗
    ║   Media Player Backend Started         ║
    ╠════════════════════════════════════════╣
    ║   Player:  http://{host}:{port}       ║
    ║   Admin:   http://{host}:{port}/admin ║
    ║   API:     http://{host}:{port}/docs  ║
    ╚════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
