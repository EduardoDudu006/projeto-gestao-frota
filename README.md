***

# 🚚 RotaSync Logística - Sistema de Gestão de Frota

### 🏅 Projeto Acadêmico — AV2 Tech Challenge
* **Instituição:** UNINASSAU
* **Curso:** Análise e Desenvolvimento de Sistemas
* **Disciplina:** Desenvolvimento Back-end e Frameworks
* **Professor:** Breno Holanda
* **Aluno:** Eduardo Luz **Matrícula:** 01824297
* **Período:** 3º
* **Turno:** Noite
* **Turma:** 3NA
* **Ano/Semestre:** 2026.1

---

## 📌 Visão Geral do Projeto

O **RotaSync Logística** é uma aplicação Full-Stack desenvolvida para solucionar gargalos operacionais no gerenciamento de frotas de veículos empresariais. O sistema permite monitorar a quilometragem dos automóveis, aplicando regras de negócio automatizadas para sinalizar preventivamente a necessidade de revisões mecânicas, mitigando custos com manutenções corretivas e aumentando a segurança da operação logística.

O ecossistema foi projetado seguindo a separação estrita de responsabilidades: um **Back-end RESTful** estruturado em Python sob a arquitetura padrão **MVC (Model-View-Controller)** e um **Front-end SPA (Single Page Application)** dinâmico e responsivo em **React**.

### ⚙️ Funcionalidades e Regras de Negócio Implementadas
**Cadastro de Veículos (Create - HTTP POST):** Recebe e persiste os dados brutos de entrada validando Placa, Modelo e Quilometragem.

**Prevenção de Duplicidade de Chaves:** Mecanismo lógico interceptador que valida se a placa informada já existe no banco. Caso exista, dispara um erro customizado 400 Bad Request encapsulado em um bloco try/except.

**Alerta de Revisão Automatizado:** Regra de negócio executada na camada do controlador: se a quilometragem informada for igual ou superior a 10.000 km, o sistema atualiza a flag booleana alerta_revisao para True. Caso contrário, mantém False.

**Listagem em Tempo Real (Read - HTTP GET):** Recupera todos os registros do banco SQLite através de uma consulta unificada do ORM e popula o grid do front-end instantaneamente.

**Responsividade Mobile Completa:** Utilização de Media Queries CSS para reestruturar o layout de duas colunas (Grid) para uma única coluna vertical empilhada em displays menores que 768px.

**Controle de Segurança CORS:** Configuração do middleware CORSMiddleware no FastAPI para habilitar requisições Cross-Origin seguras vindas da porta do React.

## 🛠️ Tecnologias e Frameworks Utilizados
Back-end: Python 3+, FastAPI, SQLAlchemy (ORM), Pydantic (Validação), Uvicorn (Servidor ASGI).

**Banco de Dados:** SQLite (Em ambiente de desenvolvimento), expansível nativamente para PostgreSQL ou MySQL.

**Front-end:** React, Vite (Build Tool), Axios (Cliente HTTP Assíncrono), CSS3 Nativo (Grid, Flexbox, Media Queries).

**Versionamento & Infraestrutura:** Git, GitHub, Render (Hospedagem do Back-end), Vercel (Hospedagem do Front-end).

## 🚀 Como Executar o Ecossistema Localmente
1. Inicializando a API Back-end
Navegue até a pasta backend/ pelo terminal e execute os comandos:

# Instalação automatizada das dependências mapeadas
pip install -r requirements.txt

# Inicialização do servidor Uvicorn com hot-reload ativo
uvicorn main:app --reload

**O servidor iniciará localmente no endereço:** http://127.0.0.1:8000

**Documentação OpenAPI interativa (Swagger) disponível em:** http://127.0.0.1:8000/docs

# 2. Inicializando a Interface Front-end
Abra uma nova janela de terminal, navegue até a pasta frontend/ e execute os comandos:

# Instalação dos pacotes e módulos do Node.js
npm install

# Inicialização do servidor de desenvolvimento do Vite
npm run dev

**A interface web estará acessível em:** http://localhost:5173

### 🌐 Arquitetura de Produção (Deploy na Nuvem)
O ecossistema encontra-se hospedado de forma pública e integrada na nuvem:

**API Back-end (Hospedagem no Render):** https://projeto-gestao-frota.onrender.com

**Interface Front-end (Hospedagem na Vercel):** Acesse o link gerado em seu dashboard da Vercel.

**⚠️ Nota de Configuração:** No ambiente de produção, o arquivo src/services/api.js foi devidamente atualizado para apontar a propriedade baseURL para a URL de produção do Render, garantindo a integridade operacional de ponta a ponta sem dependência de execução local.

## 📝 Licença e Direitos
©2026 Todos os direitos reservados.

Projeto desenvolvido como critério avaliativo para a disciplina de **Back end e Frameworks**, sob a orientação do **Professor Breno Holanda**. Livre para fins de estudo e portfólio acadêmico.

---

## 🗺️ Mapa de Pastas e Arquivos (Estrutura do Projeto)

Abaixo está a árvore hierárquica do projeto, detalhando a função de cada diretório e arquivo na arquitetura:

```text
rotasync-logistica/
│
├── backend/                          # Diretório do Servidor e Banco de Dados (FastAPI)
│   ├── database.py                   # Conexão com SQLite, configuração do ORM (Engine, SessionLocal) e get_db()
│   ├── main.py                       # Arquivo Central (Controller): Rotas da API, regras de negócio e CORS
│   ├── models.py                     # Camada Model: Definição da tabela relacional 'veiculos' (SQLAlchemy)
│   ├── schemas.py                    # Camada View/Validação: Schemas do Pydantic para tipagem estrita de dados
│   ├── frota.db                      # Banco de dados local relacional SQLite (gerado automaticamente)
│   └── requirements.txt              # Mapeamento de dependências do Python para deploy na nuvem
│
└── frontend/                         # Diretório da Interface de Usuário (React + Vite)
    ├── index.html                    # Arquivo HTML5 raiz do ecossistema front-end
    ├── package.json                  # Manifesto de dependências do Node.js (React, Vite, Axios)
    ├── vite.config.js                # Arquivo de configuração de compilação do Vite
    └── src/                          # Código-fonte da aplicação React
        ├── main.jsx                  # Ponto de entrada javascript: acopla a árvore ao DOM (limpo sem index.css)
        ├── App.jsx                   # Componente Principal: Estados (useState), Efeitos (useEffect) e JSX da UI
        ├── App.css                   # Estilização Global: CSS Grid, variáveis nativas, centralização e Media Queries
        └── services/                 # Módulo de Integração com Serviços Externos
            └── api.js                # Instância do Axios configurada com a baseURL dinâmica (Render/Local)
