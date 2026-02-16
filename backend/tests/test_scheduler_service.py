"""
Testes unitários para o serviço SchedulerService
"""
import pytest
from datetime import datetime, date, time, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base
from app.models import Media, Schedule
from app.services.scheduler import SchedulerService


# Configuração do banco de dados de teste
@pytest.fixture(scope="function")
def test_db():
    """
    Cria um banco de dados em memória para cada teste
    """
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Criar todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_video_media(test_db):
    """
    Cria uma mídia de teste do tipo video
    """
    media = Media(
        tipo="video",
        nome="Video Teste",
        caminho_arquivo="/uploads/video_teste.mp4",
        ativo=True
    )
    test_db.add(media)
    test_db.commit()
    test_db.refresh(media)
    return media


@pytest.fixture
def sample_image_media(test_db):
    """
    Cria uma mídia de teste do tipo imagem
    """
    media = Media(
        tipo="imagem",
        nome="Imagem Teste",
        caminho_arquivo="/uploads/imagem_teste.jpg",
        ativo=True
    )
    test_db.add(media)
    test_db.commit()
    test_db.refresh(media)
    return media


@pytest.fixture
def sample_text_media(test_db):
    """
    Cria uma mídia de teste do tipo texto
    """
    media = Media(
        tipo="texto",
        nome="Texto Teste",
        texto="Este é um texto de teste",
        ativo=True
    )
    test_db.add(media)
    test_db.commit()
    test_db.refresh(media)
    return media


