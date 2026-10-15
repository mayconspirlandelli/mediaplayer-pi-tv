"""
Sincronização entre o servidor central (Railway) e o Raspberry Pi.

- Servidor: com SYNC_TOKEN definido, expõe /api/sync/export (mídias + agendamentos)
  e /api/sync/frontend (build do frontend em .tar.gz).
- Pi: com SYNC_URL + SYNC_TOKEN, o backend local baixa periodicamente esses dados,
  os arquivos de mídia e o frontend. O player do Pi lê só o banco/arquivos locais,
  então continua funcionando sem internet com o último conteúdo sincronizado.

Uso manual no Pi (a partir de backend/): python -m app.services.sync
"""
import asyncio
import hashlib
import io
import json
import os
import shutil
import tarfile
from datetime import date, datetime, time
from typing import Dict, Optional, Set

import httpx
from sqlalchemy.orm import Session

from ..models import Media, Schedule

VERSION_FILE = ".versao"
FILE_TYPES = {"video", "imagem"}

# Hash do último conteúdo aplicado no banco (evita reescrever a cada ciclo)
_last_digest: Optional[str] = None


def upload_dir() -> str:
    return os.getenv("UPLOAD_DIR", "uploads")


def dist_dir() -> str:
    return os.getenv("FRONTEND_DIST", "../frontend/dist")


def sync_config() -> Optional[Dict]:
    """Retorna a configuração do modo Pi, ou None se a sincronização estiver desligada."""
    url = os.getenv("SYNC_URL", "").rstrip("/")
    token = os.getenv("SYNC_TOKEN", "")
    if not url or not token:
        return None
    return {
        "url": url,
        "token": token,
        "interval": int(os.getenv("SYNC_INTERVAL", "60")),
    }


# ---------- Servidor: exportação ----------

def _row_to_dict(obj) -> Dict:
    data = {}
    for col in obj.__table__.columns:
        value = getattr(obj, col.name)
        if isinstance(value, (date, time)):  # datetime é subclasse de date
            value = value.isoformat()
        data[col.name] = value
    return data


def _dict_to_row(model, data: Dict):
    values = {}
    for col in model.__table__.columns:
        value = data.get(col.name)
        if isinstance(value, str) and col.type.python_type in (date, time, datetime):
            value = col.type.python_type.fromisoformat(value)
        values[col.name] = value
    return model(**values)


def frontend_version() -> Optional[str]:
    """Hash de todos os arquivos do build do frontend (None se não houver build)."""
    root = dist_dir()
    if not os.path.isdir(root):
        return None
    digest = hashlib.sha256()
    for folder, _, files in sorted(os.walk(root)):
        for name in sorted(files):
            if name == VERSION_FILE:
                continue
            path = os.path.join(folder, name)
            digest.update(os.path.relpath(path, root).encode())
            with open(path, "rb") as f:
                digest.update(f.read())
    return digest.hexdigest()


def export_data(db: Session) -> Dict:
    return {
        "media": [_row_to_dict(m) for m in db.query(Media).order_by(Media.id).all()],
        "schedules": [_row_to_dict(s) for s in db.query(Schedule).order_by(Schedule.id).all()],
        "frontend_versao": frontend_version(),
    }


def frontend_tarball() -> Optional[bytes]:
    root = dist_dir()
    if not os.path.isdir(root):
        return None
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for name in sorted(os.listdir(root)):
            if name != VERSION_FILE:
                tar.add(os.path.join(root, name), arcname=name)
    return buffer.getvalue()


# ---------- Pi: importação ----------

