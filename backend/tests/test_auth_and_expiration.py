"""
Testes de autenticação (login/token), proteção das rotas do admin e
inativação automática de agendamentos vencidos.
"""
import os
import sys
from datetime import date, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ["ADMIN_USER"] = "admin"
os.environ["ADMIN_PASSWORD"] = "senha-teste"

from app.database import Base, get_db
from app.main import app
from app.models import Media, Schedule
from app.services import auth
from app.services.scheduler import SchedulerService


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def headers(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "senha-teste"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def _media(db):
    m = Media(tipo="imagem", nome="Img", caminho_arquivo="uploads/x.png", ativo=True)
    db.add(m)
    db.commit()
    return m


def _schedule(db, media, data_fim, hora_fim, ativo=True):
    s = Schedule(
        media_id=media.id, regiao=2,
        data_inicio=data_fim - timedelta(days=5), data_fim=data_fim,
        hora_inicio=time(0, 0), hora_fim=hora_fim, ativo=ativo,
    )
    db.add(s)
    db.commit()
    return s


# ---------- Autenticação ----------

def test_login_invalido(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "errada"})
    assert r.status_code == 401


def test_login_valido_retorna_token(client, headers):
    assert client.get("/api/auth/me", headers=headers).json()["username"] == "admin"


def test_rotas_admin_exigem_token(client):
    assert client.get("/api/media/").status_code == 401
    assert client.get("/api/schedule/").status_code == 401
    assert client.get("/api/media/stats/summary").status_code == 401
    assert client.put("/api/schedule/reorder", json=[]).status_code == 401
    assert client.delete("/api/media/1").status_code == 401


def test_token_invalido_ou_adulterado(client, headers):
    token = headers["Authorization"].split()[1]
    assert client.get("/api/media/", headers={"Authorization": "Bearer lixo"}).status_code == 401
    assert auth.verify_token(token[:-4] + "AAAA") is None


def test_token_expirado():
    token = auth.create_token("admin", now=0)
    assert auth.verify_token(token) is None
    assert auth.verify_token(auth.create_token("admin")) == "admin"


def test_rotas_do_player_continuam_publicas(client):
    assert client.get("/api/player/active-content/region/1").status_code == 200
    assert client.get("/api/player/health").status_code == 200
    assert client.get("/api/health").status_code == 200


def test_rotas_estaticas_nao_sao_capturadas_por_id(client, headers):
    assert client.get("/api/media/stats/summary", headers=headers).status_code == 200
    assert client.put("/api/schedule/reorder", json=[], headers=headers).status_code == 200


# ---------- Inativação de vencidos ----------

def test_inativa_data_fim_passada(db):
    s = _schedule(db, _media(db), date.today() - timedelta(days=1), time(23, 59))
    assert SchedulerService.deactivate_expired(db) == 1
    db.refresh(s)
    assert s.ativo is False


def test_hoje_depende_da_hora_fim(db):
    s = _schedule(db, _media(db), date(2030, 1, 10), time(12, 0))
    assert SchedulerService.deactivate_expired(db, now=datetime(2030, 1, 10, 11, 59)) == 0
    db.refresh(s)
    assert s.ativo is True
    assert SchedulerService.deactivate_expired(db, now=datetime(2030, 1, 10, 12, 1)) == 1
    db.refresh(s)
    assert s.ativo is False


def test_nao_mexe_em_vigentes_nem_ja_inativos(db):
    m = _media(db)
    futuro = _schedule(db, m, date.today() + timedelta(days=3), time(23, 59))
    ja_inativo = _schedule(db, m, date.today() - timedelta(days=3), time(10, 0), ativo=False)
    assert SchedulerService.deactivate_expired(db) == 0
    db.refresh(futuro)
    db.refresh(ja_inativo)
    assert futuro.ativo is True and ja_inativo.ativo is False


def test_listagem_inativa_vencidos_e_pode_reativar(client, db, headers):
    s = _schedule(db, _media(db), date.today() - timedelta(days=1), time(10, 0))
    itens = client.get("/api/schedule/", headers=headers).json()
    assert itens[0]["ativo"] is False

    nova_data = (date.today() + timedelta(days=2)).isoformat()
    r = client.put(
        f"/api/schedule/{s.id}",
        json={"data_fim": nova_data, "ativo": True},
        headers=headers,
    )
    assert r.status_code == 200
    assert client.get("/api/schedule/", headers=headers).json()[0]["ativo"] is True
