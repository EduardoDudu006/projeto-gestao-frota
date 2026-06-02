from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    modelo = Column(String)
    quilometragem = Column(Integer)
    alerta_revisao = Column(Boolean, default=False)

    # Campo configurado como aceitável para nulos por segurança com dados antigos
    proxima_revisao_km = Column(Integer, default=10000, nullable=True)
