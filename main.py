from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_database_uri, create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# --- CONFIGURAÇÃO DO BANCO DE DADOS (SQLITE) ---
DATABASE_URL = "sqlite:///./frota.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELO DO BANCO DE DADOS (SQLALCHEMY) ---
class VeiculoModel(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True, nullable=False)
    modelo = Column(String, nullable=False)
    quilometragem = Column(Integer, nullable=False)
    proxima_revisao_km = Column(Integer, nullable=False)
    alerta_revisao = Column(Boolean, default=False)

# Cria as tabelas se elas não existirem
Base.metadata.create_all(bind=engine)

# --- CONFIGURAÇÃO DA API FASTAPI ---
app = FastAPI(title="RotaSync API - Gestão de Frota")

# Permite conexões do Front-end (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Injeção de dependência do Banco de Dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SCHEMAS DE VALIDAÇÃO (PYDANTIC) ---
class VeiculoCreate(BaseModel):
    placa: str
    modelo: str
    quilometragem: int

class UpdateKm(BaseModel):
    quilometragem: int

class VeiculoResponse(BaseModel):
    id: int
    placa: str
    modelo: str
    quilometragem: int
    proxima_revisao_km: int
    alerta_revisao: bool

    class Config:
        from_attributes = True

# --- ROTAS DA API ---

@app.post("/veiculos/", response_model=VeiculoResponse)
def cadastrar_veiculo(veiculo: VeiculoCreate, db: Session = Depends(get_db)):
    # Verifica se a placa já existe
    placa_existente = db.query(VeiculoModel).filter(VeiculoModel.placa == veiculo.placa).first()
    if placa_existente:
        raise HTTPException(status_code=400, detail="Já existe um veículo cadastrado com esta placa.")

    # Define a meta inicial de revisão baseada na quilometragem de cadastro (+10.000km)
    meta_inicial = veiculo.quilometragem + 10000

    novo_veiculo = VeiculoModel(
        placa=veiculo.placa.upper(),
        modelo=veiculo.modelo,
        quilometragem=veiculo.quilometragem,
        proxima_revisao_km=meta_inicial,
        alerta_revisao=False
    )

    db.add(novo_veiculo)
    db.commit()
    db.refresh(novo_veiculo)
    return novo_veiculo


@app.get("/veiculos/", response_model=List[VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    return db.query(VeiculoModel).all()


@app.put("/veiculos/{veiculo_id}/quilometragem", response_model=VeiculoResponse)
def atualizar_quilometragem(veiculo_id: int, dados: UpdateKm, db: Session = Depends(get_db)):
    veiculo = db.query(VeiculoModel).filter(VeiculoModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    if dados.quilometragem < veiculo.quilometragem:
        raise HTTPException(status_code=400, detail="A nova quilometragem não pode ser menor que a atual.")

    veiculo.quilometragem = dados.quilometragem

    # REGRA DE NEGÓCIO: Se alcançou ou passou da meta de revisão, dispara o alerta
    if veiculo.quilometragem >= veiculo.proxima_revisao_km:
        veiculo.alerta_revisao = True
    else:
        veiculo.alerta_revisao = False

    db.commit()
    db.refresh(veiculo)
    return veiculo


@app.put("/veiculos/{veiculo_id}/registrar-revisao", response_model=VeiculoResponse)
def registrar_revisao(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(VeiculoModel).filter(VeiculoModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    # REGRA DE NEGÓCIO: Define a nova meta para +10.000 km à frente da quilometragem atual externa
    veiculo.proxima_revisao_km = veiculo.quilometragem + 10000
    veiculo.alerta_revisao = False  # Apaga o alerta de revisão do banco

    db.commit()
    db.refresh(veiculo)
    return veiculo


@app.delete("/veiculos/")
def apagar_todos_veiculos(db: Session = Depends(get_db)):
    try:
        # Executa a limpeza total da tabela
        db.query(VeiculoModel).delete()
        db.commit()
        return {"detail": "Todos os veículos foram removidos da frota com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao tentar limpar o banco de dados.")
