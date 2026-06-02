# --- 1. IMPORTAÇÕES DO CORE DO FASTAPI ---
# FastAPI: A classe principal para instanciar a aplicação web.
# HTTPException: Usado para interromper a requisição e devolver erros HTTP claros (Ex: 404, 400).
# Depends: Sistema de Injeção de Dependências do FastAPI, usado aqui para gerenciar as sessões do banco.
from fastapi import FastAPI, HTTPException, Depends

# CORSMiddleware: Filtro de segurança necessário para permitir que o React (rodando em outra porta) acesse a API.
from fastapi.middleware.cors import CORSMiddleware

# BaseModel: Classe base do Pydantic para criar as regras de validação de dados.
from pydantic import BaseModel

# List: Auxiliar de tipagem estática para indicar listas de objetos (Ex: List[VeiculoResponse]).
from typing import List

# --- 2. IMPORTAÇÕES DO ORM (SQLALCHEMY) ---
# create_engine: Cria a conexão física do Python com o arquivo ou servidor de banco de dados.
# Column, Integer, String, Boolean: Tipos de dados usados para desenhar as colunas da tabela SQL.
from sqlalchemy import create_engine, Column, Integer, String, Boolean

# declarative_base: Classe construtora usada para mapear nossas classes Python em tabelas SQL reais.
from sqlalchemy.ext.declarative import declarative_base

# sessionmaker: Fábrica que gera sessões temporárias para executar inserções, buscas e deleções no banco.
# Session: Tipo estático usado para o Python saber que a variável 'db' é uma sessão ativa do SQLAlchemy.
from sqlalchemy.orm import sessionmaker, Session

# =========================================================================
# --- CONFIGURAÇÃO DO BANCO DE DADOS (SQLITE) ---
# =========================================================================

# Define onde o banco será salvo. O "sqlite:///..." criará um arquivo local chamado 'frota.db'.
DATABASE_URL = "sqlite:///./frota.db"

# engine: Instancia a conexão. O 'check_same_thread=False' é uma exigência específica do SQLite para rodar em paralelo no FastAPI.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# SessionLocal: Configura a fábrica de conexões. Não autocommitamos nada sem nossa ordem expressa (db.commit()).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: A classe que nossos modelos do banco de dados herdarão para que o SQLAlchemy os reconheça.
Base = declarative_base()

# =========================================================================
# --- MODELO DO BANCO DE DADOS (SQLALCHEMY) ---
# =========================================================================

# Esta classe define exatamente a estrutura física da tabela 'veiculos' dentro do arquivo .db
class VeiculoModel(Base):
    __tablename__ = "veiculos"  # Nome real da tabela no banco de dados SQL

    id = Column(Integer, primary_key=True, index=True) # Chave primária auto-incremento com índice de busca rápida
    placa = Column(String, unique=True, index=True, nullable=False) # Placa única (proíbe duplicatas) e obrigatória
    modelo = Column(String, nullable=False) # Nome/marca do veículo (obrigatório)
    quilometragem = Column(Integer, nullable=False) # O odômetro atual gravado (obrigatório)
    proxima_revisao_km = Column(Integer, nullable=False) # Meta calculada para a próxima revisão (obrigatório)
    alerta_revisao = Column(Boolean, default=False) # Flag booleano. Entra como False (Em dia) por padrão

# Base.metadata.create_all: Lê todas as classes que herdam de 'Base' (como o VeiculoModel)
# e cria fisicamente as tabelas e colunas no arquivo 'frota.db' caso elas ainda não existam.
Base.metadata.create_all(bind=engine)

# =========================================================================
# --- CONFIGURAÇÃO DA API FASTAPI E CORS ---
# =========================================================================

# Instancia o servidor FastAPI definindo o título que aparecerá na documentação automática (/docs)
app = FastAPI(title="RotaSync API - Gestão de Frota")

# Middleware do CORS: Abre as portas da API. O 'allow_origins=["*"]' permite que o React (Vite),
# aplicativos mobile ou ferramentas de teste consumam os dados sem bloqueios de segurança do navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# get_db(): Função geradora (yield) essencial para o ciclo de vida do banco.
# Ela abre uma conexão exclusiva para a rota que pediu dados, entrega a sessão viva,
# e garante o fechamento (db.close()) logo após a rota responder, evitando vazamento de memória.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================================================================
# --- SCHEMAS DE VALIDAÇÃO (PYDANTIC) ---
# =========================================================================
# Filtros que validam o formato dos dados trafegados nas requisições HTTP (JSON).

# Dados mínimos obrigatórios vindos do Front-end no momento do cadastro.
class VeiculoCreate(BaseModel):
    placa: str
    modelo: str
    quilometragem: int

# Schema isolado para garantir que na alteração de KM o front-end envie exclusivamente o número novo.
class UpdateKm(BaseModel):
    quilometragem: int

# Formato padronizado de saída. O FastAPI converte o modelo SQL de forma limpa para esse JSON estruturado.
class VeiculoResponse(BaseModel):
    id: int
    placa: str
    modelo: str
    quilometragem: int
    proxima_revisao_km: int
    alerta_revisao: bool

    class Config:
        from_attributes = True  # Permite mapear diretamente objetos de classes do SQLAlchemy (ORM) para JSON

