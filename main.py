from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, get_db

# Cria a tabela 'veiculos' fisicamente caso ela não exista
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API - Gestão de Frota UNINASSAU",
    version="2.0.0"
)

# Configuração do CORS para permitir que o React se conecte ao FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROTAS DA API ---

# C - CREATE: Cadastra um novo veículo calculando seu primeiro limite de revisão
@app.post("/api/veiculos/", response_model=schemas.VeiculoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_veiculo(veiculo: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    try:
        veiculo_existente = db.query(models.Veiculo).filter(models.Veiculo.placa == veiculo.placa).first()
        if veiculo_existente:
            raise ValueError("Um veículo com esta placa já está cadastrado no sistema.")

        novo_veiculo = models.Veiculo(
            placa=veiculo.placa,
            modelo=veiculo.modelo,
            quilometragem=veiculo.quilometragem
        )

        # REGRA DE NEGÓCIO: Define dinamicamente o alvo da próxima revisão baseado no odômetro atual + 10.000 km
        novo_veiculo.proxima_revisao_km = novo_veiculo.quilometragem + 10000
        novo_veiculo.alerta_revisao = False # Começa "Em Dia"

        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo)
        return novo_veiculo

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao salvar no banco.")


# R - READ: Lista todos os veículos da frota
@app.get("/api/veiculos/", response_model=list[schemas.VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    try:
        return db.query(models.Veiculo).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar veículos.")


# U - UPDATE: Atualiza a quilometragem atual e compara com a meta estipulada
@app.put("/api/veiculos/{veiculo_id}/quilometragem", response_model=schemas.VeiculoResponse)
def atualizar_quilometragem(veiculo_id: int, dados: schemas.VeiculoUpdateKM, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    try:
        veiculo.quilometragem = dados.quilometragem

        # REGRA DE NEGÓCIO DINÂMICA: Verifica se o odômetro atual alcançou ou passou a meta estipulada
        if veiculo.quilometragem >= veiculo.proxima_revisao_km:
            veiculo.alerta_revisao = True
        else:
            veiculo.alerta_revisao = False

        db.commit()
        db.refresh(veiculo)
        return veiculo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar quilometragem.")


# U - UPDATE (MANUTENÇÃO): Registra que a revisão foi feita e joga a meta mais 10.000 km para o futuro
@app.put("/api/veiculos/{veiculo_id}/registrar-revisao", response_model=schemas.VeiculoResponse)
def registrar_revisao(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    try:
        # REGRA DE NEGÓCIO CHAVE: Mantém o odômetro real e projeta uma nova meta futura baseada na KM do dia da revisão
        veiculo.proxima_revisao_km = veiculo.quilometragem + 10000

        # Desliga o alerta visual, o veículo está liberado para rodar
        veiculo.alerta_revisao = False

        db.commit()
        db.refresh(veiculo)
        return veiculo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao registrar revisão.")
