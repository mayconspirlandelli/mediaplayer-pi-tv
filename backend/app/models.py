from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, Date, Time, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Media(Base):
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)  # 'video', 'imagem', 'texto'
    caminho_arquivo = Column(String(500), nullable=True)
    texto = Column(Text, nullable=True)
    nome = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamento
    schedules = relationship("Schedule", back_populates="media", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedule"
    
    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"), nullable=False)
    
    # Datas e horários
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fim = Column(Time, nullable=False)
    
    # Configurações
    duracao = Column(Integer, default=10)  # em segundos (para imagens/textos)
    dias_semana = Column(String(50), default="0,1,2,3,4,5,6")  # 0=domingo, 6=sábado
    prioridade = Column(Integer, default=1)
    regiao = Column(Integer, nullable=False)  # 1=video, 2=imagem, 3=clima, 4=texto
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamento
    media = relationship("Media", back_populates="schedules")

class WeatherCache(Base):
    __tablename__ = "weather_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    cidade = Column(String(100), nullable=False)
    temperatura = Column(Integer)
    condicao = Column(String(100))
    icone = Column(String(10))
    data_cache = Column(DateTime, default=datetime.utcnow)
    dados_completos = Column(JSON)