# =========================================================================
# --- ROTAS DA API (ENDPOINTS) ---
# =========================================================================

# 1. ROTA DE CADASTRO (C no CRUD)
@app.post("/veiculos/", response_model=VeiculoResponse)
def cadastrar_veiculo(veiculo: VeiculoCreate, db: Session = Depends(get_db)):
    # Validação de Negócio: Busca se já existe a placa no sistema (convertendo para maiúsculo para padronizar)
    placa_existente = db.query(VeiculoModel).filter(VeiculoModel.placa == veiculo.placa.upper()).first()
    if placa_existente:
        raise HTTPException(status_code=400, detail="Já existe um veículo cadastrado com esta placa.")

    # Regra de Manutenção: Define que a primeira revisão acontecerá obrigatoriamente 10.000 km após a km atual
    meta_inicial = veiculo.quilometragem + 10000

    # Instancia o objeto do SQLAlchemy pronto para ir para o banco
    novo_veiculo = VeiculoModel(
        placa=veiculo.placa.upper(),
        modelo=veiculo.modelo,
        quilometragem=veiculo.quilometragem,
        proxima_revisao_km=meta_inicial,
        alerta_revisao=False
    )

    db.add(novo_veiculo)       # Coloca o objeto na fila de inserção
    db.commit()                # Executa fisicamente a gravação no arquivo SQL
    db.refresh(novo_veiculo)   # Atualiza o objeto para recuperar o 'id' auto-gerado pelo banco
    return novo_veiculo        # Retorna o objeto completo formatado pelo VeiculoResponse


# 2. ROTA DE LISTAGEM GERAL (R no CRUD)
@app.get("/veiculos/", response_model=List[VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    # Executa um 'SELECT * FROM veiculos' e retorna tudo como uma lista pura
    return db.query(VeiculoModel).all()


# 3. ROTA DE ATUALIZAÇÃO DE KM (U no CRUD)
@app.put("/veiculos/{veiculo_id}/quilometragem", response_model=VeiculoResponse)
def atualizar_quilometragem(veiculo_id: int, dados: UpdateKm, db: Session = Depends(get_db)):
    # Localiza o veículo pelo ID dinâmico passado na URL
    veiculo = db.query(VeiculoModel).filter(VeiculoModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    # Trava de segurança contra fraude ou erro operacional: o odômetro não pode voltar para trás
    if dados.quilometragem < veiculo.quilometragem:
        raise HTTPException(status_code=400, detail="A nova quilometragem não pode ser menor que a atual.")

    # Sobrescreve a quilometragem antiga pela nova
    veiculo.quilometragem = dados.quilometragem

    # Inteligência de Alertas: Se o novo odômetro alcançou ou ultrapassou a meta de revisão, aciona o alerta visual
    if veiculo.quilometragem >= veiculo.proxima_revisao_km:
        veiculo.alerta_revisao = True
    else:
        veiculo.alerta_revisao = False

    db.commit()
    db.refresh(veiculo)
    return veiculo


# 4. ROTA DE REGISTRO DE MANUTENÇÃO (U no CRUD)
@app.put("/veiculos/{veiculo_id}/registrar-revisao", response_model=VeiculoResponse)
def registrar_revisao(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(VeiculoModel).filter(VeiculoModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    # Regra de Renovação de Meta: Adiciona mais 10.000 km de vida útil a partir do odômetro atual
    veiculo.proxima_revisao_km = veiculo.quilometragem + 10000
    veiculo.alerta_revisao = False  # Apaga o status crítico (veículo volta a ficar "Em Dia")

    db.commit()
    db.refresh(veiculo)
    return veiculo


# 5. ROTA DE EXCLUSÃO INDIVIDUAL (D no CRUD)
@app.delete("/veiculos/{veiculo_id}")
def apagar_veiculo(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(VeiculoModel).filter(VeiculoModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    # Usamos o bloco try/except para capturar qualquer erro de concorrência ou travamento de arquivo do SQLite
    try:
        db.delete(veiculo)  # Marca o objeto localizado para ser excluído permanentemente
        db.commit()         # Consolida a deleção física no banco
        return {"detail": f"Veículo {veiculo.modelo} removido com sucesso!"}
    except Exception as e:
        db.rollback()       # Em caso de pane, desfaz a transação para não corromper o banco de dados
        raise HTTPException(status_code=500, detail="Erro ao tentar remover o veículo.")


# 6. ROTA DE LIMPEZA COMPLETA DA FROTA (D no CRUD - Avançado)
@app.delete("/veiculos/")
def apagar_todos_veiculos(db: Session = Depends(get_db)):
    try:
        # Executa uma instrução em lote (Truncate simulado) limpando todas as linhas de uma vez só
        db.query(VeiculoModel).delete()
        db.commit()
        return {"detail": "Todos os veículos foram removidos da frota com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao tentar limpar o banco de dados.")
