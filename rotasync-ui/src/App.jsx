import { useState, useEffect } from "react";
import api from "./services/api";
import "./App.css";

function App() {
    // --- ESTADOS ---
    const [veiculos, setVeiculos] = useState([]);
    const [placa, setPlaca] = useState("");
    const [modelo, setModelo] = useState("");
    const [quilometragem, setQuilometragem] = useState("");

    // Carrega a listagem assim que a tela abre
    useEffect(() => {
        carregarVeiculos();
    }, []);

    // --- FUNÇÕES DE COMUNICAÇÃO COM A API ---

    // GET - Busca lista de veículos
    const carregarVeiculos = async () => {
        try {
            // Busca os dados na rota mapeada http://localhost:8000/api/veiculos
            const response = await api.get("/veiculos/");
            setVeiculos(response.data);
        } catch (error) {
            console.error("Erro ao buscar veículos", error);
        }
    };

    // POST - Envia formulário de cadastro
    const cadastrarVeiculo = async (e) => {
        e.preventDefault();
        try {
            await api.post("/veiculos/", {
                placa: placa,
                modelo: modelo,
                quilometragem: parseInt(quilometragem),
            });
            setPlaca("");
            setModelo("");
            setQuilometragem("");
            carregarVeiculos();
            alert("Veículo cadastrado com sucesso!");
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao cadastrar");
        }
    };

    // PUT - Atualiza a quilometragem atual via prompt na tela
    const handleAtualizarKm = async (id, kmAtual) => {
        if (id === undefined || id === null) {
            alert("Erro: ID inválido.");
            return;
        }

        const novaKm = prompt(`Digite a nova quilometragem do veículo (Atual: ${kmAtual} km):`, kmAtual);
        if (novaKm === null || novaKm === "") return;

        const kmFormatada = parseInt(novaKm);
        if (isNaN(kmFormatada) || kmFormatada < 0) {
            alert("Insira um número válido.");
            return;
        }

        try {
            // Envia para a API atualizar no banco de dados SQLite
            await api.put(`/veiculos/${id}/quilometragem`, {
                quilometragem: kmFormatada,
            });

            // Atualiza o estado em memória no React para refletir instantaneamente as alterações
            setVeiculos(
                veiculos.map((v) =>
                    v.id === id
                        ? {
                              ...v,
                              quilometragem: kmFormatada,
                              // Atualiza o alerta comparando se a quilometragem atingiu a meta dinâmica do veículo
                              alerta_revisao: kmFormatada >= v.proxima_revisao_km,
                          }
                        : v,
                ),
            );
            alert("Quilometragem atualizada!");
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao atualizar quilometragem.");
        }
    };

    // PUT - Aciona o registro de conclusão da revisão preventiva
    const handleRegistrarRevisao = async (id) => {
        if (id === undefined || id === null) return;

        if (!window.confirm("Confirmar que a revisão foi realizada? Isso estenderá a meta de revisão por mais 10.000 km.")) {
            return;
        }

        try {
            // Dispara a rota PUT de controle de manutenção
            await api.put(`/veiculos/${id}/registrar-revisao`);

            // Sincroniza a tela do React adicionando +10.000 à meta atual, preservando o odômetro intacto
            setVeiculos(
                veiculos.map((v) =>
                    v.id === id
                        ? {
                              ...v,
                              proxima_revisao_km: v.quilometragem + 10000,
                              alerta_revisao: false
                          }
                        : v,
                ),
            );
            alert("Revisão registrada! Veículo liberado para rodar.");
        } catch (error) {
            alert(error.response?.data?.detail || "Erro ao registrar revisão.");
        }
    };

    // --- RENDERIZAÇÃO DE TELA ---
    return (
        <div className="main">
            <header className="header">
                <h1>RotaSync Logística</h1>
                <p className="subtitulo">Painel de Gestão de Frota</p>
            </header>

            <main className="painel">
                {/* FORMULÁRIO DE CADASTRO */}
                <section className="card">
                    <h2>Novo Veículo</h2>
                    <form onSubmit={cadastrarVeiculo}>
                        <div className="form-grupo">
                            <label>Placa</label>
                            <input
                                type="text"
                                placeholder="ABC-1234"
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-grupo">
                            <label>Modelo</label>
                            <input
                                type="text"
                                placeholder="Ex: Mercedes Sprinter"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-grupo">
                            <label>Quilometragem Inicial (km)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={quilometragem}
                                onChange={(e) => setQuilometragem(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit">
                            Registrar Veículo
                        </button>
                    </form>
                </section>

                {/* LISTAGEM DE VEÍCULOS */}
                <section className="card">
                    <h2>Frota Ativa</h2>
                    <div className="veiculo-list">
                        {veiculos.length === 0 ? (
                            <p>Nenhum veículo registrado.</p>
                        ) : (
                            veiculos.map((v) => (
                                <div className="veiculo-item" key={v.id}>
                                    <div className="veiculo-info">
                                        <strong>{v.modelo}</strong> ({v.placa})

                                        <small style={{ display: "block", margin: "5px 0", color: "#666" }}>
                                            Km atual: <strong>{v.quilometragem} km</strong>
                                        </small>

                                        {/* INFORMAÇÃO COMPLEMENTAR DA META DINÂMICA */}
                                        <small style={{ display: "block", margin: "5px 0", color: "#007bff" }}>
                                            Próxima revisão em: <strong>{v.proxima_revisao_km} km</strong>
                                        </small>

                                        <button
                                            className="btn-atualizar-km"
                                            onClick={() => handleAtualizarKm(v.id, v.quilometragem)}
                                        >
                                            🔄 Atualizar KM
                                        </button>
                                    </div>

                                    {/* EXIBIÇÃO DO BOTÃO SEGUNDO REGRA DE ALERTA ATIVA */}
                                    {v.alerta_revisao ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                                            <span className="status bg-danger">
                                                Fazer Revisão
                                            </span>
                                            <button
                                                className="btn-revisao-feita"
                                                onClick={() => handleRegistrarRevisao(v.id)}
                                            >
                                                🔧 Revisão Realizada
                                            </button>
                                        </div>
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

            <footer className="footer">
                <p>©2026 Todos os direitos reservados - Projeto desenvolvido na disciplina Back end e Frameworks 3NA.</p>
            </footer>
        </div>
    );
}

export default App;
