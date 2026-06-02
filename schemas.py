from pydantic import BaseModel
from typing import Optional

class VeiculoBase(BaseModel):
    placa: str
    modelo: str
    quilometragem: int

class VeiculoCreate(VeiculoBase):
    pass

class VeiculoUpdateKM(BaseModel):
    quilometragem: int

class VeiculoResponse(VeiculoBase):
    id: int
    alerta_revisao: bool
    proxima_revisao_km: Optional[int] = 10000 # Evita quebras caso venha nulo do banco

    class Config:
        from_attributes = True
