# projeto-gestao-frota
## Projeto AV2 da Disciplina Back End e Frameworks

# 🚚 RotaSync Logística - API de Gestão de Frota

**Projeto AV2 - Tech Challenge UNINASSAU**
**Disciplina:** Back-end Frameworks (2026.1)
**Professor:** Breno Holanda

---

## 📌 Sobre o Projeto

O **RotaSync Logística** é uma solução completa desenvolvida para solucionar problemas de gestão de frota empresarial. O projeto consiste em uma **API RESTful** estruturada no padrão MVC e uma interface web moderna. O objetivo principal é garantir autonomia e baixo custo no registro de veículos, controlando a quilometragem e emitindo alertas automatizados de revisão preventiva.

---

## 🚀 Funcionalidades e Regras de Negócio

* **Cadastro de Veículos (Create):** Permite o registro de novos veículos na frota informando placa, modelo e quilometragem atual.
* **Listagem da Frota (Read):** Retorna todos os veículos cadastrados no banco de dados.
* **Prevenção de Duplicidade:** O sistema possui uma trava de segurança estruturada com tratamento de erros (`try/except`) que impede o cadastro de veículos com a mesma placa.
* **Alerta Inteligente de Manutenção:** Ao cadastrar ou atualizar um veículo com quilometragem igual ou superior a 10.000 km, o sistema altera automaticamente a flag de manutenção (`alerta_revisao = True`), sinalizando a necessidade de revisão imediata.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi dividido em duas frentes para separar claramente as responsabilidades de processamento de dados e interface visual:

**Back-end (100% focado no Edital):**
* **Python 3+**
* **FastAPI:** Framework moderno e de alta performance para a construção da API.
* **SQLAlchemy & Pydantic:** Ferramentas para mapeamento objeto-relacional (ORM) e validação estrita de dados (Camada Model e View do MVC).
* **SQLite:** Banco de dados relacional leve (preparado para migração para PostgreSQL/MySQL no deploy).
* **Uvicorn:** Servidor ASGI para rodar a aplicação.

**Front-end (Apresentação Visual):**
* **React + Vite:** Para uma interface rápida e reativa.
* **Axios:** Para consumo da API e comunicação segura via requisições HTTP.
* **CSS Grid & Flexbox:** Estilização moderna e responsiva.

---

## 📂 Arquitetura do Projeto (Padrão MVC)

O back-end em FastAPI foi organizado adaptando o padrão MVC para garantir código limpo e manutenção facilitada:

* `models.py` **(Model):** Representa a estrutura do Banco de Dados.
* `schemas.py` **(View/Validação):** Filtra, valida e formata os dados que entram e saem da API.
* `main.py` **(Controller/Service):** Contém as rotas, regras de negócio e comunicação principal.
* `database.py` **(Repository):** Gerencia as sessões de conexão com o banco de dados.

---

## ⚙️ Como Executar o Projeto Localmente

Siga as instruções abaixo para rodar o projeto na sua máquina.

### 1. Inicializando o Back-end (API)

Abra o terminal, navegue até a pasta raiz do back-end e instale as dependências:

```bash
# Instalação das bibliotecas necessárias
pip install fastapi uvicorn sqlalchemy pydantic

# Execução do servidor local
uvicorn main:app --reload

**A API estará rodando em:** http://127.0.0.1:8000

2. Acessando a Documentação Interativa (Swagger)
A documentação interativa gerada automaticamente pelo FastAPI pode ser acessada no navegador pelo link:
👉 http://127.0.0.1:8000/docs

Nesta tela, é possível testar todas as rotas (GET e POST) sem a necessidade de softwares de terceiros.

3. Inicializando o Front-end (React)
Abra um **novo terminal**, navegue até a pasta do front-end (rotasync-ui) e execute:

# Instalação dos pacotes do Node
npm install

# Execução da interface visual
npm run dev

A aplicação web estará rodando em: http://localhost:5173

### 🌐 Deploy na Nuvem
A API está preparada para ser hospedada em plataformas como Render ou Railway.

O arquivo requirements.txt mapeia todas as dependências do ambiente.

Comando de inicialização configurado para servidores em nuvem:
uvicorn main:app --host 0.0.0.0 --port $PORT
