from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cria um arquivo de banco de dados local chamado frota.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./frota.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
