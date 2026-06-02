import { useState, useEffect } from "react";
import api from "./services/api";
import "./App.css";

function App() {
    // --- ESTADOS DOS DADOS ---
    const [veiculos, setVeiculos] = useState([]);
    const [placa, setPlaca] = useState("");
    const [modelo, setModelo] = useState("");
    const [quilometragem, setQuilometragem] = useState("");

    // --- ESTADOS DOS MODALS CUSTOMIZADOS (CARDS) ---
    const [modal, setModal] = useState({
        show: false,
        type: "alert", // "alert" ou "confirm"
        title: "",
        message: "",
        onConfirm: null,
    });

    const [kmModal, setKmModal] = useState({
        show: false,
        veiculoId: null,
        modelo: "",
        kmAtual: 0,
        novaKm: "",
    });

    useEffect(() => {
        carregarVeiculos();
    }, []);

    // --- GERENCIADORES DOS MODALS VISUAIS ---
    const abrirAlerta = (title, message) => {
        setModal({
            show: true,
            type: "alert",
            title,
            message,
            onConfirm: null,
        });
    };

    const abrirConfirmacao = (title, message, acaoConfirmar) => {
        setModal({
            show: true,
            type: "confirm",
            title,
            message,
            onConfirm: () => {
                acaoConfirmar();
                fecharModal();
            },
        });
    };

    const fecharModal = () => {
        setModal({
            show: false,
            type: "alert",
            title: "",
            message: "",
            onConfirm: null,
        });
    };

    // --- FUNÇÕES DE REQUISIÇÃO (API) ---

    const carregarVeiculos = async () => {
        try {
            const response = await api.get("/veiculos/");
            setVeiculos(response.data);
        } catch (error) {
            console.error("Erro ao buscar veículos", error);
        }
    };

    const cadastrarVeiculo = async (e) => {
        e.preventDefault();
        try {
            const kmInicial = parseInt(quilometragem);

            // CORREÇÃO: Enviando o estado do alerta calculado com base na quilometragem inicial
            await api.post("/veiculos/", {
                placa: placa,
                modelo: modelo,
                quilometragem: kmInicial,
                alerta_revisao: kmInicial >= 10000,
            });

            setPlaca("");
            setModelo("");
            setQuilometragem("");
            carregarVeiculos();
            abrirAlerta(
                "Sucesso 🎉",
                "Veículo registrado com sucesso na frota!",
            );
        } catch (error) {
            abrirAlerta(
                "Erro ❌",
                error.response?.data?.detail || "Erro ao realizar o cadastro.",
            );
        }
    };

    const dispararModalKm = (id, modeloVeiculo, kmAtual) => {
        setKmModal({
            show: true,
            veiculoId: id,
            modelo: modeloVeiculo,
            kmAtual: kmAtual,
            novaKm: kmAtual.toString(),
        });
    };

    const salvarNovaQuilometragem = async () => {
        const kmFormatada = parseInt(kmModal.novaKm);
        if (isNaN(kmFormatada) || kmFormatada < 0) {
            abrirAlerta(
                "Aviso ⚠️",
                "Insira um número de quilometragem válido.",
            );
            return;
        }

        try {
            await api.put(`/veiculos/${kmModal.veiculoId}/quilometragem`, {
                quilometragem: kmFormatada,
            });
            setKmModal({
                show: false,
                veiculoId: null,
                modelo: "",
                kmAtual: 0,
                novaKm: "",
            });
            carregarVeiculos(); // Recarrega direto do banco garantindo sincronia
            abrirAlerta(
                "Atualizado 🔄",
                "Quilometragem do veículo atualizada!",
            );
        } catch (error) {
            abrirAlerta(
                "Erro ❌",
                error.response?.data?.detail || "Erro ao atualizar dados.",
            );
        }
    };

    const ejecutarRegistroRevisao = async (id) => {
        try {
            await api.put(`/veiculos/${id}/registrar-revisao`);
            carregarVeiculos(); // Recarga sincronizada com o SQLite
            abrirAlerta(
                "Sucesso 🔧",
                "Revisão efetuada! Meta estendida por mais 10.000 km.",
            );
        } catch (error) {
            abrirAlerta(
                "Erro ❌",
                error.response?.data?.detail || "Erro ao registrar revisão.",
            );
        }
    };

    return (
        <div className="main">
            <header className="header">
                <h1>RotaSync Logística</h1>
                <p className="subtitulo">Painel de Gestão de Frota</p>
            </header>

            <main className="painel">
                {/* CADASTRO */}
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
                                placeholder="Ex: Hyundai HR"
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

                {/* LISTAGEM */}
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
                                        <small
                                            style={{
                                                display: "block",
                                                margin: "5px 0",
                                                color: "#007bff",
                                            }}
                                        >
                                            Próxima revisão em:{" "}
                                            <strong>
                                                {v.proxima_revisao_km ??
                                                    v.quilometragem +
                                                        10000}{" "}
                                                km
                                            </strong>
                                        </small>
                                        <button
                                            className="btn-atualizar-km"
                                            onClick={() =>
                                                dispararModalKm(
                                                    v.id,
                                                    v.modelo,
                                                    v.quilometragem,
                                                )
                                            }
                                        >
                                            🔄 Atualizar KM
                                        </button>
                                    </div>

                                    {v.alerta_revisao ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "8px",
                                                alignItems: "flex-end",
                                            }}
                                        >
                                            <span className="status bg-danger">
                                                Fazer Revisão
                                            </span>
                                            <button
                                                className="btn-revisao-feita"
                                                onClick={() =>
                                                    abrirConfirmacao(
                                                        "Confirmar Revisão 🔧",
                                                        `Deseja confirmar que a revisão do veículo ${v.modelo} foi feita? Isso acrescentará 10.000 km na próxima meta de manutenção.`,
                                                        () =>
                                                            executarRegistroRevisao(
                                                                v.id,
                                                            ),
                                                    )
                                                }
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

            {/* --- CARDS DE MODAL CENTRALIZADOS NO PADRÃO DA PÁGINA --- */}

            {/* 1. Modal de Notificação Geral (Alertas / Confirmações) */}
            {modal.show && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>{modal.title}</h3>
                        <p>{modal.message}</p>
                        <div className="modal-botoes">
                            {modal.type === "confirm" ? (
                                <>
                                    <button
                                        className="btn-modal-cancel"
                                        onClick={fecharModal}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn-modal-confirm"
                                        onClick={modal.onConfirm}
                                    >
                                        Confirmar
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-modal-confirm"
                                    onClick={fecharModal}
                                >
                                    Fechar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal de Input para Atualização de Quilometragem */}
            {kmModal.show && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Atualizar Odômetro</h3>
                        <p style={{ fontSize: "14px", color: "#555" }}>
                            Veículo: <strong>{kmModal.modelo}</strong>
                        </p>

                        <div
                            className="form-grupo"
                            style={{ textAlign: "left", marginTop: "15px" }}
                        >
                            <label>Nova Quilometragem Atual (km)</label>
                            <input
                                type="number"
                                value={kmModal.novaKm}
                                onChange={(e) =>
                                    setKmModal({
                                        ...kmModal,
                                        novaKm: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="modal-botoes">
                            <button
                                className="btn-modal-cancel"
                                onClick={() =>
                                    setKmModal({
                                        show: false,
                                        veiculoId: null,
                                        modelo: "",
                                        kmAtual: 0,
                                        novaKm: "",
                                    })
                                }
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-modal-confirm"
                                onClick={salvarNovaQuilometragem}
                            >
                                Salvar Alteração
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer
                className="footer"
                style={{
                    marginTop: "40px",
                    padding: "15px",
                    borderRadius: "8px 8px 0 0",
                }}
            >
                <p style={{ margin: 0, fontSize: "13px" }}>
                    ©2026 RotaSync - Disciplina de Back end e Frameworks 3NA -
                    UNINASSAU.
                </p>
            </footer>
        </div>
    );
}

export default App;
