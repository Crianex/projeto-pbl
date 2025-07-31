<script lang="ts">
    import { page } from "$app/stores";
    import { fade } from "svelte/transition";
    import { api } from "$lib/utils/api";
    import { onMount } from "svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import Container from "$lib/components/Container.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import type {
        CriteriosGroup,
        ProblemaModel,
        AvaliacaoNota,
        UploadedFile,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import { logger } from "$lib/utils/logger";
    import { MediaCalculator } from "$lib/utils/utils";
    import { currentUser } from "$lib/utils/auth";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { DateUtils } from "$lib/utils/utils";
    import Button from "$lib/components/Button.svelte";
    import { toastStore } from "$lib/utils/toast";

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
    let criterioAtual: { tag: string; criterio: any } | null = null;
    let showDialog = false;
    let currentValues: { [tag: string]: { [criterio: string]: number } } = {};
    let isSubmitting = false;

    let faltaLoading = false;

    // File evaluation state for professors
    let uploadedFilesByType: Map<string, UploadedFile[]> = new Map();
    let loadingFiles = false;
    let filesError: string | null = null;
    let fileGrades: { [fileId: string]: number } = {};

    // Helper function to check if a student has a falta for a specific tag
    function hasFalta(tag: string): boolean {
        console.log(`hasFalta called for tag: ${tag}`, {
            problema: !!problema,
            id_aluno_avaliado,
            faltas_por_tag: problema?.faltas_por_tag,
        });

        if (!problema || !id_aluno_avaliado) {
            console.log(`hasFalta returning false - missing data:`, {
                problema: !!problema,
                id_aluno_avaliado,
            });
            return false;
        }

        // Clean up any empty keys in faltas_por_tag
        if (
            problema.faltas_por_tag &&
            Object.keys(problema.faltas_por_tag).includes("")
        ) {
            console.warn("Found empty key in faltas_por_tag, cleaning up");
            const cleanedFaltasPorTag = { ...problema.faltas_por_tag };
            delete cleanedFaltasPorTag[""];
            problema.faltas_por_tag = cleanedFaltasPorTag;
        }

        const hasFaltaResult =
            problema.faltas_por_tag?.[tag]?.[parseInt(id_aluno_avaliado!)] ||
            false;
        console.log(
            `hasFalta(${tag}) result:`,
            hasFaltaResult,
            `faltas_por_tag[${tag}]:`,
            problema.faltas_por_tag?.[tag],
            `student ID:`,
            parseInt(id_aluno_avaliado!),
        );
        return hasFaltaResult;
    }

    // Helper function to check if student has any faltas
    function hasAnyFalta(): boolean {
        console.log(`hasAnyFalta called`, {
            problema: !!problema,
            id_aluno_avaliado,
            faltas_por_tag: problema?.faltas_por_tag,
        });

        if (!problema || !id_aluno_avaliado) {
            console.log(`hasAnyFalta returning false - missing data:`, {
                problema: !!problema,
                id_aluno_avaliado,
            });
            return false;
        }

        // Check if student has falta in any tag
        const result = Object.keys(problema.faltas_por_tag || {}).some(
            (tag) =>
                problema.faltas_por_tag[tag]?.[parseInt(id_aluno_avaliado!)] ===
                true,
        );

        console.log(`hasAnyFalta result:`, result, {
            allTags: Object.keys(problema.faltas_por_tag || {}),
            studentId: parseInt(id_aluno_avaliado!),
            faltasData: problema.faltas_por_tag,
        });

        return result;
    }

    // Helper function to get all tags where student has falta
    function getFaltaTags(): string[] {
        console.log(`getFaltaTags called`, {
            problema: !!problema,
            id_aluno_avaliado,
            faltas_por_tag: problema?.faltas_por_tag,
        });

        if (!problema || !id_aluno_avaliado) {
            console.log(`getFaltaTags returning empty array - missing data:`, {
                problema: !!problema,
                id_aluno_avaliado,
            });
            return [];
        }

        const result = Object.keys(problema.faltas_por_tag || {}).filter(
            (tag) =>
                problema.faltas_por_tag[tag]?.[parseInt(id_aluno_avaliado!)] ===
                true,
        );

        console.log(`getFaltaTags result:`, result, {
            allTags: Object.keys(problema.faltas_por_tag || {}),
            studentId: parseInt(id_aluno_avaliado!),
            faltasData: problema.faltas_por_tag,
        });

        return result;
    }

    // Reactive statement to track falta status for UI updates
    $: faltaStatus =
        problema && problema.faltas_por_tag
            ? {
                  "Análise do Problema": hasFalta("Análise do Problema"),
                  "Resolução do Problema": hasFalta("Resolução do Problema"),
              }
            : {};

    // Log when faltaStatus changes
    $: console.log(`faltaStatus updated:`, faltaStatus, {
        problema: !!problema,
        faltas_por_tag: problema?.faltas_por_tag,
        hasAnyFaltaResult: hasAnyFalta(),
        getFaltaTagsResult: getFaltaTags(),
    });

    // Helper function to toggle falta status
    async function toggleFalta(tag: string) {
        console.log("toggleFalta called for tag:", tag, {
            problema: !!problema,
            id_aluno_avaliado,
            faltaLoading,
        });

        try {
            faltaLoading = true;
            if (!problema || !id_aluno_avaliado) {
                console.log("toggleFalta early return - missing data");
                return;
            }

            // Validate tag is not empty
            if (!tag || tag.trim() === "") {
                throw new Error("Tag inválida");
            }

            const currentFaltaStatus = hasFalta(tag);
            const newFaltaStatus = !currentFaltaStatus;

            console.log("Toggle falta:", {
                tag,
                currentFaltaStatus,
                newFaltaStatus,
                alunoId: id_aluno_avaliado,
                currentFaltasPorTag: problema.faltas_por_tag,
            });

            // Update the backend first
            const updatedFaltasPorTag = {
                ...problema.faltas_por_tag,
                [tag]: {
                    ...problema.faltas_por_tag?.[tag],
                    [parseInt(id_aluno_avaliado)]: newFaltaStatus,
                },
            };

            console.log("Updated faltas_por_tag:", updatedFaltasPorTag);

            const faltasPorTagString = JSON.stringify(updatedFaltasPorTag);

            // Call the backend to update the problema
            await ProblemasService.update(id_problema, {
                nome_problema: problema.nome_problema || "",
                id_turma: problema.id_turma || 0,
                criterios: JSON.stringify(problema.criterios),
                definicao_arquivos_de_avaliacao: JSON.stringify(
                    problema.definicao_arquivos_de_avaliacao,
                ),
                data_e_hora_criterios_e_arquivos: JSON.stringify(
                    problema.data_e_hora_criterios_e_arquivos,
                ),
                faltas_por_tag: faltasPorTagString,
            });

            // Update the local state after successful backend update
            problema = {
                ...problema,
                faltas_por_tag: updatedFaltasPorTag,
            };

            // Force reactivity by creating a new object reference
            problema = { ...problema };

            console.log("Updated problema state:", problema.faltas_por_tag);
            console.log(
                "New falta status for tag:",
                tag,
                "should be:",
                newFaltaStatus,
            );
            console.log("hasFalta result after update:", hasFalta(tag));

            toastStore.success(
                newFaltaStatus
                    ? `Falta registrada na ${tag}!`
                    : `Falta removida da ${tag}.`,
            );
        } catch (e: any) {
            logger.error(e);
            const errorMessage = e.message || `Erro ao registrar/remover falta`;
            error = errorMessage;
            toastStore.error(errorMessage);
        } finally {
            faltaLoading = false;
        }
    }

    // Helper to check if a tag is currently active (for alunos only)
    function isTagActive(tag: string): boolean {
        if (isProfessorEvaluation) return true;
        if (!problema) return false;
        return DateUtils.isNowWithinTagDateRange(problema, tag);
    }

    // Helper to check if inputs should be disabled for a specific tag
    function isInputDisabled(tag: string): boolean {
        // For professors, inputs are never disabled due to faltas
        if (isProfessorEvaluation) return false;

        // For students, inputs are disabled if:
        // 1. The tag is not active (date has passed)
        // 2. The student has missed this specific tag
        if (!isTagActive(tag)) return true;
        if (hasFalta(tag)) return true;

        return false;
    }

    // Helper to check if all tags are disabled for the student
    function areAllTagsDisabled(): boolean {
        if (isProfessorEvaluation) return false;
        if (!problema || !criterios) return false;

        // Check if all tags are either inactive or have faltas
        return Object.keys(criterios).every((tag) => isInputDisabled(tag));
    }

    // Load student files for professor evaluation
    async function loadStudentFiles() {
        if (!isProfessorEvaluation || !id_aluno_avaliado || !id_problema) {
            return;
        }

        try {
            loadingFiles = true;
            filesError = null;

            const files: UploadedFile[] = await api.get(
                `/problemas/get-arquivos?id_aluno=${id_aluno_avaliado}&id_problema=${id_problema}`,
            );

            // Parse the files using the parser
            const parsedFiles = Parsers.parseUploadedFiles(files);

            // Group files by nome_tipo
            uploadedFilesByType.clear();
            parsedFiles.forEach((file) => {
                const nomeType = file.nome_tipo || "default";
                const currentFiles = uploadedFilesByType.get(nomeType) || [];
                uploadedFilesByType.set(nomeType, [...currentFiles, file]);
            });
            uploadedFilesByType = uploadedFilesByType; // Trigger reactivity

            logger.info(
                `Loaded ${parsedFiles.length} files for student ${id_aluno_avaliado}`,
            );
        } catch (e: any) {
            logger.error("Error loading student files:", e);
            filesError = e.message || "Erro ao carregar arquivos do aluno";
        } finally {
            loadingFiles = false;
        }
    }

    // Handle file grade changes
    function handleFileGradeChange(nomeTipo: string, event: Event) {
        const input = event.target as HTMLInputElement;
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            fileGrades = {
                ...fileGrades,
                [nomeTipo]: value,
            };
        }
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

    // Reactive statement to trigger UI updates when problema changes
    $: if (problema) {
        console.log(
            "Problema updated, faltas_por_tag:",
            problema.faltas_por_tag,
        );
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
        if (!isNaN(value)) {
            // Create a new object to ensure reactivity
            currentValues = {
                ...currentValues,
                [tag]: {
                    ...currentValues[tag],
                    [criterioKey]: value,
                },
            };
            avaliacaoData.notas = { ...currentValues };
        }
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Validate required parameters
            if (!id_problema || !id_aluno_avaliado) {
                error = "Parâmetros obrigatórios não fornecidos.";
                toastStore.error(error || "Erro ao carregar avaliação");
                return;
            }

            // Clean up corrupted faltas_por_tag data if needed
            async function cleanupFaltasPorTag() {
                console.log("cleanupFaltasPorTag called", {
                    problema: !!problema,
                    faltas_por_tag: problema?.faltas_por_tag,
                });

                if (problema?.faltas_por_tag) {
                    const hasEmptyKey = Object.keys(
                        problema.faltas_por_tag,
                    ).includes("");
                    console.log("Checking for empty keys:", {
                        hasEmptyKey,
                        allKeys: Object.keys(problema.faltas_por_tag),
                    });

                    if (hasEmptyKey) {
                        console.warn(
                            "Cleaning up corrupted faltas_por_tag data",
                        );
                        const cleanedFaltasPorTag = {
                            ...problema.faltas_por_tag,
                        };
                        delete cleanedFaltasPorTag[""];

                        // Update the backend with cleaned data
                        await ProblemasService.update(id_problema, {
                            nome_problema: problema.nome_problema || "",
                            id_turma: problema.id_turma || 0,
                            criterios: JSON.stringify(problema.criterios),
                            definicao_arquivos_de_avaliacao: JSON.stringify(
                                problema.definicao_arquivos_de_avaliacao,
                            ),
                            data_e_hora_criterios_e_arquivos: JSON.stringify(
                                problema.data_e_hora_criterios_e_arquivos,
                            ),
                            faltas_por_tag: JSON.stringify(cleanedFaltasPorTag),
                        });

                        // Update local state
                        problema = {
                            ...problema,
                            faltas_por_tag: cleanedFaltasPorTag,
                        };

                        // Force reactivity by creating a new object reference
                        problema = { ...problema };

                        console.log(
                            "Cleaned faltas_por_tag:",
                            cleanedFaltasPorTag,
                        );
                    } else {
                        console.log("No cleanup needed - no empty keys found");
                    }
                } else {
                    console.log("No faltas_por_tag to clean up");
                }
            }

            if (!isProfessorEvaluation && !id_aluno_avaliador) {
                error =
                    "ID do aluno avaliador é obrigatório para avaliações de alunos.";
                toastStore.error(error || "Erro ao carregar avaliação");
                return;
            }

            if (isProfessorEvaluation && !id_professor) {
                error =
                    "ID do professor é obrigatório para avaliações de professores.";
                toastStore.error(error || "Erro ao carregar avaliação");
                return;
            }

            // Get the problem details
            const problemaResponse = await api.get(
                `/problemas/get?id_problema=${id_problema}`,
            );
            problema = Parsers.parseProblema(problemaResponse);
            criterios = problema.criterios;

            console.log("Problema loaded:", {
                id_problema: problema.id_problema,
                nome_problema: problema.nome_problema,
                faltas_por_tag: problema.faltas_por_tag,
                raw_faltas_por_tag: problemaResponse.faltas_por_tag,
            });

            // Clean up corrupted faltas_por_tag data if needed
            await cleanupFaltasPorTag();

            console.log(
                "After cleanup - problema faltas_por_tag:",
                problema.faltas_por_tag,
            );

            // Get the student details (who is being evaluated)
            const aluno = await api.get(
                `/alunos/get?id_aluno=${id_aluno_avaliado}`,
            );

            // Load student files for professor evaluation
            if (isProfessorEvaluation) {
                await loadStudentFiles();
            }

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
                // For professor evaluations, filter by professor and student being evaluated
                avaliacoes = await api.get(
                    `/avaliacoes/list?id_problema=${id_problema}&id_professor=${id_professor}&id_aluno_avaliado=${id_aluno_avaliado}`,
                );
            } else {
                // For student evaluations, filter by student evaluator
                avaliacoes = await api.get(
                    `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${id_aluno_avaliador}`,
                );
            }

            // Ensure avaliacoes is always an array
            if (!Array.isArray(avaliacoes)) {
                avaliacoes = avaliacoes ? [avaliacoes] : [];
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
            toastStore.error(error || "Erro ao carregar dados");
            logger.error(e);
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
                    notas_por_arquivo: JSON.stringify(fileGrades),
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

            toastStore.success("Avaliação salva com sucesso!");
            history.back();
        } catch (e: any) {
            logger.error(e);
            error = e.message || "Erro ao salvar avaliação";
            toastStore.error(error || "Erro ao salvar avaliação");
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

    {#if loading}
        <div class="loading-container">
            <LoadingSpinner size="lg" />
            <p class="loading-text">Carregando dados da avaliação...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <div class="error-icon">❌</div>
            <div class="error-content">
                <h3>Erro ao carregar dados</h3>
                <p>{error}</p>
            </div>
        </div>
    {:else}
        <div class="header">
            <h1>
                Avaliação Individual {isProfessorEvaluation
                    ? "(Professor)"
                    : ""}
            </h1>
        </div>
        <div class="student-info">
            <div class="avatar">
                <img
                    src={avaliacaoData.aluno.avatar ||
                        "/images/default_avatar.png"}
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

        {#if !isProfessorEvaluation && problema && hasAnyFalta()}
            <div class="falta-warning">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <h3>Atenção!</h3>
                    <p>
                        {avaliacaoData.aluno.nome} possui faltas registradas nas
                        seguintes seções:
                        <strong>{getFaltaTags().join(", ")}</strong>
                    </p>
                    <p class="warning-note">
                        As seções com faltas estão desabilitadas para avaliação.
                        Apenas professores podem avaliar seções com faltas
                        registradas.
                    </p>
                </div>
            </div>
        {/if}
        <form on:submit|preventDefault={handleSubmit}>
            <div class="evaluation-grid">
                {#each Object.entries(criterios) as [tag, criteriosList]}
                    <div
                        class="evaluation-section {isInputDisabled(tag)
                            ? 'inactive-section'
                            : ''}"
                    >
                        <div class="section-header">
                            <h2>{tag}</h2>
                            {#if isProfessorEvaluation}
                                {#if tag === "Análise do Problema" || tag === "Resolução do Problema"}
                                    <Button
                                        type="button"
                                        variant={faltaStatus[tag]
                                            ? "warning"
                                            : "danger"}
                                        on:click={() => toggleFalta(tag)}
                                        title="{faltaStatus[tag]
                                            ? 'Remover'
                                            : 'Registrar'} falta na {tag}"
                                        disabled={!isTagActive(tag) ||
                                            faltaLoading}
                                        loading={faltaLoading}
                                    >
                                        {faltaStatus[tag]
                                            ? "Desfazer"
                                            : "Faltou"}
                                    </Button>
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
                                            >0,0 a {isProfessorEvaluation
                                                ? criterio.nota_maxima_professor
                                                : criterio.nota_maxima_aluno}</span
                                        >
                                    </span>
                                    <div class="input-wrapper">
                                        <div class="slider-container">
                                            <input
                                                type="range"
                                                step="0.1"
                                                min="0"
                                                max={isProfessorEvaluation
                                                    ? criterio.nota_maxima_professor
                                                    : criterio.nota_maxima_aluno}
                                                value={currentValues[tag]?.[
                                                    criterioKey
                                                ] || 0}
                                                on:input={(e) =>
                                                    handleValueChange(
                                                        tag,
                                                        criterioKey,
                                                        e,
                                                    )}
                                                on:change={(e) =>
                                                    handleValueChange(
                                                        tag,
                                                        criterioKey,
                                                        e,
                                                    )}
                                                class="slider"
                                                disabled={isInputDisabled(tag)}
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
                                            disabled={isInputDisabled(tag)}
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
        </form>

        <!-- File Evaluation Section for Professors -->
        {#if isProfessorEvaluation && problema?.definicao_arquivos_de_avaliacao && problema.definicao_arquivos_de_avaliacao.length > 0}
            <div
                class="file-evaluation-section"
                in:fade={{ duration: 400, delay: 450 }}
            >
                <h2>Avaliação de Arquivos Enviados</h2>
                <p class="file-evaluation-description">
                    Avalie os arquivos enviados pelo aluno para este problema:
                </p>

                {#if loadingFiles}
                    <div class="files-loading">
                        <LoadingSpinner size="sm" />
                        <p>Carregando arquivos do aluno...</p>
                    </div>
                {:else if filesError}
                    <div class="files-error">
                        <p>Erro ao carregar arquivos: {filesError}</p>
                    </div>
                {:else}
                    <div class="files-evaluation">
                        {#each problema.definicao_arquivos_de_avaliacao as definicao, index}
                            {@const filesForType =
                                uploadedFilesByType.get(
                                    definicao.nome_tipo || "",
                                ) || []}
                            {@const nomeTipo = definicao.nome_tipo || ""}
                            <div
                                class="file-type-section"
                                in:fade={{
                                    duration: 300,
                                    delay: 500 + index * 100,
                                }}
                            >
                                <h3>
                                    {definicao.nome_tipo ||
                                        `Tipo de Arquivo ${index + 1}`}
                                </h3>
                                <p class="file-type-description">
                                    {definicao.descricao_tipo ||
                                        "Arquivos enviados pelo aluno"}
                                </p>

                                {#if filesForType.length > 0}
                                    <div class="files-list">
                                        {#each filesForType as file}
                                            <div class="file-item">
                                                <div class="file-info">
                                                    <span class="file-name"
                                                        >{file.nome_arquivo}</span
                                                    >
                                                    {#if file.created_at}
                                                        <span class="file-date">
                                                            {new Date(
                                                                file.created_at,
                                                            ).toLocaleDateString(
                                                                "pt-BR",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </span>
                                                    {/if}
                                                </div>
                                                <div class="file-actions">
                                                    <a
                                                        href={file.link_arquivo}
                                                        target="_blank"
                                                        class="download-link"
                                                        title="Baixar arquivo"
                                                    >
                                                        Baixar
                                                    </a>
                                                    <div
                                                        class="file-grade-section"
                                                    >
                                                        <label
                                                            class="file-grade-label"
                                                        >
                                                            <span>Nota:</span>
                                                            <div
                                                                class="file-slider-container"
                                                            >
                                                                <input
                                                                    type="range"
                                                                    step="0.1"
                                                                    min="0"
                                                                    max={definicao.nota_maxima ||
                                                                        10}
                                                                    value={fileGrades[
                                                                        nomeTipo
                                                                    ] || 0}
                                                                    on:input={(
                                                                        e,
                                                                    ) =>
                                                                        handleFileGradeChange(
                                                                            nomeTipo,
                                                                            e,
                                                                        )}
                                                                    on:change={(
                                                                        e,
                                                                    ) =>
                                                                        handleFileGradeChange(
                                                                            nomeTipo,
                                                                            e,
                                                                        )}
                                                                    class="file-slider"
                                                                />
                                                                <div
                                                                    class="file-value-display"
                                                                >
                                                                    {(
                                                                        fileGrades[
                                                                            nomeTipo
                                                                        ] || 0
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="no-files">
                                        <p>
                                            Nenhum arquivo enviado para este
                                            tipo.
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Submit Button - moved outside form for professors -->
        {#if !loading && problema && avaliacaoData.aluno.nome}
            <div class="submit-btn-container">
                <Button
                    variant="primary"
                    disabled={isSubmitting ||
                        (!isProfessorEvaluation &&
                            problema &&
                            areAllTagsDisabled())}
                    loading={isSubmitting}
                    on:click={handleSubmit}
                >
                    Salvar Avaliação
                </Button>
            </div>
        {/if}
    {/if}
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
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
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
        /* Improve touch handling on mobile */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
    }
    .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
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

    .falta-warning {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.15);
    }

    .warning-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    .warning-content {
        flex: 1;
    }

    .warning-content h3 {
        color: #856404;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .warning-content p {
        color: #856404;
        margin: 0 0 0.5rem 0;
        line-height: 1.5;
    }

    .warning-content p:last-child {
        margin-bottom: 0;
    }

    .warning-note {
        font-size: 0.875rem;
        font-style: italic;
        opacity: 0.8;
    }

    @media (max-width: 768px) {
        .falta-warning {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
        }

        .warning-icon {
            align-self: center;
        }
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: 1rem;
    }

    .loading-text {
        color: #495057;
        font-size: 1.125rem;
        font-weight: 500;
        margin: 0;
    }

    .error-container {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.15);
    }

    .error-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    .error-content {
        flex: 1;
    }

    .error-content h3 {
        color: #721c24;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .error-content p {
        color: #721c24;
        margin: 0;
        line-height: 1.5;
    }

    @media (max-width: 768px) {
        .error-container {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
        }

        .error-icon {
            align-self: center;
        }
    }

    .file-evaluation-section {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04);
        margin-top: 2rem;
        margin-bottom: 2rem;
    }

    .file-evaluation-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 1rem 0;
    }

    .file-evaluation-description {
        font-size: 1rem;
        color: #495057;
        margin: 0 0 1.5rem 0;
    }

    .files-loading,
    .files-error {
        text-align: center;
        padding: 1rem;
        color: #495057;
        font-size: 0.9rem;
    }

    .files-evaluation {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .file-type-section {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .file-type-section h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
    }

    .file-type-description {
        font-size: 0.875rem;
        color: #6c757d;
        margin: 0 0 1rem 0;
    }

    .files-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(5px);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .file-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }

    .file-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .file-name {
        font-weight: 500;
        color: #343a40;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
    }

    .file-date {
        font-size: 0.75rem;
        color: #6c757d;
        margin-left: 0.5rem;
    }

    .download-link {
        padding: 0.5rem 1rem;
        background: #667eea;
        color: white;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        transition: background-color 0.2s ease;
        border: 1px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .download-link:hover {
        background: #5a67d8;
        border-color: #5a67d8;
    }

    .file-grade-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 1rem;
    }

    .file-grade-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: #495057;
        font-weight: 500;
    }

    .file-slider-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        padding: 0.25rem 0.75rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .file-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        outline: none;
        opacity: 0.7;
        transition: opacity 0.2s;
        /* Improve touch handling on mobile */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }

    .file-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
    }

    .file-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
    }

    .file-slider:hover {
        opacity: 1;
    }

    .file-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .file-slider::-moz-range-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .file-value-display {
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

    .no-files {
        text-align: center;
        padding: 1rem;
        color: #495057;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .file-evaluation-section {
            padding: 1rem;
        }

        .file-evaluation-section h2 {
            font-size: 1.125rem;
        }

        .file-evaluation-description {
            font-size: 0.9rem;
        }

        .file-type-section {
            padding: 0.75rem;
        }

        .file-type-section h3 {
            font-size: 1rem;
        }

        .file-type-description {
            font-size: 0.8rem;
        }

        .file-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.75rem 0.75rem;
        }

        .file-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
            width: 100%;
        }

        .file-name {
            max-width: 100%;
        }

        .file-actions {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .download-link {
            width: 100%;
            text-align: center;
        }

        .file-grade-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            width: 100%;
        }

        .file-slider-container {
            flex: 1;
            padding: 0.2rem;
            gap: 0.5rem;
        }

        .file-slider {
            height: 4px;
        }

        .file-grade-label {
            font-size: 0.8rem;
        }
    }
</style>