def _content_digest(data: Dict) -> str:
    payload = json.dumps([data["media"], data["schedules"]], sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


def _local_name(caminho: str) -> str:
    return os.path.basename(caminho.replace("\\", "/"))


def _download(client: httpx.Client, url_path: str, dest: str):
    """Baixa para um arquivo .part e renomeia no fim (o player nunca vê arquivo pela metade)."""
    tmp = dest + ".part"
    with client.stream("GET", url_path) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    os.replace(tmp, dest)


def _sync_media_files(client: httpx.Client, media: list) -> Set[str]:
    """Baixa os arquivos que faltam e devolve o conjunto de nomes em uso."""
    os.makedirs(upload_dir(), exist_ok=True)
    wanted = set()
    for m in media:
        caminho = m.get("caminho_arquivo")
        if m.get("tipo") not in FILE_TYPES or not caminho or caminho.startswith("http"):
            continue
        name = _local_name(caminho)
        wanted.add(name)
        m["caminho_arquivo"] = f"uploads/{name}"
        dest = os.path.join(upload_dir(), name)
        if not os.path.exists(dest):
            print(f"⬇️  Sync: baixando {name}")
            _download(client, f"/uploads/{name}", dest)
    return wanted


def _remove_stale_files(wanted: Set[str]):
    folder = upload_dir()
    for name in os.listdir(folder):
        path = os.path.join(folder, name)
        if name not in wanted and os.path.isfile(path):
            os.remove(path)


def _safe_extract(tar: tarfile.TarFile, dest: str):
    for member in tar.getmembers():
        target = os.path.realpath(os.path.join(dest, member.name))
        if not target.startswith(os.path.realpath(dest) + os.sep):
            raise ValueError(f"Caminho inválido no pacote do frontend: {member.name}")
        if not (member.isfile() or member.isdir()):
            raise ValueError(f"Tipo de arquivo inválido no pacote do frontend: {member.name}")
    if hasattr(tarfile, "data_filter"):  # Python 3.12+ (e 3.11.4+)
        tar.extractall(dest, filter="data")
    else:
        tar.extractall(dest)


def _sync_frontend(client: httpx.Client, versao: Optional[str]):
    if not versao:
        return
    root = dist_dir()
    version_path = os.path.join(root, VERSION_FILE)
    if os.path.exists(version_path):
        with open(version_path) as f:
            if f.read().strip() == versao:
                return

    print("⬇️  Sync: atualizando frontend")
    r = client.get("/api/sync/frontend")
    r.raise_for_status()
    new_dir, old_dir = root + ".new", root + ".old"
    shutil.rmtree(new_dir, ignore_errors=True)
    os.makedirs(new_dir)
    with tarfile.open(fileobj=io.BytesIO(r.content), mode="r:gz") as tar:
        _safe_extract(tar, new_dir)
    with open(os.path.join(new_dir, VERSION_FILE), "w") as f:
        f.write(versao)

    shutil.rmtree(old_dir, ignore_errors=True)
    if os.path.exists(root):
        os.rename(root, old_dir)
    os.rename(new_dir, root)
    shutil.rmtree(old_dir, ignore_errors=True)


def _replace_content(db: Session, data: Dict):
    try:
        db.query(Schedule).delete()
        db.query(Media).delete()
        db.add_all([_dict_to_row(Media, m) for m in data["media"]])
        db.add_all([_dict_to_row(Schedule, s) for s in data["schedules"]])
        db.commit()
    except Exception:
        db.rollback()
        raise


def sync_once(db: Session) -> bool:
    """
    Executa um ciclo de sincronização. Retorna True se o conteúdo do banco mudou.
    Em caso de erro (sem internet etc.) levanta exceção e mantém o conteúdo atual.
    """
    global _last_digest
    config = sync_config()
    if not config:
        raise RuntimeError("Sincronização desligada: defina SYNC_URL e SYNC_TOKEN")

    headers = {"Authorization": f"Bearer {config['token']}"}
    timeout = httpx.Timeout(30.0, read=300.0)
    with httpx.Client(base_url=config["url"], headers=headers, timeout=timeout,
                      follow_redirects=True) as client:
        r = client.get("/api/sync/export")
        r.raise_for_status()
        data = r.json()
        _sync_frontend(client, data.get("frontend_versao"))
        wanted = _sync_media_files(client, data["media"])

    changed = False
    digest = _content_digest(data)
    if digest != _last_digest:
        _replace_content(db, data)
        _last_digest = digest
        changed = True
        print(f"✓ Sync: {len(data['media'])} mídias, {len(data['schedules'])} agendamentos")

    _remove_stale_files(wanted)
    return changed


def _run_once_with_session():
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        return sync_once(db)
    finally:
        db.close()


async def sync_loop():
    """Tarefa de fundo do backend no Pi: sincroniza a cada SYNC_INTERVAL segundos."""
    config = sync_config()
    print(f"🔄 Sync ativo com {config['url']} a cada {config['interval']}s")
    while True:
        try:
            await asyncio.to_thread(_run_once_with_session)
        except Exception as e:
            print(f"⚠️  Sync falhou (mantendo conteúdo local): {e}")
        await asyncio.sleep(config["interval"])


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    from ..database import init_db
    init_db()
    _run_once_with_session()
