// Importa os hooks essenciais do React:
// useState (para guardar dados na memória da tela) e useEffect (para executar ações quando a tela carrega)
import { useState, useEffect } from "react";

// Importa a configuração do Axios que aponta para o nosso back-end (com o prefixo /api embutido)
import api from "./services/api";

// Importa o arquivo de estilos CSS
import "./App.css";

function App() {
    // --- ESTADOS (STATE) ---
    // Variáveis que, quando alteradas, fazem a tela ser redesenhada (renderizada) automaticamente
    const [veiculos, setVeiculos] = useState([]); // Guarda a lista de veículos vinda da API

    // Estados individuais para os campos do formulário de cadastro
    const [placa, setPlaca] = useState("");
    const [modelo, setModelo] = useState("");
    const [quilometragem, setQuilometragem] = useState("");

    // --- EFEITOS (EFFECTS) ---
    // O useEffect com o array vazio [] no final garante que a função carregarVeiculos
    // rode apenas UMA VEZ, exatamente no momento em que a página abre.
    useEffect(() => {
        carregarVeiculos();
    }, []);

    // --- FUNÇÕES DE COMUNICAÇÃO COM A API ---

    // Faz uma requisição GET para buscar a frota no banco de dados
    const carregarVeiculos = async () => {
        try {
            // Chama a rota http://127.0.0.1:8000/api/veiculos/
            const response = await api.get("/veiculos/");
            setVeiculos(response.data); // Atualiza o estado da lista com os dados recebidos
        } catch (error) {
            console.error("Erro ao buscar veículos", error);
        }
    };

    // Disparada quando o usuário clica em "Registrar Veículo" no formulário
    const cadastrarVeiculo = async (e) => {
        e.preventDefault(); // Impede o comportamento padrão do HTML de recarregar a página ao enviar form

        try {
            // Faz um POST enviando os dados digitados no padrão JSON esperado pela nossa API
            await api.post("/veiculos/", {
                placa: placa,
                modelo: modelo,
                quilometragem: parseInt(quilometragem), // Garante que a km vá como número inteiro
            });

            // Se a API retornar sucesso (status 201), limpamos os campos do formulário
            setPlaca("");
            setModelo("");
            setQuilometragem("");

            // Chama a função GET novamente para atualizar a lista na tela com o novo veículo
            carregarVeiculos();
            alert("Veículo cadastrado com sucesso!");
        } catch (error) {
            // Se a API retornar erro (ex: Erro 400 da placa duplicada que configuramos no main.py),
            // o React captura aqui e mostra o aviso exato na tela do usuário.
            alert(error.response?.data?.detail || "Erro ao cadastrar");
        }
    };

    // Função responsável por gerenciar a atualização da KM (Método PUT)
    const handleAtualizarKm = async (id, kmAtual) => {
        // SEGURANÇA CONTRA ERRO 404: Se o id vier vazio por erro de mapeamento do banco, mata a execução antes do erro acontecer
        if (id === undefined || id === null) {
            alert(
                "Erro do Sistema: O ID do veículo não foi encontrado na listagem. Verifique o mapeamento da sua chave primária.",
            );
            return;
        }

        // Abre uma caixinha perguntando a nova KM, já sugerindo o valor atual dentro do campo
        const novaKm = prompt(
            `Digite a nova quilometragem do veículo (Atual: ${kmAtual} km):`,
            kmAtual,
        );

        // Se o usuário clicar em "Cancelar" ou fechar a caixinha sem digitar nada, interrompe a função
        if (novaKm === null || novaKm === "") return;

        const kmFormatada = parseInt(novaKm);

        // Validação rápida de integridade no próprio front-end
        if (isNaN(kmFormatada) || kmFormatada < 0) {
            alert(
                "Por favor, insira um número válido e maior que zero para a quilometragem.",
            );
            return;
        }

        try {
            // Faz a chamada PUT para a API passando o ID na URL e a nova quilometragem no corpo (JSON)
            // IMPORTANTE: Sem barra no final para casar exatamente com o padrão definido no FastAPI
            await api.put(`/veiculos/${id}/quilometragem`, {
                quilometragem: kmFormatada,
            });

            // Atualiza o estado do React localmente fazendo um map. Isso altera o valor na tela
            // em tempo real sem precisar forçar um F5 na página inteira!
            setVeiculos(
                veiculos.map((v) =>
                    v.id === id
                        ? {
                              ...v,
                              quilometragem: kmFormatada,
                              alerta_revisao: kmFormatada >= 10000, // Sincroniza a regra visual com o back-end
                          }
                        : v,
                ),
            );

            alert("Quilometragem atualizada com sucesso!");
        } catch (error) {
            console.error("Erro completo da requisição PUT:", error);
            // Captura o erro real retornado pelo FastAPI e mostra no alert do cliente
            alert(
                error.response?.data?.detail ||
                    "Não foi possível atualizar a quilometragem. Verifique a rota ou conexões.",
            );
        }
    };

    // --- RENDERIZAÇÃO DA TELA (JSX) ---
    return (
        <div className="main">
            {/* Cabeçalho da página */}
            <header className="header">
                <h1>RotaSync Logística</h1>
                <p className="subtitulo">Painel de Gestão de Frota</p>
            </header>

            {/* Container principal que divide a tela em duas colunas usando CSS Grid */}
            <main className="painel">
                {/* COLUNA 1: FORMULÁRIO DE CADASTRO */}
                <section className="card">
                    <h2>Novo Veículo</h2>

                    {/* O evento onSubmit liga o botão "submit" à função cadastrarVeiculo */}
                    <form onSubmit={cadastrarVeiculo}>
                        <div className="form-grupo">
                            <label>Placa</label>
                            <input
                                type="text"
                                placeholder="ABC-1234"
                                value={placa} // O input mostra o que está na variável de estado
                                onChange={(e) => setPlaca(e.target.value)} // Atualiza o estado a cada tecla digitada
                                required
                            />
                        </div>
                        <div className="form-grupo">
                            <label>Modelo</label>
                            <input
                                type="text"
                                placeholder="Ex: Fiat Fiorino"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-grupo">
                            <label>Quilometragem (km)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={quilometragem}
                                onChange={(e) =>
                                    setQuilometragem(e.target.value)
                                }
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit">
                            Registrar Veículo
                        </button>
                    </form>
                </section>

                {/* COLUNA 2: LISTAGEM DA FROTA ATIVA */}
                <section className="card">
                    <h2>Frota Ativa</h2>
                    <div className="veiculo-list">
                        {/* Lógica condicional (Ternário): Se a lista estiver vazia, mostra aviso. */}
                        {veiculos.length === 0 ? (
                            <p>Nenhum veículo registrado.</p>
                        ) : (
                            // Se tiver veículos, usa a função map() para percorrer o array
                            // e desenhar um item de lista estruturado para cada veículo vindo do banco.
                            veiculos.map((v) => (
                                <div className="veiculo-item" key={v.id}>
                                    <div className="veiculo-info">
                                        <strong>{v.modelo}</strong> ({v.placa})
                                        <small
                                            style={{
                                                display: "block",
                                                margin: "5px 0",
                                                color: "#666",
                                            }}
                                        >
                                            Km atual:{" "}
                                            <strong>
                                                {v.quilometragem} km
                                            </strong>
                                        </small>
                                        {/* Botão de atualização fixado de forma limpa abaixo dos dados do veículo */}
                                        <button
                                            className="btn-atualizar-km"
                                            onClick={() =>
                                                handleAtualizarKm(
                                                    v.id,
                                                    v.quilometragem,
                                                )
                                            }
                                        >
                                            🔄 Atualizar KM
                                        </button>
                                    </div>

                                    {/* Validação visual: Lê o booleano 'alerta_revisao' processado pela
                                        regra de negócio no back-end. Se true, pinta de vermelho (danger). Se false, verde (success). */}
                                    {v.alerta_revisao ? (
                                        <span className="status bg-danger">
                                            Fazer Revisão
                                        </span>
                                    ) : (
                                        <span className="status bg-success">
                                            Em Dia
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* Rodapé institucional exigido pelos critérios de avaliação */}
            <footer className="footer">
                <p>
                    ©2026 Todos os direitos reservados - Projeto desenvolvido na
                    disciplina Back end e Frameworks 3NA.
                </p>
            </footer>
        </div>
    );
}

// Exporta o componente App para ser carregado globalmente pelo index / main.jsx
export default App;