class TestGetActiveContent:
    """
    Testes para o método get_active_content
    """
    
    def test_get_active_content_with_video_and_image(self, test_db, sample_video_media, sample_image_media):
        """
        Testa se get_active_content retorna corretamente conteúdo ativo de vídeo e imagem
        """
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()
        current_weekday = (now.weekday() + 1) % 7  # Ajustar para 0=domingo
        
        # Criar agendamento de vídeo ativo para região 1
        schedule_video = Schedule(
            media_id=sample_video_media.id,
            data_inicio=current_date - timedelta(days=1),  # Começou ontem
            data_fim=current_date + timedelta(days=1),  # Termina amanhã
            hora_inicio=time(0, 0, 0),  # 00:00
            hora_fim=time(23, 59, 59),  # 23:59
            duracao=30,
            dias_semana="0,1,2,3,4,5,6",  # Todos os dias
            prioridade=1,
            regiao=1,  # Região de vídeo
            ativo=True
        )
        test_db.add(schedule_video)
        
        # Criar agendamento de imagem ativo para região 2
        schedule_image = Schedule(
            media_id=sample_image_media.id,
            data_inicio=current_date - timedelta(days=1),
            data_fim=current_date + timedelta(days=1),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=10,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=1,
            regiao=2,  # Região de imagem
            ativo=True
        )
        test_db.add(schedule_image)
        test_db.commit()
        
        # Executar o método
        result = SchedulerService.get_active_content(test_db)
        
        # Verificações
        assert result is not None
        assert "video" in result
        assert "imagem" in result
        assert "texto" in result
        assert "timestamp" in result
        
        # Verificar conteúdo de vídeo
        assert result["video"] is not None
        assert result["video"]["id"] == sample_video_media.id
        assert result["video"]["tipo"] == "video"
        assert result["video"]["nome"] == "Video Teste"
        assert result["video"]["caminho_arquivo"] == "/uploads/video_teste.mp4"
        assert result["video"]["duracao"] == 30
        assert result["video"]["schedule_id"] == schedule_video.id
        
        # Verificar conteúdo de imagem
        assert result["imagem"] is not None
        assert result["imagem"]["id"] == sample_image_media.id
        assert result["imagem"]["tipo"] == "imagem"
        assert result["imagem"]["nome"] == "Imagem Teste"
        assert result["imagem"]["caminho_arquivo"] == "/uploads/imagem_teste.jpg"
        assert result["imagem"]["duracao"] == 10
        assert result["imagem"]["schedule_id"] == schedule_image.id
        
        # Verificar que texto está vazio (não foi criado agendamento)
        assert result["texto"] is None
    
    def test_get_active_content_no_schedules(self, test_db):
        """
        Testa se get_active_content retorna None quando não há agendamentos ativos
        """
        result = SchedulerService.get_active_content(test_db)
        
        assert result is not None
        assert result["video"] is None
        assert result["imagem"] is None
        assert result["texto"] is None
        assert "timestamp" in result
    
    def test_get_active_content_inactive_schedule(self, test_db, sample_video_media):
        """
        Testa se get_active_content ignora agendamentos inativos
        """
        now = datetime.now()
        current_date = now.date()
        
        # Criar agendamento INATIVO
        schedule = Schedule(
            media_id=sample_video_media.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=1),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=30,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=1,
            regiao=1,
            ativo=False  # INATIVO
        )
        test_db.add(schedule)
        test_db.commit()
        
        result = SchedulerService.get_active_content(test_db)
        
        # Vídeo deve ser None porque o agendamento está inativo
        assert result["video"] is None
    
    def test_get_active_content_inactive_media(self, test_db, sample_video_media):
        """
        Testa se get_active_content ignora mídias inativas
        """
        now = datetime.now()
        current_date = now.date()
        
        # Desativar a mídia
        sample_video_media.ativo = False
        test_db.commit()
        
        # Criar agendamento ativo
        schedule = Schedule(
            media_id=sample_video_media.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=1),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=30,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=1,
            regiao=1,
            ativo=True
        )
        test_db.add(schedule)
        test_db.commit()
        
        result = SchedulerService.get_active_content(test_db)
        
        # Vídeo deve ser None porque a mídia está inativa
        assert result["video"] is None
    
    def test_get_active_content_wrong_weekday(self, test_db, sample_video_media):
        """
        Testa se get_active_content respeita os dias da semana configurados
        """
        now = datetime.now()
        current_date = now.date()
        current_weekday = (now.weekday() + 1) % 7
        
        # Criar um dia diferente do atual
        wrong_weekday = (current_weekday + 1) % 7
        
        # Criar agendamento apenas para um dia específico (não hoje)
        schedule = Schedule(
            media_id=sample_video_media.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=7),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=30,
            dias_semana=str(wrong_weekday),  # Apenas um dia diferente de hoje
            prioridade=1,
            regiao=1,
            ativo=True
        )
        test_db.add(schedule)
        test_db.commit()
        
        result = SchedulerService.get_active_content(test_db)
        
        # Vídeo deve ser None porque hoje não está nos dias configurados
        assert result["video"] is None
    
    def test_get_active_content_priority(self, test_db, sample_video_media):
        """
        Testa se get_active_content retorna o conteúdo de maior prioridade
        """
        now = datetime.now()
        current_date = now.date()
        
        # Criar mídia adicional
        media2 = Media(
            tipo="video",
            nome="Video Prioridade Baixa",
            caminho_arquivo="/uploads/video2.mp4",
            ativo=True
        )
        test_db.add(media2)
        test_db.commit()
        test_db.refresh(media2)
        
        # Criar agendamento com prioridade baixa
        schedule_low = Schedule(
            media_id=media2.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=1),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=30,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=1,  # Prioridade baixa
            regiao=1,
            ativo=True
        )
        test_db.add(schedule_low)
        
        # Criar agendamento com prioridade alta
        schedule_high = Schedule(
            media_id=sample_video_media.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=1),
            hora_inicio=time(0, 0, 0),
            hora_fim=time(23, 59, 59),
            duracao=30,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=10,  # Prioridade alta
            regiao=1,
            ativo=True
        )
        test_db.add(schedule_high)
        test_db.commit()
        
        result = SchedulerService.get_active_content(test_db)
        
        # Deve retornar o vídeo com maior prioridade
        assert result["video"] is not None
        assert result["video"]["id"] == sample_video_media.id
        assert result["video"]["nome"] == "Video Teste"
    
    def test_get_active_content_outside_time_range(self, test_db, sample_image_media):
        """
        Testa se get_active_content ignora agendamentos fora do horário
        """
        now = datetime.now()
        current_date = now.date()
        current_time = now.time()
        
        # Criar horário que já passou (se for depois do meio-dia, criar para manhã)
        if current_time.hour >= 12:
            hora_inicio = time(8, 0, 0)
            hora_fim = time(11, 59, 59)
        else:
            # Se for antes do meio-dia, criar para tarde
            hora_inicio = time(14, 0, 0)
            hora_fim = time(18, 0, 0)
        
        # Criar agendamento fora do horário atual
        schedule = Schedule(
            media_id=sample_image_media.id,
            data_inicio=current_date,
            data_fim=current_date + timedelta(days=1),
            hora_inicio=hora_inicio,
            hora_fim=hora_fim,
            duracao=10,
            dias_semana="0,1,2,3,4,5,6",
            prioridade=1,
            regiao=2,
            ativo=True
        )
        test_db.add(schedule)
        test_db.commit()
        
        result = SchedulerService.get_active_content(test_db)
        
        # Imagem deve ser None porque não está no horário agendado
        assert result["imagem"] is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
