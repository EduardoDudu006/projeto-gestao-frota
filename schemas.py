from pydantic import BaseModel

# Esquema base para validação de entrada de dados comum
class VeiculoBase(BaseModel):
    placa: str
    modelo: str
    quilometragem: int

# Usado na rota POST para criação de novos registros
class VeiculoCreate(VeiculoBase):
    pass

# Usado na rota PUT para validar a alteração apenas da quilometragem
class VeiculoUpdateKM(BaseModel):
    quilometragem: int

# Esquema de saída: Define como os dados serão devolvidos no formato JSON para o React
class VeiculoResponse(VeiculoBase):
    id: int
    alerta_revisao: bool
    proxima_revisao_km: int # Campo adicionado para o front-end mapear na tela

    class Config:
        from_attributes = True
