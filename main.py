from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API - RotaSync Logística UNINASSAU", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        novo_veiculo.proxima_revisao_km = novo_veiculo.quilometragem + 10000
        novo_veiculo.alerta_revisao = False

        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo)
        return novo_veiculo
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao salvar no banco.")

@app.get("/api/veiculos/", response_model=list[schemas.VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    try:
        veiculos = db.query(models.Veiculo).all()
        # LÓGICA DE AUTOCORREÇÃO: Se houver registros antigos com a coluna nula, corrige dinamicamente
        for v in veiculos:
            if v.proxima_revisao_km is None:
                v.proxima_revisao_km = v.quilometragem + 10000
                db.commit()
        return veiculos
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar veículos.")

@app.put("/api/veiculos/{veiculo_id}/quilometragem", response_model=schemas.VeiculoResponse)
def atualizar_quilometragem(veiculo_id: int, dados: schemas.VeiculoUpdateKM, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado no banco de dados.")

    try:
        veiculo.quilometragem = dados.quilometragem

        if veiculo.proxima_revisao_km is None:
            veiculo.proxima_revisao_km = veiculo.quilometragem + 10000

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

@app.put("/api/veiculos/{veiculo_id}/registrar-revisao", response_model=schemas.VeiculoResponse)
def registrar_revisao(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado no banco de dados.")

    try:
        veiculo.proxima_revisao_km = veiculo.quilometragem + 10000
        veiculo.alerta_revisao = False

        db.commit()
        db.refresh(veiculo)
        return veiculo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao registrar revisão.")
