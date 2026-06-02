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

O ecossistema do projeto foi construído utilizando tecnologias consolidadas de mercado, garantindo alta performance, tipagem estática e escalabilidade:

* **Front-end:** React.js (Vite), Axios, HTML5, CSS3 Avançado (Flexbox/Grid).
* **Back-end:** FastAPI (Python 3), Uvicorn.
* **Banco de Dados & ORM:** SQLite (Engine Local Embutida), SQLAlchemy.
* **Validação de Dados:** Pydantic (V2).

Back-end: Python 3+, FastAPI, SQLAlchemy (ORM), Pydantic (Validação), Uvicorn (Servidor ASGI).

**Banco de Dados:** SQLite (Em ambiente de desenvolvimento), expansível nativamente para PostgreSQL ou MySQL.

**Front-end:** React, Vite (Build Tool), Axios (Cliente HTTP Assíncrono), CSS3 Nativo (Grid, Flexbox, Media Queries).

**Versionamento & Infraestrutura:** Git, GitHub, Render (Hospedagem do Back-end), Vercel (Hospedagem do Front-end).

---

## 🏆 Atendimento Aos Critérios de Avaliação

O projeto foi arquitetado sob o princípio da separação de responsabilidades (SoC), garantindo que cada requisito avaliado fosse implementado seguindo as melhores práticas de Engenharia de Software. Abaixo detalha-se como cada critério foi atendido com excelência:

### 1. Desenvolvimento Back-end Eficiente (FastAPI)
* **Como foi atendido:** Utilização do framework **FastAPI** para a construção de uma API RESTful de alta performance. O back-end conta com roteamento limpo, injeção de dependências nativa para gerenciamento de sessões do banco de dados (`Depends(get_db)`) e geração automatizada da documentação interativa OpenAPI/Swagger na rota `/docs`.

### 2. Persistência de Dados e Mapeamento ORM (SQLAlchemy)
* **Como foi atendido:** Em vez do uso de queries SQL puras em formato de texto, foi implementado o **SQLAlchemy** como mapeador objeto-relacional (ORM). 
    * A classe `VeiculoModel` faz o mapeamento direto das entidades para o banco **SQLite** (`frota.db`).
    * Foram configuradas chaves primárias automáticas (`primary_key=True`), restrições de integridade de negócios (`unique=True` na coluna de placas) e índices de banco de dados (`index=True`) para garantir consultas otimizadas e de alta velocidade.
    * A inicialização física das tabelas ocorre de forma automatizada no ciclo de vida da API via `Base.metadata.create_all(bind=engine)`.

### 3. Validação de Dados Rigorosa (Pydantic Schemas)
* **Como foi atendido:** Separação estrita entre a camada de persistência (`models.py`) e a camada de transferência de dados (DTO) através de schemas do **Pydantic**.
    * **`VeiculoCreate`**: Valida estritamente os tipos de entrada (`str`, `int`) no ato do cadastro, devolvendo um erro automático `422 Unprocessable Entity` se houver inconformidade, antes mesmo de onerar o banco de dados.
    * **`UpdateKm`**: Garante a segurança de exposição, isolando e permitindo que apenas a quilometragem seja enviada na rota de atualização do odômetro.
    * **`VeiculoResponse`**: Aplica a flag `from_attributes = True`, permitindo que objetos de dados complexos do SQLAlchemy sejam serializados de forma limpa e segura em JSON para o front-end, ocultando dados sensíveis ou internos.

### 4. Implementação Completa do CRUD Operacional
* **Como foi atendido:** O sistema executa todas as quatro operações fundamentais de persistência através de endpoints dedicados:
    * **Create (Criar):** `POST /veiculos/` para inclusão de novos ativos.
    * **Read (Ler):** `GET /veiculos/` para listagem da frota.
    * **Update (Atualizar):** `PUT /veiculos/{id}/quilometragem` e `/registrar-revisao` para mutação de dados e metas.
    * **Delete (Apagar):** `DELETE /veiculos/{id}` para descarte individual e `DELETE /veiculos/` para expurgar a frota completa (Limpeza em lote).

