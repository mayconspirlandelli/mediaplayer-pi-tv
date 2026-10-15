"""
Testes da sincronização servidor (Railway) -> Raspberry Pi.
"""
import contextlib
import os
import sys
from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import main
from app.database import Base, get_db
from app.main import app
from app.models import Media, Schedule
from app.services import sync

TOKEN = "token-de-teste"


def _session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


@pytest.fixture
def servidor():
    db = _session()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()
    db.close()


@pytest.fixture
def pi(tmp_path, monkeypatch):
    monkeypatch.setenv("SYNC_TOKEN", TOKEN)
    monkeypatch.setenv("SYNC_URL", "http://testserver")
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("FRONTEND_DIST", str(tmp_path / "sem-build"))
    monkeypatch.setattr(sync, "_last_digest", None)
    # O "servidor" do teste é o próprio app, via TestClient. nullcontext evita rodar o
    # lifespan do app (que iniciaria o sync de fundo contra o banco real).
    monkeypatch.setattr(
        sync.httpx, "Client",
        lambda **kw: contextlib.nullcontext(TestClient(app, headers=kw["headers"])),
    )
    db = _session()
    yield db
    db.close()


@pytest.fixture
def arquivo_servidor():
    """Arquivo de mídia no diretório de uploads servido pelo app."""
    name = "teste_sync_imagem.png"
    path = os.path.join(main.UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(b"conteudo-da-imagem")
    yield name
    os.remove(path)


def _conteudo(db, arquivo):
    m = Media(tipo="imagem", nome="Img", caminho_arquivo=f"uploads/{arquivo}", ativo=True)
    t = Media(tipo="texto", nome="Aviso", texto="Olá", ativo=True)
    db.add_all([m, t])
    db.commit()
    db.add(Schedule(
        media_id=m.id, regiao=2, data_inicio=date(2026, 1, 1), data_fim=date(2026, 12, 31),
        hora_inicio=time(8, 0), hora_fim=time(18, 0), duracao=15, prioridade=2,
    ))
    db.commit()
    return m


def test_export_exige_token(servidor, monkeypatch):
    client = TestClient(app)
    monkeypatch.delenv("SYNC_TOKEN", raising=False)
    assert client.get("/api/sync/export").status_code == 503

    monkeypatch.setenv("SYNC_TOKEN", TOKEN)
    assert client.get("/api/sync/export").status_code == 401
    assert client.get("/api/sync/export", headers={"Authorization": "Bearer errado"}).status_code == 401
    r = client.get("/api/sync/export", headers={"Authorization": f"Bearer {TOKEN}"})
    assert r.status_code == 200
    assert r.json()["media"] == []


def test_sync_copia_conteudo_e_arquivos(servidor, pi, arquivo_servidor):
    m = _conteudo(servidor, arquivo_servidor)

    assert sync.sync_once(pi) is True

    local = pi.query(Media).filter(Media.id == m.id).one()
    assert local.caminho_arquivo == f"uploads/{arquivo_servidor}"
    s = pi.query(Schedule).one()
    assert (s.media_id, s.regiao, s.duracao, s.prioridade) == (m.id, 2, 15, 2)
    assert s.hora_inicio == time(8, 0) and s.data_fim == date(2026, 12, 31)
    with open(os.path.join(os.environ["UPLOAD_DIR"], arquivo_servidor), "rb") as f:
        assert f.read() == b"conteudo-da-imagem"

    # Sem mudanças no servidor, o banco local não é reescrito
    assert sync.sync_once(pi) is False


def test_sync_remove_o_que_saiu_do_servidor(servidor, pi, arquivo_servidor):
    m = _conteudo(servidor, arquivo_servidor)
    sync.sync_once(pi)

    servidor.query(Schedule).delete()
    servidor.delete(m)
    servidor.commit()
    assert sync.sync_once(pi) is True

    assert pi.query(Schedule).count() == 0
    assert [x.tipo for x in pi.query(Media).all()] == ["texto"]
    assert os.listdir(os.environ["UPLOAD_DIR"]) == []


def test_sync_sem_servidor_mantem_conteudo(servidor, pi, arquivo_servidor, monkeypatch):
    _conteudo(servidor, arquivo_servidor)
    sync.sync_once(pi)

    def offline(**kw):
        raise sync.httpx.ConnectError("sem internet")

    monkeypatch.setattr(sync.httpx, "Client", offline)
    with pytest.raises(sync.httpx.ConnectError):
        sync.sync_once(pi)
    assert pi.query(Media).count() == 2
    assert os.listdir(os.environ["UPLOAD_DIR"]) == [arquivo_servidor]


def test_sync_frontend(tmp_path, monkeypatch):
    origem = tmp_path / "origem"
    (origem / "assets").mkdir(parents=True)
    (origem / "index.html").write_text("<html>v1</html>")
    (origem / "assets" / "index-abc.js").write_text("console.log(1)")
    monkeypatch.setenv("FRONTEND_DIST", str(origem))
    versao = sync.frontend_version()
    pacote = sync.frontend_tarball()

    chamadas = []

    class FakeResponse:
        content = pacote

        def raise_for_status(self):
            pass

    class FakeClient:
        def get(self, path):
            chamadas.append(path)
            return FakeResponse()

    destino = tmp_path / "destino"
    monkeypatch.setenv("FRONTEND_DIST", str(destino))
    sync._sync_frontend(FakeClient(), versao)
    assert (destino / "index.html").read_text() == "<html>v1</html>"
    assert (destino / "assets" / "index-abc.js").exists()
    assert sync.frontend_version() == versao

    # Mesma versão: não baixa de novo
    sync._sync_frontend(FakeClient(), versao)
    assert chamadas == ["/api/sync/frontend"]
