<script lang="ts">
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { afterNavigate } from "$app/navigation";
    import Table from "$lib/design_system/components/Table.svelte";
    import Container from "$lib/design_system/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Button from "$lib/design_system/components/Button.svelte";
    import Toast from "$lib/design_system/components/Toast.svelte";
    import type { Column } from "$lib/interfaces/column";
    import { api } from "$lib/design_system/utils/api";
    import { DateUtils, Utils, MediaCalculator } from "$lib/utils/utils";
    import type {
        AlunoModel,
        ProblemaModel,
        AvaliacaoModel,
    } from "$lib/interfaces/interfaces";
    import { currentUser, initializeAuth } from "$lib/utils/auth";
    import { Parsers } from "$lib/interfaces/parsers";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { get } from "svelte/store";

    let problems: ProblemaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let showToast = false;
    let toastMessage: string = "";
    let toastType: "success" | "error" | "info" = "error";
    let isFetching = false; // Flag to prevent multiple simultaneous calls
    let isRefreshing = false; // Loading state for the "Atualizar" button when not in turma

    // Cache for shouldShowStudentAverage results
    const shouldShowCache = new Map<number, boolean>();

    // Function to calculate student's average for a specific problem
    async function calculateStudentAverage(
        problemaId: number,
        studentId: number,
    ): Promise<number | null> {
        try {
            // Use AvaliacoesService to get evaluations for this problem
            const avaliacoes = await AvaliacoesService.getByProblema(
                problemaId.toString(),
            );

            if (!avaliacoes || !Array.isArray(avaliacoes)) {
                return null;
            }

            // Filter evaluations where this student was evaluated (received evaluations)
            const receivedEvaluations = avaliacoes.filter(
                (av: AvaliacaoModel) =>
                    av.aluno_avaliado?.id === studentId &&
                    av.aluno_avaliador?.id !== studentId &&
                    !av.id_professor, // Exclude professor evaluations for now
            );

            if (receivedEvaluations.length === 0) {
                return null;
            }

            // Calculate average of all received evaluations
            let totalSum = 0;
            let validEvaluations = 0;

            receivedEvaluations.forEach((evaluation: AvaliacaoModel) => {
                const sum =
                    MediaCalculator.calculateRawSumFromAvaliacao(evaluation);
                if (sum > 0) {
                    totalSum += sum;
                    validEvaluations++;
                }
            });

            const average =
                validEvaluations > 0
                    ? Number((totalSum / validEvaluations).toFixed(2))
                    : null;
            return average;
        } catch (error) {
            console.error("Error calculating student average:", error);
            return null;
        }
    }

    // Function to check if student's average should be shown
    function shouldShowStudentAverage(problema: ProblemaModel): boolean {
        // Check cache first
        if (shouldShowCache.has(problema.id_problema)) {
            return shouldShowCache.get(problema.id_problema)!;
        }

        const now = new Date();
        const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds

        // Get all time ranges from the problem
        const timeRanges = Object.values(
            problema.data_e_hora_criterios_e_arquivos,
        );

        if (timeRanges.length === 0) {
            shouldShowCache.set(problema.id_problema, false);
            return false; // No time ranges defined
        }

        // Check if any time range has ended more than 1 hour ago
        const hasEndedTimeRange = timeRanges.some((range) => {
            if (!range.data_e_hora_fim) return false;
            const endTime = new Date(range.data_e_hora_fim);
            const timeDiff = now.getTime() - endTime.getTime();
            return timeDiff >= oneHourInMs;
        });

        if (!hasEndedTimeRange) {
            shouldShowCache.set(problema.id_problema, false);
            return false; // No time range has ended more than 1 hour ago
        }

        // Check if any time range is still active
        const hasActiveTimeRange = timeRanges.some((range) => {
            if (!range.data_e_hora_inicio || !range.data_e_hora_fim)
                return false;
            const startTime = new Date(range.data_e_hora_inicio);
            const endTime = new Date(range.data_e_hora_fim);
            const isActive = now >= startTime && now <= endTime;
            return isActive;
        });

        const shouldShow = !hasActiveTimeRange;

        // Cache the result
        shouldShowCache.set(problema.id_problema, shouldShow);

        // Only show if no time range is currently active
        return shouldShow;
    }

    const columns: Column[] = [
        {
            key: "nome_problema",
            label: "Nome do Problema",
            sortable: true,
        },
        {
            key: "periodos",
            label: "Períodos",
            sortable: true,
            render: (row: ProblemaModel) => {
                const dateRanges =
                    DateUtils.getDateRangesFromProblemaModel(row);
                const html = dateRanges
                    .map(
                        ({ tag, range, isActive }: any) =>
                            `<span class="tag-status ${isActive ? "tag-green" : "tag-red"}">${tag}: ${range}</span>`,
                    )
                    .join(Utils.isMobile() ? "<br>" : "<br><br>");
                return { component: "html", props: { html } };
            },
        },
        {
            key: "minha_media",
            label: "Minha Média",
            sortable: true,
            render: (row: any) => {
                // Check if we should show the student's average
                if (!shouldShowStudentAverage(row)) {
                    return "Aguardando término da avaliação atual";
                }

                return row.minha_media !== null && row.minha_media !== undefined
                    ? row.minha_media.toFixed(2)
                    : "Não avaliado";
            },
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: ProblemaModel) => {
                return {
                    component: "a",
                    props: {
                        href: `/aluno/problemas/${row.id_problema}`,
                        class: "btn-action",
                        textContent: "Ver Problema",
                    },
                };
            },
        },
    ];

    async function fetchProblems() {
        // Prevent multiple simultaneous calls
        if (isFetching) {
            return;
        }

        try {
            isFetching = true;
            loading = true;
            error = null;

            // Clear cache for fresh calculations
            shouldShowCache.clear();

            const currentUserData = get(currentUser) as AlunoModel;

            // Skip user data refresh to avoid duplicate API calls
            // The user data should already be up to date from auth initialization
            if (!currentUserData?.id || !currentUserData?.id_turma) {
                loading = false;
                return;
            }

            // Fetch problems directly without refreshing user data
            problems = await api.get(
                "/problemas/list-by-turma?id_turma=" +
                    currentUserData.id_turma +
                    "&id_aluno=" +
                    currentUserData.id,
            );

            problems = Parsers.parseProblemas(problems);

            // Only calculate averages if there are problems and we should show them
            if (problems.length > 0) {
                // Calculate student averages for each problem more efficiently
                const problemsWithAverages = await Promise.all(
                    problems.map(async (problem) => {
                        // Always calculate average, let the render function decide what to show
                        const minhaMedia = await calculateStudentAverage(
                            problem.id_problema,
                            currentUserData.id,
                        );
                        return {
                            ...problem,
                            minha_media: minhaMedia,
                        };
                    }),
                );

                problems = problemsWithAverages;
            }

            // Sort problems alphabetically by name
            problems.sort((a, b) =>
                (a.nome_problema || "").localeCompare(
                    b.nome_problema || "",
                    "pt-BR",
                    {
                        sensitivity: "base",
                    },
                ),
            );

            if (problems.length === 0) {
                toastType = "info";
                toastMessage = "Nenhum problema foi encontrado no momento.";
                showToast = true;
            }
        } catch (e: any) {
            error = e.message || "Erro ao carregar problemas";
            toastType = "error";
            toastMessage = error || "Erro ao carregar problemas";
            showToast = true;
        } finally {
            loading = false;
            isFetching = false;
        }
    }

    // Refresh the logged-in user data (to get updated turma) then refetch problems
    async function refreshUserAndRefetch() {
        if (isRefreshing) return;
        try {
            isRefreshing = true;
            await initializeAuth();
            await fetchProblems();
        } finally {
            isRefreshing = false;
        }
    }

    // Fetch problems when the page loads
    onMount(() => {
        fetchProblems();
    });

    // Fetch problems whenever the user navigates to this page
    afterNavigate(() => {
        // Only fetch if we're on the problemas page
        if ($page.url.pathname === "/aluno/problemas") {
            fetchProblems();
        }
    });
