<script lang="ts">
    import { fade } from "svelte/transition";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { onMount } from "svelte";
    import { currentUser } from "$lib/utils/auth";
    import Toast from "$lib/components/Toast.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import Container from "$lib/components/Container.svelte";
    import type {
        CriteriosGroup,
        ProblemaModel,
        AvaliacaoNota,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";

    interface AvaliacaoData {
        aluno: {
            nome: string;
            avatar: string;
        };
        notas: { [tag: string]: { [criterio: string]: number } };
    }

    let problema: ProblemaModel;
    let criterios: CriteriosGroup = {};

    // Initialize with empty object to prevent undefined errors
    let avaliacaoData: AvaliacaoData = {
        aluno: {
            nome: "",
            avatar: "/avatars/default.png",
        },
        notas: {},
    };

    let loading = true;
    let error: string | null = null;
    let showToast = false;
    let toastMessage: string = "";
    let toastType: "success" | "error" | "info" = "error";
    let criterioAtual: string | null = null;
    let showDialog = false;

    // Keep track of current values separately to avoid binding issues
    let currentValues: { [tag: string]: { [criterio: string]: number } } = {};

    function initializeNotas() {
        const notasInit: { [tag: string]: { [criterio: string]: number } } = {};
        Object.entries(criterios).forEach(([tag, criteriosList]) => {
            notasInit[tag] = {};
            criteriosList.forEach((criterio) => {
                notasInit[tag][criterio.nome_criterio.toLowerCase()] = 0;
            });
        });
        return notasInit;
    }

    function handleValueChange(tag: string, criterioKey: string, event: Event) {
        const input = event.target as HTMLInputElement;
        const value = parseFloat(input.value);

        if (!currentValues[tag]) {
            currentValues[tag] = {};
        }

        if (!isNaN(value)) {
            currentValues[tag][criterioKey] = value;
        }

        // Update the main data structure
        avaliacaoData.notas = { ...currentValues };
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;
            const id_problema = $page.params.id_problema;
            const id_aluno = $page.params.id_aluno;

            // Get the problem details
            const problemaResponse = await api.get(
                `/problemas/get?id_problema=${id_problema}`,
            );
            problema = Parsers.parseProblema(problemaResponse);
            criterios = problema.criterios;

            // Get the student details
            const aluno = await api.get(`/alunos/get?id_aluno=${id_aluno}`);

            // Initialize the current values
            currentValues = initializeNotas();

            // Initialize avaliacaoData
            avaliacaoData = {
                aluno: {
                    nome: aluno[0].nome_completo,
                    avatar: "/avatars/default.png",
                },
                notas: { ...currentValues },
            };

            // Get existing evaluation if any
            const avaliacoes = await api.get(
                `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${$currentUser?.id}`,
            );
            const existingAvaliacao = avaliacoes.find(
                (av: any) => av.id_aluno_avaliado === parseInt(id_aluno),
            );

            if (existingAvaliacao) {
                const existingNotas = JSON.parse(existingAvaliacao.notas);
                // Update current values with existing data
                Object.entries(currentValues).forEach(([tag, criterios]) => {
                    if (existingNotas[tag]) {
                        currentValues[tag] = {
                            ...criterios,
                            ...existingNotas[tag],
                        };
                    }
                });
                // Update avaliacaoData
                avaliacaoData.notas = { ...currentValues };
            }
        } catch (e: any) {
            error = e.message || "Erro ao carregar dados";
            toastType = "error";
            showToast = true;
        } finally {
            loading = false;
        }
    }

    function showCriterios(tag: string) {
        criterioAtual = tag;
        showDialog = true;
    }

    function hideCriterios() {
        criterioAtual = null;
        showDialog = false;
    }

    async function handleSubmit() {
        try {
            const id_problema = $page.params.id_problema;
            const id_aluno = $page.params.id_aluno;

            const media = calculateMedia();
            const notas = {
                ...currentValues,
                media,
            };

            await api.post("/problemas/add-avaliacao", {
                id_problema: parseInt(id_problema),
                id_aluno_avaliador: $currentUser?.id,
                id_aluno_avaliado: parseInt(id_aluno),
                notas: JSON.stringify(notas),
            });

            toastType = "success";
            toastMessage = "Avaliação salva com sucesso!";
            showToast = true;

            setTimeout(() => {
                history.back();
            }, 2000);
        } catch (e: any) {
            error = e.message || "Erro ao salvar avaliação";
            toastType = "error";
            showToast = true;
        }
    }

    function calculateMedia(): number {
        let total = 0;
        let count = 0;

        Object.entries(currentValues).forEach(([_, criterios]) => {
            Object.values(criterios).forEach((nota) => {
                if (!isNaN(nota)) {
                    total += nota;
                    count++;
                }
            });
        });

        return count > 0 ? total / count : 0;
    }

    function formatValue(value: number): string {
        return value.toFixed(1);
    }

    onMount(fetchData);
</script>

