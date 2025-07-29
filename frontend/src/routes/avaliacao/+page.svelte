<script lang="ts">
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { onMount } from "svelte";
    import Toast from "$lib/components/Toast.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import Container from "$lib/components/Container.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import type {
        CriteriosGroup,
        ProblemaModel,
        AvaliacaoNota,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import { logger } from "$lib/utils/logger";
    import { MediaCalculator } from "$lib/utils/utils";
    import { currentUser } from "$lib/utils/auth";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { DateUtils } from "$lib/utils/utils";
    import Button from "$lib/components/Button.svelte";

    interface AvaliacaoData {
        aluno: {
            nome: string;
            avatar: string;
        };
        notas: { [tag: string]: { [criterio: string]: number } };
    }

    // Query parameters
    let id_problema: string;
    let id_aluno_avaliador: string | null;
    let id_aluno_avaliado: string | null;
    let id_professor: string | null;
    let isProfessorEvaluation = false;

    let problema: ProblemaModel;
    let criterios: CriteriosGroup = {};
    let avaliacaoData: AvaliacaoData = {
        aluno: {
            nome: "",
            avatar: "/images/default_avatar.png",
        },
        notas: {},
    };
    let loading = true;
    let error: string | null = null;
    let showToast = false;
    let toastMessage: string = "";
    let toastType: "success" | "error" | "info" = "error";
    let criterioAtual: { tag: string; criterio: any } | null = null;
    let showDialog = false;
    let showLoadingDialog = false;
    let loadingMessage = "";
    let currentValues: { [tag: string]: { [criterio: string]: number } } = {};
    let isSubmitting = false;

    // Helper to check if a tag is currently active (for alunos only)
    function isTagActive(tag: string): boolean {
        if (isProfessorEvaluation) return true;
        if (!problema) return false;
        return DateUtils.isNowWithinTagDateRange(problema, tag);
    }

    // Parse query parameters
    $: {
        id_problema = $page.url.searchParams.get("id_problema") || "";
        id_aluno_avaliador = $page.url.searchParams.get("id_aluno_avaliador");
        id_aluno_avaliado = $page.url.searchParams.get("id_aluno_avaliado");
        id_professor = $page.url.searchParams.get("id_professor");

        // Determine if this is a professor evaluation
        isProfessorEvaluation = !!id_professor;

        logger.info("Query parameters parsed", {
            id_problema,
            id_aluno_avaliador,
            id_aluno_avaliado,
            id_professor,
            isProfessorEvaluation,
        });
    }

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
        avaliacaoData.notas = { ...currentValues };
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Validate required parameters
            if (!id_problema || !id_aluno_avaliado) {
                error = "Parâmetros obrigatórios não fornecidos.";
                return;
            }

            if (!isProfessorEvaluation && !id_aluno_avaliador) {
                error =
                    "ID do aluno avaliador é obrigatório para avaliações de alunos.";
                return;
            }

            if (isProfessorEvaluation && !id_professor) {
                error =
                    "ID do professor é obrigatório para avaliações de professores.";
                return;
            }

            // Get the problem details
            const problemaResponse = await api.get(
                `/problemas/get?id_problema=${id_problema}`,
            );
            problema = Parsers.parseProblema(problemaResponse);
            criterios = problema.criterios;

            // Get the student details (who is being evaluated)
            const aluno = await api.get(
                `/alunos/get?id_aluno=${id_aluno_avaliado}`,
            );

            // Initialize the current values
            currentValues = initializeNotas();
            avaliacaoData = {
                aluno: {
                    nome: aluno.nome_completo,
                    avatar: aluno.link_avatar || "/images/default_avatar.png",
                },
                notas: { ...currentValues },
            };

            // Get existing evaluation if any
            let avaliacoes;
            if (isProfessorEvaluation) {
                // For professor evaluations, filter by professor
                avaliacoes = await api.get(
                    `/avaliacoes/list?id_problema=${id_problema}&id_professor=${id_professor}`,
                );
            } else {
                // For student evaluations, filter by student evaluator
                avaliacoes = await api.get(
                    `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${id_aluno_avaliador}`,
                );
            }

            const existingAvaliacao = avaliacoes.find(
                (av: any) =>
                    av.id_aluno_avaliado === parseInt(id_aluno_avaliado!),
            );

            if (existingAvaliacao) {
                const existingNotas = JSON.parse(existingAvaliacao.notas);
                Object.entries(currentValues).forEach(([tag, criterios]) => {
                    if (existingNotas[tag]) {
                        currentValues[tag] = {
                            ...criterios,
                            ...existingNotas[tag],
                        };
                    }
                });
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

    function showCriterios(tag: string, criterio: any) {
        criterioAtual = { tag, criterio };
        showDialog = true;
    }

    function hideCriterios() {
        criterioAtual = null;
        showDialog = false;
    }

    function zerarTodasNotas() {
        Object.entries(criterios).forEach(([tag, criteriosList]) => {
            if (!currentValues[tag]) {
                currentValues[tag] = {};
            }
            criteriosList.forEach((criterio) => {
                const criterioKey = criterio.nome_criterio.toLowerCase();
                currentValues[tag][criterioKey] = 0;
            });
        });
        avaliacaoData.notas = { ...currentValues };
        // Força uma atualização reativa
        currentValues = { ...currentValues };
    }

    async function zerarTodasAvaliacoesDoAluno(
        tagEspecifica: string | null = null,
    ) {
        try {
            if (!id_problema || !id_aluno_avaliado) {
                throw new Error("Parâmetros obrigatórios não fornecidos.");
            }

            // 1. Buscar todas as avaliações do problema
            loadingMessage = "Buscando avaliações relacionadas...";
            const allAvaliacoes = await AvaliacoesService.getByProblema(
                id_problema.toString(),
                true,
            );

            // 2. Filtrar avaliações onde o aluno aparece APENAS como avaliado (não como avaliador)
            loadingMessage = "Identificando avaliações para remover...";
            const avaliacoesParaDeletar = allAvaliacoes.filter((av) => {
                const alunoEhAvaliado =
                    av.aluno_avaliado?.id === parseInt(id_aluno_avaliado!);
                // Não deletar avaliações onde ele é o avaliador (para não afetar notas de colegas)
                return alunoEhAvaliado;
            });

            console.log(
                "Avaliações para deletar (apenas onde é avaliado):",
                avaliacoesParaDeletar,
            );

            // 3. Deletar apenas as avaliações onde o aluno foi avaliado
            loadingMessage = `Removendo ${avaliacoesParaDeletar.length} avaliação(ões) recebidas...`;
            for (const av of avaliacoesParaDeletar) {
                await AvaliacoesService.delete(
                    av.id_avaliacao.toString(),
                    id_problema.toString(),
                );
            }

            // 4. Criar novas avaliações zeradas para a tag específica ou todas
            loadingMessage = "Preparando novas avaliações...";
            const notasZeradas: {
                [tag: string]: { [criterio: string]: number };
            } = {};

            Object.entries(criterios).forEach(([tag, criteriosList]) => {
                // Se foi especificada uma tag, só zerar essa tag, senão zerar tudo
                if (!tagEspecifica || tag === tagEspecifica) {
                    notasZeradas[tag] = {};
                    criteriosList.forEach((criterio) => {
                        const criterioKey =
                            criterio.nome_criterio.toLowerCase();
                        notasZeradas[tag][criterioKey] = 0;
                    });
                } else if (currentValues[tag]) {
                    // Manter valores existentes para outras tags
                    notasZeradas[tag] = { ...currentValues[tag] };
                }
            });

            // 5. Salvar a avaliação atual com notas zeradas
            loadingMessage = "Salvando nova avaliação...";
            if (isProfessorEvaluation) {
                const payload = {
                    id_problema: parseInt(id_problema),
                    id_professor: parseInt(id_professor!),
                    id_aluno_avaliado: parseInt(id_aluno_avaliado),
                    notas: JSON.stringify(notasZeradas),
                };
                await AvaliacoesService.create(payload);
            } else {
                const media =
                    MediaCalculator.calculateCurrentMedia(notasZeradas);
                const notasWithMedia = {
                    ...notasZeradas,
                    media,
                };
                const payload = {
                    id_problema: parseInt(id_problema),
                    id_aluno_avaliador: parseInt(id_aluno_avaliador!),
                    id_aluno_avaliado: parseInt(id_aluno_avaliado),
                    notas: JSON.stringify(notasWithMedia),
                };
                await AvaliacoesService.create(payload);
            }

            // 6. Atualizar estado local
            loadingMessage = "Finalizando processo...";
            currentValues = { ...notasZeradas };
            avaliacaoData.notas = { ...notasZeradas };

            return true;
        } catch (e: any) {
            console.error("Erro ao zerar avaliações:", e);
            throw e;
        }
    }

    async function handleFaltaAbertura() {
        try {
            showLoadingDialog = true;
            loadingMessage = "Registrando falta na Análise do Problema...";

            await zerarTodasAvaliacoesDoAluno("Análise do Problema");

            showLoadingDialog = false;
            toastType = "success";
            toastMessage =
                "Falta registrada na Análise do Problema! Avaliações recebidas pelo aluno foram zeradas.";
            showToast = true;
        } catch (e: any) {
            showLoadingDialog = false;
            error = e.message || "Erro ao registrar falta na abertura";
            toastType = "error";
            showToast = true;
        }
    }

    async function handleFaltaFechamento() {
        try {
            showLoadingDialog = true;
            loadingMessage = "Registrando falta na Resolução do Problema...";

            await zerarTodasAvaliacoesDoAluno("Resolução do Problema");

            showLoadingDialog = false;
            toastType = "success";
            toastMessage =
                "Falta registrada na Resolução do Problema! Avaliações recebidas pelo aluno foram zeradas.";
            showToast = true;
        } catch (e: any) {
            showLoadingDialog = false;
            error = e.message || "Erro ao registrar falta no fechamento";
            toastType = "error";
            showToast = true;
        }
    }

    async function handleSubmit() {
        try {
            isSubmitting = true;

            if (!id_problema || !id_aluno_avaliado) {
                error = "Parâmetros obrigatórios não fornecidos.";
                return;
            }

            // 1. Fetch all evaluations for this problem
            const allAvaliacoes = await AvaliacoesService.getByProblema(
                id_problema.toString(),
                true,
            );

            console.log(`allAvaliacoes: ${JSON.stringify(allAvaliacoes)}`);

            // 2. Filter for duplicates
            let duplicates = [];
            if (isProfessorEvaluation) {
                duplicates = allAvaliacoes.filter(
                    (av) =>
                        av.id_problema === parseInt(id_problema) &&
                        av.id_professor === parseInt(id_professor!) &&
                        av.aluno_avaliado?.id ===
                            parseInt(id_aluno_avaliado || "0"),
                );
            } else {
                duplicates = allAvaliacoes.filter(
                    (av) =>
                        av.id_problema === parseInt(id_problema) &&
                        av.aluno_avaliador?.id ===
                            parseInt(id_aluno_avaliador!) &&
                        av.aluno_avaliado?.id ===
                            parseInt(id_aluno_avaliado || "0"),
                );

                console.log(
                    `duplicates: ${JSON.stringify(duplicates)}`,
                    `id_problema: ${id_problema}`,
                    `id_aluno_avaliador: ${id_aluno_avaliador}`,
                    `id_aluno_avaliado: ${id_aluno_avaliado}`,
                );
            }

            // 3. Delete duplicates
            for (const av of duplicates) {
                await AvaliacoesService.delete(
                    av.id_avaliacao.toString(),
                    id_problema.toString(),
                );
            }

            const notas = { ...currentValues };

            if (isProfessorEvaluation) {
                // Use the new avaliacoes/create endpoint for professor evaluations
                const payload = {
                    id_problema: parseInt(id_problema),
                    id_professor: parseInt(id_professor!),
                    id_aluno_avaliado: parseInt(id_aluno_avaliado),
                    notas: JSON.stringify(notas),
                };
                await AvaliacoesService.create(payload);
            } else {
                // Use the existing problemas/add-avaliacao endpoint for student evaluations
                const media =
                    MediaCalculator.calculateCurrentMedia(currentValues);
                const notasWithMedia = {
                    ...notas,
                    media,
                };
                const payload = {
                    id_problema: parseInt(id_problema),
                    id_aluno_avaliador: parseInt(id_aluno_avaliador!),
                    id_aluno_avaliado: parseInt(id_aluno_avaliado),
                    notas: JSON.stringify(notasWithMedia),
                };
                await AvaliacoesService.create(payload);
            }

            toastType = "success";
            toastMessage = "Avaliação salva com sucesso!";
            showToast = true;
            history.back();
        } catch (e: any) {
            error = e.message || "Erro ao salvar avaliação";
            toastType = "error";
            showToast = true;
        } finally {
            isSubmitting = false;
        }
    }

    onMount(fetchData);
</script>

<div class="evaluation-container">
    <div class="back-section">
        <BackButton text="Voltar" on:click={() => history.back()} />
    </div>
    <div class="header">
        <h1>
            Avaliação Individual {isProfessorEvaluation ? "(Professor)" : ""}
        </h1>
    </div>
    <div class="student-info">
        <div class="avatar">
            <img
                src={avaliacaoData.aluno.avatar || "/images/default_avatar.png"}
                alt={avaliacaoData.aluno.nome || "Avatar do aluno"}
                on:error={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target) {
                        target.src = "/images/default_avatar.png";
                    }
                }}
            />
        </div>
        <p>
            Como foi o desempenho de <span class="highlight"
                >{avaliacaoData.aluno.nome}</span
            > nesse problema?
        </p>
    </div>
    <form on:submit|preventDefault={handleSubmit}>
        <div class="evaluation-grid">
            {#each Object.entries(criterios) as [tag, criteriosList]}
                <div
                    class="evaluation-section {isTagActive(tag)
                        ? ''
                        : 'inactive-section'}"
                >
                    <div class="section-header">
                        <h2>{tag}</h2>
                        {#if isProfessorEvaluation}
                            {#if tag === "Análise do Problema"}
                                <button
                                    type="button"
                                    class="falta-section-btn"
                                    on:click={() => handleFaltaAbertura()}
                                    title="Registrar falta na Análise do Problema - zera avaliações recebidas pelo aluno"
                                    disabled={!isTagActive(tag) ||
                                        showLoadingDialog}
                                >
                                    Falta
                                </button>
                            {:else if tag === "Resolução do Problema"}
                                <button
                                    type="button"
                                    class="falta-section-btn"
                                    on:click={() => handleFaltaFechamento()}
                                    title="Registrar falta na Resolução do Problema - zera avaliações recebidas pelo aluno"
                                    disabled={!isTagActive(tag) ||
                                        showLoadingDialog}
                                >
                                    Falta
                                </button>
                            {/if}
                        {/if}
                    </div>
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
                                            disabled={!isTagActive(tag)}
                                        />
                                        <div class="value-display">
                                            {(
                                                currentValues[tag]?.[
                                                    criterioKey
                                                ] || 0
                                            ).toFixed(1)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        class="criteria-btn"
                                        on:click={() =>
                                            showCriterios(tag, criterio)}
                                        disabled={!isTagActive(tag)}
                                    >
                                        Critérios
                                    </button>
                                </div>
                            </label>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
        {#if !loading && problema && avaliacaoData.aluno.nome}
            <div class="submit-btn-container">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={showLoadingDialog || isSubmitting}
                    loading={isSubmitting}
                >
                    Salvar Avaliação
                </Button>
            </div>
        {/if}
    </form>
</div>

{#if criterioAtual && showDialog}
    <Dialog
        open={showDialog}
        closeOnClickOutside={true}
        on:close={hideCriterios}
    >
        <h3 slot="header">
            Critérios de {criterioAtual.tag} - {criterioAtual.criterio
                .nome_criterio}
        </h3>
        <div class="dialog-content">
            <p class="criteria-subtitle">
                Para avaliar o desempenho sobre esse critério siga a seguinte
                descrição:
            </p>
            <div class="criteria-description">
                {#each criterioAtual.criterio.descricao_criterio.split("\n") as line}
                    <p>{line}</p>
                {/each}
            </div>
        </div>
    </Dialog>
{/if}

{#if showLoadingDialog}
    <Dialog open={showLoadingDialog} closeOnClickOutside={false}>
        <h3 slot="header">Processando Falta</h3>
        <div class="loading-dialog-content">
            <div class="loading-container">
                <LoadingSpinner size="lg" />
                <p class="loading-text">{loadingMessage}</p>
                <p class="loading-subtitle">
                    Removendo avaliações recebidas pelo aluno...
                </p>
            </div>
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

<style>
    /* Use the same styles as the existing evaluation pages for consistency */
    .evaluation-container {
        position: relative;
        min-height: 100%;
        height: fit-content;
    }
    .back-section {
        margin-bottom: 1.5rem;
    }
    .header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0 0 2rem 0;
    }
    h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
    }
    .student-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        padding: 1.5rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04);
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
    .evaluation-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .evaluation-section {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04);
    }
    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
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
        gap: 0.2rem;
        align-items: center;
    }
    .slider-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
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
        min-width: 2rem;
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
    .criteria-btn {
        padding: 0.75rem 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        color: #667eea;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .criteria-btn:hover {
        background: rgba(255, 255, 255, 0.95);
        transform: translateY(-1px);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }
    @media (max-width: 768px) {
        .evaluation-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .evaluation-section {
            padding: 1rem;
        }

        .student-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1rem;
        }

        .avatar {
            width: 60px;
            height: 60px;
        }

        .student-info p {
            font-size: 1rem;
        }

        .input-wrapper {
            flex-direction: row;
            gap: 0.2rem;
            align-items: center;
        }

        .slider-container {
            flex: 1;
            padding: 0.2rem;
            gap: 0.5rem;
        }

        .slider {
            height: 4px;
        }

        .criteria-btn {
            padding: 0.5rem 0.5rem;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .criteria-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }

        .range {
            font-size: 0.8rem;
        }

        .submit-btn-container {
            justify-content: center;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .falta-section-btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
            align-self: flex-end;
        }
    }

    .dialog-content {
        padding: 1rem 0;
    }
    .criteria-subtitle {
        color: #667eea;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
    }
    .criteria-description {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        margin-top: 1rem;
    }
    .criteria-description p {
        margin: 0;
        color: #495057;
        line-height: 1.6;
    }
    .inactive-section {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(0.5);
    }
    .submit-btn-container {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .section-header h2 {
        margin: 0;
    }

    .falta-section-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);
        position: relative;
        overflow: hidden;
    }

    .falta-section-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .falta-section-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
    }

    .falta-section-btn:active:not(:disabled) {
        transform: translateY(-1px);
    }

    .loading-dialog-content {
        padding: 1rem 0;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
        min-height: 200px;
        justify-content: center;
    }

    .loading-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: #495057;
        margin: 0;
    }

    .loading-subtitle {
        font-size: 0.9rem;
        color: #6c757d;
        margin: 0;
        max-width: 300px;
        line-height: 1.4;
    }
</style>