</script>

<svelte:head>
    <title>Problemas - PBL</title>
    <meta name="description" content="Lista de problemas disponíveis" />
</svelte:head>

<div style="max-width:1280px;width:100%;margin:0 auto;">
    <div class="header" in:fade={{ duration: 300, delay: 50 }}>
        <h1>Meus Problemas</h1>
        <p class="subtitle">Explore e resolva os problemas disponíveis</p>
    </div>

    <div class="content" in:fade={{ duration: 400, delay: 200 }}>
        {#if loading}
            <div class="loading-section">
                <LoadingSpinner
                    message="Carregando problemas..."
                    size="lg"
                    color="primary"
                />
            </div>
        {:else if !loading && !($currentUser as AlunoModel)?.id_turma}
            <div class="empty-section">
                <div class="empty-content">
                    <div class="empty-icon">🎓</div>
                    <h3>Você ainda não está em uma turma</h3>
                    <p>
                        Para visualizar problemas, você precisa estar
                        matriculado em uma turma. Entre em contato com seu
                        professor para ser adicionado.
                    </p>
                    <Button
                        variant="secondary"
                        on:click={refreshUserAndRefetch}
                        loading={isRefreshing}
                        disabled={isRefreshing || isFetching}
                    >
                        Atualizar
                    </Button>
                </div>
            </div>
        {:else if !loading && error}
            <div class="error-section">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h3>Ops! Algo deu errado</h3>
                    <p>Não foi possível carregar os problemas.</p>
                    <Button
                        variant="primary"
                        on:click={fetchProblems}
                        {loading}
                    >
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        {:else if !loading && problems.length === 0}
            <div class="empty-section">
                <div class="empty-content">
                    <div class="empty-icon">📚</div>
                    <h3>Nenhum problema disponível</h3>
                    <p>
                        Não há problemas cadastrados no momento. Volte mais
                        tarde ou entre em contato com seu professor.
                    </p>
                    <Button variant="secondary" on:click={fetchProblems}>
                        Atualizar
                    </Button>
                </div>
            </div>
        {:else}
            <Table rows={problems} {columns} {loading} />
        {/if}
    </div>
</div>

{#if showToast}
    <Toast
        type={toastType}
        title={toastType === "error" ? "Erro!" : "Informação"}
        message={toastMessage}
        on:dismiss={() => (showToast = false)}
    />
{/if}

<style>
    :global(body) {
        background: var(--color-bg-gradient);
        min-height: 100dvh;
    }

    .page-wrapper {
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem 0.5rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.3rem;
        }

        .subtitle {
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .page-wrapper {
            padding: 0.5rem 0.25rem;
        }

        .header {
            margin-bottom: 1rem;
        }

        .header h1 {
            font-size: 1.1rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }
    }

    .header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .header h1 {
        color: var(--color-text-primary);
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.025em;
    }

    .subtitle {
        color: var(--color-text-secondary);
        font-size: 1.1rem;
        margin: 0;
        opacity: 0.9;
    }

    .content {
        width: 100%;
        max-width: 100%;
    }

    /* Loading Section */
    .loading-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
    }

    /* Error Section */
    .error-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 1rem;
    }

    .error-content {
        text-align: center;
        max-width: 400px;
        width: 100%;
        padding: 2rem;
        background: var(--color-glass-white);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px var(--color-shadow-error);
        border: 1px solid var(--color-error-border);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .error-content h3 {
        color: var(--color-error-main);
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .error-content p {
        color: var(--color-text-muted);
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
    }

    /* Empty Section */
    .empty-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 1rem;
    }

    .empty-content {
        text-align: center;
        max-width: 400px;
        width: 100%;
        padding: 2rem;
        background: var(--color-glass-white);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px var(--color-shadow-light);
        border: 1px solid var(--color-glass-border);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .empty-content h3 {
        color: var(--color-text-primary);
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .empty-content p {
        color: var(--color-text-muted);
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
    }

    /* Table styling */
    :global(.content > table) {
        width: 100%;
        max-width: 100%;
    }

    /* Action Button Styling */
    :global(.btn-action) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        background: var(--color-primary-gradient);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        white-space: nowrap;
    }

    :global(.btn-action:hover) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        text-decoration: none;
    }

    :global(.btn-action:active) {
        transform: translateY(0);
    }

    /* Large screens optimization */
    @media (min-width: 1200px) {
        .page-wrapper {
            padding: 3rem;
        }

        .header h1 {
            font-size: 3rem;
        }

        .subtitle {
            font-size: 1.2rem;
        }

        .error-content,
        .empty-content {
            max-width: 500px;
            padding: 3rem;
        }
    }

    @media (min-width: 1600px) {
        .page-wrapper {
            padding: 4rem;
        }

        .header {
            margin-bottom: 3rem;
        }
    }

    /* Medium to large screens */
    @media (min-width: 1024px) and (max-width: 1199px) {
        .page-wrapper {
            padding: 2.5rem;
        }

        .header h1 {
            font-size: 2.75rem;
        }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem;
            padding-top: 5rem; /* Account for mobile menu */
        }

        .header h1 {
            font-size: 2rem;
        }

        .subtitle {
            font-size: 1rem;
        }

        .error-content,
        .empty-content {
            padding: 1.5rem;
            margin: 0;
        }

        .error-content h3,
        .empty-content h3 {
            font-size: 1.25rem;
        }
    }

    @media (max-width: 640px) {
        .page-wrapper {
            padding: 0.75rem;
            padding-top: 5rem;
        }

        .header h1 {
            font-size: 1.75rem;
        }

        .error-icon,
        .empty-icon {
            font-size: 2.5rem;
        }

        .error-content,
        .empty-content {
            padding: 1.25rem;
        }

        /* Improve table readability on mobile */
        :global(.content table) {
            font-size: 0.875rem;
        }

        :global(.btn-action) {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .page-wrapper {
            padding: 0.5rem;
            padding-top: 4.5rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.5rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }

        .error-content,
        .empty-content {
            padding: 1rem;
        }

        .error-icon,
        .empty-icon {
            font-size: 2rem;
        }

        .error-content h3,
        .empty-content h3 {
            font-size: 1.125rem;
        }

        .error-content p,
        .empty-content p {
            font-size: 0.875rem;
        }
    }

    @media (max-width: 360px) {
        .page-wrapper {
            padding: 0.375rem;
            padding-top: 4rem;
        }

        .header h1 {
            font-size: 1.25rem;
        }

        .subtitle {
            font-size: 0.8rem;
        }

        .error-content,
        .empty-content {
            padding: 0.75rem;
        }
    }
</style>
