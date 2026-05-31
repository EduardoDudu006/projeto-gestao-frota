from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, get_db

# Cria as tabelas no banco de dados automaticamente
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API - Gestão de Frota UNINASSAU",
    description="API RESTful para controle de veículos e alertas de manutenção.",
    version="1.0.0"
)

@app.post("/api/veiculos/", response_model=schemas.VeiculoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_veiculo(veiculo: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    try:
        # Regra de Negócio 1: Evitar matrículas/placas duplicadas
        veiculo_existente = db.query(models.Veiculo).filter(models.Veiculo.placa == veiculo.placa).first()
        if veiculo_existente:
            raise ValueError("Um veículo com esta placa já está cadastrado no sistema.")

        novo_veiculo = models.Veiculo(
            placa=veiculo.placa,
            modelo=veiculo.modelo,
            quilometragem=veiculo.quilometragem
        )

        # Regra de Negócio 2: Lógica de alerta de revisão usando if-else
        if novo_veiculo.quilometragem >= 10000:
            novo_veiculo.alerta_revisao = True
        else:
            novo_veiculo.alerta_revisao = False

        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo)
        return novo_veiculo

    except ValueError as ve:
        # Tratamento de erro específico da regra de negócio
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Tratamento de erro genérico capturado pelo try/except
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao salvar no banco de dados.")

@app.get("/api/veiculos/", response_model=list[schemas.VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    try:
        veiculos = db.query(models.Veiculo).all()
        return veiculos
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar veículos.")
