# Importações do FastAPI, ferramentas de erro (HTTPException) e status HTTP
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware # Importação crucial para liberar o React
from sqlalchemy.orm import Session # Importa o tipo Session para o banco de dados

# Importa nossos arquivos locais (Model e View do padrão MVC) e a conexão do banco
import models
import schemas
from database import engine, get_db

# Comando que lê o arquivo models.py e cria a tabela 'veiculos' fisicamente no banco de dados
models.Base.metadata.create_all(bind=engine)

# Instancia a aplicação FastAPI e configura as informações que aparecerão no Swagger
app = FastAPI(
    title="API - Gestão de Frota UNINASSAU",
    description="API RESTful para controle de veículos e alertas de manutenção.",
    version="1.0.0"
)

# Configuração do CORS (Cross-Origin Resource Sharing).
# Isso avisa ao navegador que o nosso front-end (React) tem permissão para acessar esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na vida real colocaríamos o domínio exato do React. O "*" libera geral.
    allow_credentials=True,
    allow_methods=["*"], # Libera todos os métodos HTTP (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Libera todos os cabeçalhos
)

# --- ROTAS DA API (CONTROLLER) ---

# Rota POST para cadastrar um novo veículo. Retorna o status 201 (Created) se der certo.
@app.post("/api/veiculos/", response_model=schemas.VeiculoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_veiculo(veiculo: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    # O bloco try/except é exigido pelo edital para garantir o tratamento de erros
    try:
        # REGRA DE NEGÓCIO 1: Busca no banco se já existe a placa enviada
        veiculo_existente = db.query(models.Veiculo).filter(models.Veiculo.placa == veiculo.placa).first()

        # Se a placa existir, disparamos um erro parando a execução imediatamente
        if veiculo_existente:
            raise ValueError("Um veículo com esta placa já está cadastrado no sistema.")

        # Se passou pela validação acima, preparamos o objeto para salvar no banco
        novo_veiculo = models.Veiculo(
            placa=veiculo.placa,
            modelo=veiculo.modelo,
            quilometragem=veiculo.quilometragem
        )

        # REGRA DE NEGÓCIO 2: Lógica de alerta de revisão (if-else simples e direto)
        # Se bater 10.000 km, ativa o alerta. Se não, garante que está desativado.
        if novo_veiculo.quilometragem >= 10000:
            novo_veiculo.alerta_revisao = True
        else:
            novo_veiculo.alerta_revisao = False

        # Comandos do SQLAlchemy para efetivamente salvar os dados e confirmar (commit) a transação
        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo) # Atualiza a variável com o ID gerado pelo banco

        return novo_veiculo # Devolve o JSON preenchido para o usuário (ou front-end)

    except ValueError as ve:
        # Captura especificamente o erro de placa duplicada e retorna um erro 400 (Bad Request)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Captura qualquer outro erro inesperado. O db.rollback() desfaz qualquer alteração incompleta.
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao salvar no banco de dados.")

# Rota GET para listar todos os veículos cadastrados.
@app.get("/api/veiculos/", response_model=list[schemas.VeiculoResponse])
def listar_veiculos(db: Session = Depends(get_db)):
    try:
        # Pede ao banco para trazer todos (all) os registros da tabela Veiculo
        veiculos = db.query(models.Veiculo).all()
        return veiculos
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar veículos.")
