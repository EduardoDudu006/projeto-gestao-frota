# Importamos as ferramentas necessárias do SQLAlchemy para estruturar nossas colunas
# Column: Define que a variável é uma coluna na tabela do banco de dados
# Integer, String, Boolean: Mapeiam os tipos do Python para os tipos nativos do SQL (Ex: VARCHAR, INT, TINYINT)
from sqlalchemy import Column, Integer, String, Boolean

# Importamos o 'Base' do nosso arquivo de configuração de banco de dados (database.py)
# Essa classe base declarativa é o que o SQLAlchemy usa para rastrear e criar as tabelas automaticamente
from database import Base

# Definimos a classe 'Veiculo' que herda de 'Base'
# Isso diz ao SQLAlchemy que esta classe representa uma tabela no banco de dados (Modelo ORM)
class Veiculo(Base):

    # __tablename__: Define o nome real que a tabela terá dentro do banco de dados SQL
    __tablename__ = "veiculos"

    # Chave primária da tabela.
    # primary_key=True: Garante que o ID será único, obrigatório e gerado automaticamente (Auto-incremento)
    # index=True: Cria um índice neste campo no banco, tornando as buscas por ID extremamente rápidas
    id = Column(Integer, primary_key=True, index=True)

    # Campo para armazenar a placa do veículo
    # unique=True: Impede que duas linhas tenham a mesma placa (regra de negócio para não duplicar veículos)
    # index=True: Como faremos muitas buscas filtrando pela placa, o índice otimiza a velocidade da consulta
    placa = Column(String, unique=True, index=True)

    # Campo de texto simples para armazenar a marca/modelo do veículo (Ex: "Hyundai HR")
    modelo = Column(String)

    # Campo numérico inteiro para armazenar a quilometragem (odômetro) atual do veículo
    quilometragem = Column(Integer)

    # Campo booleano (True/False) para indicar se o veículo atingiu o limite e precisa ir para a oficina
    # default=False: Todo veículo novo cadastrado entra no sistema com o status "Em Dia" (False) por padrão
    alerta_revisao = Column(Boolean, default=False)

    # Campo numérico inteiro para registrar a meta de quilometragem da próxima manutenção
    # default=10000: Se não for informado nada no cadastro, o banco assume que a primeira revisão será com 10.000 km
    # nullable=True: Permite que este campo fique vazio (NULL) no banco de dados, evitando erros de quebra
    #                de consistência caso registros antigos do sistema não possuam esse dado gravado.
    proxima_revisao_km = Column(Integer, default=10000, nullable=True)