### 5. Regras de Negócio e Travas de Segurança Preventivas
* **Como foi atendido:** O software não se limita a salvar dados; ele possui inteligência embarcada que protege a consistência operacional:
    * **Prevenção de Fraude/Erro de Digitação:** Uma trava lógica no back-end impede que a nova quilometragem inserida seja menor do que a quilometragem atual gravada no banco, disparando um erro `400 Bad Request`.
    * **Automação de Metas Preventivas:** Ao cadastrar um veículo com `X` km, o sistema calcula autonomamente a meta da primeira revisão para `X + 10.000 km`.
    * **Cálculo de Status Dinâmico:** Sempre que a quilometragem atinge ou ultrapassa a meta (`quilometragem >= proxima_revisao_km`), o sistema altera a flag `alerta_revisao` para `True`, alterando instantaneamente a interface do usuário. Ao registrar que a revisão foi realizada, o sistema estende a meta em mais `10.000 km` e normaliza o alerta.

### 6. Integração Front-end (React) e Consumo de API Assíncrono
* **Como foi atendido:** O front-end foi construído em **React** orientado a componentes funcionais e hooks nativos.
    * **Gerenciamento de Estado:** Hooks como `useState` controlam dinamicamente os modais, formulários e a lista de veículos. O `useEffect` assegura que a frota seja carregada imediatamente no carregamento da página.
    * **Comunicação Baseada em Promessas:** O cliente **Axios** foi encapsulado em um módulo de serviço (`api.js`) centralizando a URL base da aplicação e lidando com requisições assíncronas (`async/await`) e tratamento de exceções vindas do back-end.
    * **Segurança de Origem (CORS):** O back-end expõe explicitamente o `CORSMiddleware` configurado com permissões de métodos, cabeçalhos e origens, mitigando bloqueios de requisições cruzadas no navegador.

### 7. Experiência do Usuário (UX/UI) e Reatividade
* **Como foi atendido:** A interface apresenta um painel administrativo limpo e reativo.
    * **Modais Customizados:** Em vez de utilizar os alertas nativos e intrusivos do navegador (que degradam a experiência), foram criados cartões de modal flutuantes injetados diretamente na árvore do DOM do React para alertas de sucesso, erros da API e caixas de confirmação crítica (impedindo exclusões acidentais).
    * **Atualização Otimizada de Estado:** Ao deletar ou modificar um veículo, filtros locais de estado (`setVeiculos(prev => ...)`) removem ou modificam o card instantaneamente em tela, fornecendo feedback visual imediato sem a necessidade de recarregar a página inteira (Single Page Application behavior).

---

## 🗺️ Mapa de Endpoints da API

| Método | Endpoint | Schema de Entrada (Payload) | Resposta (JSON) | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/veiculos/` | `VeiculoCreate` | `VeiculoResponse` | Cadastra um veículo e calcula meta de +10k km. |
| **`GET`** | `/veiculos/` | Nenhum | `List[VeiculoResponse]` | Retorna todos os veículos registrados no banco. |
| **`PUT`** | `/veiculos/{id}/quilometragem` | `UpdateKm` | `VeiculoResponse` | Atualiza o odômetro e reavalia status de revisão. |
| **`PUT`** | `/veiculos/{id}/registrar-revisao`| Nenhum | `VeiculoResponse` | Consolida a manutenção e projeta nova meta de +10k km. |
| **`DELETE`**| `/veiculos/{id}` | Nenhum | `{"detail": "..."}` | Remove um único veículo permanentemente pelo ID. |
| **`DELETE`**| `/veiculos/` | Nenhum | `{"detail": "..."}` | Zera o banco de dados limpando toda a frota ativa. |

---

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
