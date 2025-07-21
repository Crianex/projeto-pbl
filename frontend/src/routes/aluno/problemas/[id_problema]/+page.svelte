<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { currentUser } from "$lib/utils/auth";
    import type { ProblemaModel } from "$lib/interfaces/interfaces";
    import type { Column } from "$lib/interfaces/column";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Table from "$lib/components/Table.svelte";
    import Container from "$lib/components/Container.svelte";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import Pagination from "$lib/components/Pagination.svelte";

    interface Avaliacao {
        id_avaliacao: number;
        aluno: {
            id: number;
            nome: string;
            avatar: string;
        };
        nota?: number;
        enviada: boolean;
        isCurrentUser?: boolean;
    }

    let avaliacoes: Avaliacao[] = [];
    let problema: ProblemaModel;
    let loading = true;
    let error: string | null = null;
    let tableRows: any[] = [];

    let currentPage = 1;
    const itemsPerPage = 10;
    $: totalPages = Math.ceil(avaliacoes.length / itemsPerPage);

    $: paginatedAvaliacoes = avaliacoes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Transform data for Table component
    $: tableRows = paginatedAvaliacoes.map((avaliacao) => {
        return {
            id: avaliacao.id_avaliacao,
            user: {
                name: avaliacao.aluno.nome,
                role: "", // No role for students in this context
                avatar: avaliacao.aluno.avatar,
            },
            enviada: avaliacao.enviada,
            nota: avaliacao.nota,
            isCurrentUser: avaliacao.isCurrentUser,
            alunoId: avaliacao.aluno.id,
            // For actions column - handled by render function
            actions: "",
        };
    });

    // Table configuration
    let columns: Column[] = [
        {
            key: "user",
            label: "Aluno",
            width: "60%",
        },
        {
            key: "actions",
            label: "Avaliação enviada",
            width: "40%",
            render: (row: any) => {
                if (row.enviada) {
                    return {
                        component: "span",
                        props: {
                            text: row.nota?.toFixed(2) || "0.00",
                            class: "grade",
                        },
                    };
                } else if (row.isCurrentUser) {
                    return {
                        component: "Button",
                        props: {
                            variant: "primary",
                            text: "Avaliar",
                            onClick: () => handleSelfEvaluation(),
                        },
                    };
                } else {
                    return {
                        component: "Button",
                        props: {
                            variant: "primary",
                            text: "Avaliar",
                            onClick: () => handleEvaluation(row.alunoId),
                        },
                    };
                }
            },
        },
    ];

    async function fetchAvaliacoes() {
        try {
            loading = true;
            error = null;
            const id_problema = parseInt($page.params.id_problema);

            // Get the problem details first using cache service
            problema = await ProblemasService.getById(id_problema.toString());

            // Get all evaluations using the service
            const avaliacoesData =
                await AvaliacoesService.getAvaliacoes(id_problema);

            // Filter evaluations where current user is the evaluator (aluno_avaliador)
            const currentUserId = $currentUser?.id;
            const filteredAvaliacoesData = avaliacoesData.filter(
                (avaliacao) => avaliacao.aluno_avaliador?.id === currentUserId,
            );

            // Transform the data to match our interface
            avaliacoes = filteredAvaliacoesData.map((avaliacao) => {
                const media = avaliacao.notas
                    ? Object.values(avaliacao.notas)
                          .map((criterios) =>
                              Object.values(criterios).reduce(
                                  (sum, nota) => sum + nota,
                                  0,
                              ),
                          )
                          .reduce((sum, tagSum) => sum + tagSum, 0) /
                      Object.keys(avaliacao.notas).length
                    : undefined;

                const isSelfEvaluation =
                    avaliacao.aluno_avaliado?.id === currentUserId;
                return {
                    id_avaliacao: avaliacao.id_avaliacao,
                    aluno: {
                        id: avaliacao.aluno_avaliado?.id || 0,
                        nome: isSelfEvaluation
                            ? `${avaliacao.aluno_avaliado?.nome_completo || ""} (auto avaliação)`
                            : avaliacao.aluno_avaliado?.nome_completo || "",
                        avatar: "/avatars/default.png",
                    },
                    nota: media,
                    enviada: true,
                    isCurrentUser: isSelfEvaluation,
                };
            });

            // Add students without evaluations (only for current user's evaluations)
            if (problema.turma?.alunos) {
                const avaliacoesMap = new Map(
                    avaliacoes.map((av) => [av.aluno.id, av]),
                );

                // Only add students that the current user hasn't evaluated yet
                // Include the current user so they can self-evaluate
                problema.turma.alunos.forEach((aluno) => {
                    if (!avaliacoesMap.has(aluno.id)) {
                        const isCurrentUser = aluno.id === currentUserId;
                        avaliacoes.push({
                            id_avaliacao: 0,
                            aluno: {
                                id: aluno.id,
                                nome: isCurrentUser
                                    ? `${aluno.nome_completo || ""} (auto avaliação)`
                                    : aluno.nome_completo || "",
                                avatar: "/avatars/default.png",
                            },
                            enviada: false,
                            isCurrentUser: isCurrentUser,
                        });
                    }
                });
            }
        } catch (e: any) {
            console.error("Error in fetchAvaliacoes:", e);
            error = e.message || "Erro ao carregar avaliações";
        } finally {
            loading = false;
        }
    }

    function handleSelfEvaluation() {
        const id_problema = $page.params.id_problema;
        // Navigate to unified evaluation page for self-evaluation
        goto(
            `/avaliacao?id_problema=${id_problema}&id_aluno_avaliador=${$currentUser?.id}&id_aluno_avaliado=${$currentUser?.id}`,
        );
    }

    function handleEvaluation(alunoId: number) {
        const id_problema = $page.params.id_problema;
        // Navigate to unified evaluation page for peer evaluation
        goto(
            `/avaliacao?id_problema=${id_problema}&id_aluno_avaliador=${$currentUser?.id}&id_aluno_avaliado=${alunoId}`,
        );
    }

    onMount(fetchAvaliacoes);
</script>

<Container class="responsive-container" maxWidth="xl" glass={true} shadow={true}>
    <div class="evaluations-container">
        {#if loading && !problema}
            <div class="loading-container">
                <LoadingSpinner size="lg" />
                <p>Carregando avaliações...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="error-message">{error}</p>
            </div>
        {:else}
            <div class="header" in:fade={{ duration: 300, delay: 50 }}>
                <h1 class="responsive-title">
                    Avaliações - {problema?.nome_problema || "Carregando..."}
                </h1>
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
            </div>

            <div class="table-wrapper" in:fade={{ duration: 400, delay: 200 }}>
                <Table
                    {columns}
                    rows={tableRows}
                    enableSelection={false}
                    {loading}
                />
            </div>

            {#if !loading && totalPages > 1}
                <div in:fade={{ duration: 300, delay: 350 }}>
                    <Pagination
                        {currentPage}
                        {totalPages}
                        on:pageChange={(e) => (currentPage = e.detail.page)}
                    />
                </div>
            {/if}
        {/if}
    </div>
</Container>

<style>
    /* Remover estilos de responsividade duplicados já cobertos pelo global */
    /* Manter apenas estilos específicos que não estão no global */
</style>
