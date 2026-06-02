from pydantic import BaseModel, Field

class VeiculoBase(BaseModel):
    placa: str = Field(..., min_length=7, description="Placa do veículo não pode ser vazia")
    modelo: str = Field(..., min_length=2, description="Modelo do veículo não pode ser vazio")
    quilometragem: int

class VeiculoCreate(VeiculoBase):
    pass

class VeiculoResponse(VeiculoBase):
    id: int
    alerta_revisao: bool

    class Config:
        from_attributes = True

class VeiculoUpdateKM(BaseModel):
    quilometragem: int
