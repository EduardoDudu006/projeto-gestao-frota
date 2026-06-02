import { useState, useEffect } from "react";
import api from "./services/api";
import "./App.css";

function App() {
    // --- ESTADOS DOS DADOS ---
    const [veiculos, setVeiculos] = useState([]);
    const [placa, setPlaca] = useState("");
    const [modelo, setModelo] = useState("");
    const [quilometragem, setQuilometragem] = useState("");

    // Estados de controle para gerenciar o ciclo de vida dos status sem conflito matemático
    const [historicoRevisados, setHistoricoRevisados] = useState([]);
    const [ignorarTravaNovo, setIgnorarTravaNovo] = useState([]);

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

            await api.post("/veiculos/", {
                placa: placa,
                modelo: modelo,
                quilometragem: kmInicial,
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

            // 1. Marca que o veículo foi atualizado (ignora a trava restritiva de veículo novo)
            setIgnorarTravaNovo((prev) => [...prev, kmModal.veiculoId]);

            // 2. Remove do histórico de revisados para que o alerta real do banco volte a funcionar
            setHistoricoRevisados((prev) =>
                prev.filter((id) => id !== kmModal.veiculoId),
            );

            setKmModal({
                show: false,
                veiculoId: null,
                modelo: "",
                kmAtual: 0,
                novaKm: "",
            });
            carregarVeiculos();
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

    const executarRegistroRevisao = async (id) => {
        try {
            await api.put(`/veiculos/${id}/registrar-revisao`);

            // Inclui no histórico de revisões feitas nesta sessão
            setHistoricoRevisados((prev) => [...prev, id]);

            carregarVeiculos();
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

    // NOVO: Apagar um único veículo por ID
    const apagarVeiculo = async (id) => {
        try {
            await api.delete(`/veiculos/${id}`);

            // Filtra os estados locais para remover o veículo deletado instantaneamente
            setVeiculos((prev) => prev.filter((v) => v.id !== id));
            setHistoricoRevisados((prev) => prev.filter((vId) => vId !== id));
            setIgnorarTravaNovo((prev) => prev.filter((vId) => vId !== id));

            abrirAlerta("Removido 🗑️", "O veículo foi excluído da frota.");
        } catch (error) {
            abrirAlerta(
                "Erro ❌",
                error.response?.data?.detail ||
                    "Erro ao tentar apagar o veículo.",
            );
        }
    };

    // NOVO: Disparar modal de confirmação para exclusão única
    const dispararConfirmacaoApagarVeiculo = (
        id,
        modeloVeiculo,
        placaVeiculo,
    ) => {
        abrirConfirmacao(
            "Excluir Veículo 🗑️",
            `Você tem certeza que deseja remover o veículo ${modeloVeiculo} (${placaVeiculo}) da frota?`,
            () => apagarVeiculo(id),
        );
    };

    const apagarTodosVeiculos = async () => {
        try {
            await api.delete("/veiculos/");

            setVeiculos([]);
            setHistoricoRevisados([]);
            setIgnorarTravaNovo([]);

            abrirAlerta(
                "Frota Zerada 🗑️",
                "Todos os veículos foram removidos com sucesso!",
            );
        } catch (error) {
            abrirAlerta(
                "Erro ❌",
                error.response?.data?.detail ||
                    "Erro ao tentar apagar a frota.",
            );
        }
    };

    const dispararConfirmacaoApagarTudo = () => {
        abrirConfirmacao(
            "Atenção Crítica ⚠️",
            "Você tem certeza que deseja apagar TODOS os veículos cadastrados? Esta ação é irreversível.",
            apagarTodosVeiculos,
        );
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
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                        }}
                    >
                        <h2>Frota Ativa</h2>
                        {veiculos.length > 0 && (
                            <button
                                onClick={dispararConfirmacaoApagarTudo}
                                style={{
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    padding: "8px 12px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                }}
                            >
                                🗑️ Limpar Frota
                            </button>
                        )}
                    </div>

                    <div className="veiculo-list">
                        {veiculos.length === 0 ? (
                            <p>Nenhum veículo registrado.</p>
                        ) : (
                            veiculos.map((v) => {
                                const foiRevisado = historicoRevisados.includes(
                                    v.id,
                                );
                                const mudouKm = ignorarTravaNovo.includes(v.id);

                                const precisaRevisao =
                                    v.alerta_revisao ||
                                    (!foiRevisado &&
                                        !mudouKm &&
                                        v.proxima_revisao_km ===
                                            v.quilometragem + 10000 &&
                                        v.quilometragem >= 10000);

                                return (
                                    <div className="veiculo-item" key={v.id}>
                                        <div className="veiculo-info">
                                            <strong>{v.modelo}</strong> (
                                            {v.placa})
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
                                            {/* Div de botões de gerenciamento do veículo */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "10px",
                                                    marginTop: "10px",
                                                }}
                                            >
                                                <button
                                                    className="btn-atualizar-km"
                                                    onClick={() =>
                                                        dispararModalKm(
                                                            v.id,
                                                            v.modelo,
                                                            v.quilometragem,
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#007bff",
                                                        color: "#ffffff",
                                                        border: "1px solid #64748b",
                                                        padding: "5px 10px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    🔄 Atualizar KM
                                                </button>

                                                {/* NOVO BOTÃO: Excluir veículo específico */}
                                                <button
                                                    onClick={() =>
                                                        dispararConfirmacaoApagarVeiculo(
                                                            v.id,
                                                            v.modelo,
                                                            v.placa,
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#dc3545",
                                                        color: "#ffffff",
                                                        border: "1px solid #dc3545",
                                                        padding: "5px 10px",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    🗑️ Excluir
                                                </button>
                                            </div>
                                        </div>

                                        {precisaRevisao ? (
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
                                );
                            })
                        )}
                    </div>
                </section>
            </main>

            {/* --- CARDS DE MODAL CENTRALIZADOS --- */}

            {/* 1. Modal de Notificação Geral */}
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
                <p style={{ margin: 0, fontSize: "15px" }}>
                    ©2026 RotaSync - Projeto da Disciplina de Back-End Frameworks 3NA -
                    UNINASSAU.
                </p>
            </footer>
        </div>
    );
}

export default App;





