from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .database import init_db
from .routers import media, schedule, player

# Carregar variáveis de ambiente
load_dotenv()

# Inicializar banco de dados
init_db()

# Criar app FastAPI
app = FastAPI(
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
app.include_router(media.router)
app.include_router(schedule.router)
app.include_router(player.router)

# Servir arquivos estáticos (uploads)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Servir frontend (após build)
DIST_DIR = "../frontend/dist"
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=f"{DIST_DIR}/assets"), name="assets")
    
    @app.get("/")
    async def serve_player():
        """Serve o player (frontend)"""
        return FileResponse(f"{DIST_DIR}/index.html")
    
    @app.get("/admin")
    async def serve_admin():
        """Serve o painel admin (frontend)"""
        return FileResponse(f"{DIST_DIR}/index.html")

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
