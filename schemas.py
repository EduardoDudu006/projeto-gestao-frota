# Importamos o BaseModel, que é a classe fundadora de todos os schemas do Pydantic.
# Ele lida com a validação automática de tipos, conversão de dados e geração de JSON.
from pydantic import BaseModel

# Importamos o Optional do módulo typing para indicar campos que podem ser nulos ou omitidos.
from typing import Optional

# --- SCHEMA BASE (Padrão DTO - Data Transfer Object) ---
# Criamos uma classe base para herdar os campos que são comuns em quase todas as operações.
# Isso evita repetição de código (Princípio DRY - Don't Repeat Yourself).
class VeiculoBase(BaseModel):
    placa: str          # Garante que o dado enviado deve ser uma string (Texto)
    modelo: str         # Garante que o dado enviado deve ser uma string (Texto)
    quilometragem: int  # Garante que o dado enviado deve ser um número inteiro (Sem casas decimais)

# --- SCHEMA DE CRIAÇÃO (POST) ---
# Usado quando o front-end envia dados para cadastrar um NOVO veículo.
# Ele herda tudo de VeiculoBase. Usamos 'pass' porque, para cadastrar,
# precisamos exatamente desses 3 campos básicos e nenhum a mais.
class VeiculoCreate(VeiculoBase):
    pass

# --- SCHEMA DE ATUALIZAÇÃO DE KM (PUT / PATCH) ---
# Usado especificamente na rota de atualizar o odômetro do veículo.
# Ao isolar apenas a 'quilometragem' aqui, impedimos que o front-end tente
# alterar campos proibidos (como a placa ou o ID) durante essa operação.
class VeiculoUpdateKM(BaseModel):
    quilometragem: int

# --- SCHEMA DE RESPOSTA (SAÍDA DA API) ---
# Define exatamente o formato dos dados que o FastAPI vai devolver para o Front-end.
# Ele herda os campos do VeiculoBase (placa, modelo, km) e adiciona os campos do sistema.
class VeiculoResponse(VeiculoBase):
    id: int                   # O ID gerado pelo banco agora é exposto para o front-end
    alerta_revisao: bool      # Status calculado pelo back-end (Precisa ou não de revisão)

    # Optional[int] = 10000 indica que o campo espera um inteiro, mas aceita None (nulo).
    # O valor "= 10000" serve como um fallback visual e lógico de segurança para o Pydantic,
    # impedindo erros de serialização caso o banco de dados retorne alguma linha antiga sem esse dado.
    proxima_revisao_km: Optional[int] = 10000

    # --- CONFIGURAÇÃO INTERNA DO PYDANTIC (V2) ---
    # Esta subclasse configura o comportamento do Pydantic ao ler objetos complexos.
    class Config:
        # from_attributes = True (antigo 'orm_mode = True' no Pydantic V1)
        # É a mágica que permite ao FastAPI ler um objeto do SQLAlchemy (um modelo do banco)
        # e convertê-lo automaticamente para JSON. Sem isso, o Pydantic só aceitaria
        # dicionários nativos do Python (ex: resultado['placa']), gerando erro ao ler do banco.
        from_attributes = True
