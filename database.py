# Importa as ferramentas do SQLAlchemy necessárias para criar a conexão e os modelos
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Define a URL de conexão do banco de dados.
# Estamos usando SQLite ('./frota.db') para facilitar o desenvolvimento local.
# No deploy, isso seria trocado pela URL do MySQL ou PostgreSQL.
SQLALCHEMY_DATABASE_URL = "sqlite:///./frota.db"

# O 'engine' é o motor que efetivamente se comunica com o banco de dados.
# O parâmetro 'check_same_thread' é específico do SQLite para permitir múltiplas requisições.
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# O SessionLocal cria uma "sessão" de trabalho com o banco.
# É através dessa sessão que faremos os inserts, selects, updates e deletes (CRUD).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base é a classe mãe que todos os nossos modelos (tabelas) vão herdar.
Base = declarative_base()

# Função auxiliar de dependência (Dependency Injection).
# Sempre que uma rota precisar do banco, ela chama essa função, que abre a conexão,
# entrega para a rota usar (yield) e depois fecha automaticamente a conexão (db.close).
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
