from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True, nullable=False)
    modelo = Column(String, nullable=False)
    quilometragem = Column(Integer, default=0)
    alerta_revisao = Column(Boolean, default=False)