<div class="container" transition:fade={{ duration: 300 }}>
    <div class="header">
        <button class="close-btn" on:click={() => history.back()}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <h1>Avaliação Individual</h1>
    </div>

    <div class="student-info">
        <div class="avatar">
            <img
                src={avaliacaoData.aluno.avatar}
                alt={avaliacaoData.aluno.nome}
            />
        </div>
        <p>
            Como foi o desempenho de <span class="highlight"
                >{avaliacaoData.aluno.nome}</span
            > nesse problema?
        </p>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
        {#each Object.entries(criterios) as [tag, criteriosList]}
            <div class="evaluation-section">
                <h2>{tag}</h2>

                <div class="criteria-group">
                    {#each criteriosList as criterio}
                        {@const criterioKey =
                            criterio.nome_criterio.toLowerCase()}
                        <label>
                            <span class="criteria-header">
                                <span>{criterio.nome_criterio}</span>
                                <span class="range"
                                    >0,0 a {criterio.nota_maxima}</span
                                >
                            </span>
                            <div class="input-wrapper">
                                <div class="slider-container">
                                    <input
                                        type="range"
                                        step="0.1"
                                        min="0"
                                        max={criterio.nota_maxima}
                                        value={currentValues[tag]?.[
                                            criterioKey
                                        ] || 0}
                                        on:input={(e) =>
                                            handleValueChange(
                                                tag,
                                                criterioKey,
                                                e,
                                            )}
                                        class="slider"
                                    />
                                    <div class="value-display">
                                        {formatValue(
                                            currentValues[tag]?.[criterioKey] ||
                                                0,
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="criteria-btn"
                                    on:click={() => showCriterios(tag)}
                                >
                                    Critérios
                                </button>
                            </div>
                        </label>
                    {/each}
                </div>
            </div>
        {/each}

        <button type="submit" class="submit-btn">Salvar</button>
    </form>

    {#if criterioAtual && showDialog}
        <Dialog
            open={showDialog}
            closeOnClickOutside={true}
            on:close={hideCriterios}
        >
            <h3 slot="header">Critérios de {criterioAtual}</h3>
            <div class="dialog-content">
                <p class="criteria-subtitle">
                    Para avaliar o desempenho sobre essa categoria siga os
                    seguintes critérios:
                </p>
                <ul>
                    {#each criterios[criterioAtual] as criterio}
                        <li>{criterio.descricao_criterio}</li>
                    {/each}
                </ul>
            </div>
        </Dialog>
    {/if}

    {#if showToast}
        <Toast
            message={toastMessage}
            type={toastType}
            on:close={() => (showToast = false)}
        />
    {/if}
</div>

<style>
    .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        position: relative;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .close-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        transform: scale(1.1);
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
    }

    .student-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 249, 250, 0.95) 100%
        );
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .student-info p {
        font-size: 1.125rem;
        color: #495057;
        margin: 0;
    }

    .highlight {
        color: #667eea;
        font-weight: 600;
    }

    .evaluation-section {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 249, 250, 0.95) 100%
        );
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 1.5rem 0;
    }

    .criteria-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .criteria-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .range {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .input-wrapper {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .slider-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(248, 249, 250, 0.9) 100%
        );
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid rgba(206, 212, 218, 0.4);
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        outline: none;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .slider:hover {
        opacity: 1;
    }

    .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .slider::-moz-range-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .value-display {
        min-width: 3rem;
        text-align: center;
        font-weight: 500;
        color: #495057;
        font-size: 1rem;
        padding: 0.25rem 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid rgba(206, 212, 218, 0.4);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    input[type="number"] {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(248, 249, 250, 0.9) 100%
        );
        color: #495057;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    input[type="number"]:focus {
        outline: none;
        border-color: #667eea;
        box-shadow:
            0 0 0 3px rgba(102, 126, 234, 0.25),
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .criteria-btn {
        padding: 0.75rem 1.25rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 249, 250, 0.95) 100%
        );
        color: #667eea;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .criteria-btn:hover {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(248, 249, 250, 1) 100%
        );
        transform: translateY(-1px);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .submit-btn {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow:
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .dialog-content {
        padding: 1rem 0;
    }

    .criteria-subtitle {
        color: #667eea;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
    }

    .dialog-content ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .dialog-content li {
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(206, 212, 218, 0.2);
        color: #495057;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .dialog-content li:before {
        content: "•";
        color: #667eea;
        font-weight: bold;
    }

    .dialog-content li:last-child {
        border-bottom: none;
    }

    @media (max-width: 768px) {
        .container {
            padding: 1rem;
        }

        .student-info {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
        }

        .avatar {
            width: 64px;
            height: 64px;
        }

        .evaluation-section {
            padding: 1rem;
        }

        .input-wrapper {
            flex-direction: column;
        }

        .criteria-btn {
            padding: 0.5rem 1rem;
        }
    }

    @media (max-width: 480px) {
        h1 {
            font-size: 1.5rem;
        }

        .student-info p {
            font-size: 1rem;
        }

        .criteria-content {
            padding: 1.5rem;
        }
    }
</style>
