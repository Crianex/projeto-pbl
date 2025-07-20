<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type {
        AlunoModel,
        ProblemaModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import type { Column } from "$lib/interfaces/column";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";
    import BackButton from "$lib/components/BackButton.svelte";

    interface AlunoComMedia extends AlunoModel {
        mediaNotas: {
            competencia: number;
            habilidade: number;
            atitude: number;
        } | null;
    }

    let problema: ProblemaModel | null = null;
    let turma: TurmaModel | null = null;
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let alunos: AlunoComMedia[] = [];

    // Table configuration
    let columns: Column[] = [
        {
            key: "aluno",
            label: "Aluno",
            width: "50%",
        },
        {
            key: "media",
            label: "Média (C/H/A)",
            width: "30%",
        },
        {
            key: "actions",
            label: "Ações",
            width: "20%",
            render: (row: any) => ({
                component: "button",
                props: {
                    variant: "secondary",
                    text: "Ver Detalhes",
                    onClick: () => verDetalhes(row.id.toString()),
                },
            }),
        },
    ];

    let tableRows: any[] = [];

    onMount(async () => {
        try {
            const { id_problema, id } = $page.params;
            logger.info(
                `Loading problema details for id_problema: ${id_problema}, turma: ${id}`,
            );

            // Get both problema and turma data
            logger.info("Fetching problema, turma, and avaliações data...");
            const [problemaData, turmaData, avaliacoesData] = await Promise.all(
                [
                    api.get(`/problemas/get?id_problema=${id_problema}`),
                    api.get(`/turmas/get?id_turma=${id}`),
                    api.get(`/avaliacoes/list?id_problema=${id_problema}`),
                ],
            );

            logger.info("Data fetched successfully", {
                problemaData: !!problemaData,
                turmaData: !!turmaData,
                avaliacoesCount: avaliacoesData?.length || 0,
            });

            problema = Parsers.parseProblema(problemaData);
            turma = Parsers.parseTurma(turmaData);

            logger.info("Data parsed successfully", {
                problema: problema?.nome_problema,
                turma: turma?.nome_turma,
                alunosCount: turma?.alunos?.length || 0,
            });

            if (!turma?.alunos) {
                throw new Error("Não há alunos nesta turma");
            }

            // Process all avaliações to calculate media for each aluno
            logger.info(
                `Processing ${turma.alunos.length} alunos with ${avaliacoesData?.length || 0} avaliações`,
            );
            alunos = turma.alunos.map((aluno) => {
                const mediaNotas = calcularMediaFromAvaliacoes(
                    avaliacoesData,
                    aluno.id,
                );
                logger.debug(
                    `Calculated media for aluno ${aluno.nome_completo} (ID: ${aluno.id}):`,
                    mediaNotas,
                );
                return {
                    ...aluno,
                    mediaNotas,
                };
            });

            logger.info(`Successfully processed ${alunos.length} alunos`);
        } catch (e: any) {
            logger.error("Error loading problema details:", e);
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
            logger.info("Loading completed");
        }
    });

    function calcularMediaFromAvaliacoes(avaliacoes: any[], alunoId: number) {
        logger.debug(
            `Calculating media for aluno ID: ${alunoId} from ${avaliacoes?.length || 0} avaliações`,
        );

        // Filter avaliações where this aluno was evaluated (received evaluations)
        const avaliacoesRecebidas = avaliacoes.filter(
            (av) => av.id_aluno_avaliado === alunoId,
        );

        logger.debug(
            `Found ${avaliacoesRecebidas.length} avaliações recebidas for aluno ${alunoId}`,
        );

        if (!avaliacoesRecebidas.length) {
            logger.debug(
                `No avaliações found for aluno ${alunoId}, returning null`,
            );
            return null;
        }

        const soma = avaliacoesRecebidas.reduce(
            (acc, av) => {
                try {
                    const notas = JSON.parse(av.notas);
                    logger.debug(`Parsed notas for avaliação:`, notas);

                    // Handle nested structure with categories
                    let competencia = 0;
                    let habilidade = 0;
                    let atitude = 0;
                    let count = 0;

                    // Iterate through all categories in the notas
                    Object.values(notas).forEach((categoria: any) => {
                        if (
                            typeof categoria === "object" &&
                            categoria !== null
                        ) {
                            // Sum up the values from each category
                            competencia += categoria.conhecimento || 0;
                            habilidade += categoria.habilidades || 0;
                            atitude += categoria.atitudes || 0;
                            count++;
                        }
                    });

                    // If we found valid categories, use the averages
                    if (count > 0) {
                        competencia = competencia / count;
                        habilidade = habilidade / count;
                        atitude = atitude / count;
                    }

                    return {
                        competencia: acc.competencia + competencia,
                        habilidade: acc.habilidade + habilidade,
                        atitude: acc.atitude + atitude,
                    };
                } catch (error) {
                    logger.warn(
                        `Failed to parse notas for avaliação:`,
                        av.notas,
                        error,
                    );
                    return acc;
                }
            },
            { competencia: 0, habilidade: 0, atitude: 0 },
        );

        const media = {
            competencia: Number(
                (soma.competencia / avaliacoesRecebidas.length).toFixed(2),
            ),
            habilidade: Number(
                (soma.habilidade / avaliacoesRecebidas.length).toFixed(2),
            ),
            atitude: Number(
                (soma.atitude / avaliacoesRecebidas.length).toFixed(2),
            ),
        };

        logger.debug(`Calculated media for aluno ${alunoId}:`, media);
        return media;
    }

    function formatMedia(media: AlunoComMedia["mediaNotas"]) {
        if (!media) return "Não avaliado";
        return `(${media.competencia}, ${media.habilidade}, ${media.atitude})`;
    }

    function verDetalhes(id_aluno: string) {
        logger.info(`Navigating to aluno details: ${id_aluno}`);
        goto(`${$page.url.pathname}/${id_aluno}`);
    }

    function handleBack() {
        goto(`/professor/turmas/${$page.params.id}/problemas`);
    }

    $: totalPages = Math.ceil(alunos.length / itemsPerPage);
    $: paginatedAlunos = alunos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Transform data for Table component
    $: tableRows = paginatedAlunos.map((aluno) => {
        const hasNotas = !!aluno.mediaNotas;

        return {
            id: aluno.id,
            aluno: aluno.nome_completo || "Nome não disponível",
            media: formatMedia(aluno.mediaNotas),
            mediaClass: !hasNotas ? "nao-avaliado" : "",
            // For actions column - handled by render function
            actions: "",
        };
    });
</script>

<Container>
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner" />
        </div>
    {:else if error}
        <div class="error-alert" role="alert">
            <strong>Erro!</strong>
            <span>{error}</span>
        </div>
    {:else}
        <div class="content-wrapper">
            <div class="back-section">
                <BackButton
                    text="Voltar para problemas"
                    on:click={handleBack}
                />
            </div>
            <div class="header">
                <h1>Alunos - {problema?.nome_problema || ""}</h1>
            </div>

            <div class="alunos-section">
                <div class="table-wrapper">
                    <Table {columns} rows={tableRows} enableSelection={false} />
                </div>

                <div class="pagination">
                    <button
                        class="page-nav"
                        disabled={currentPage === 1}
                        on:click={() => currentPage--}
                    >
                        &lt;
                    </button>
                    <span class="page-number active">{currentPage}</span>
                    {#if currentPage < totalPages}
                        <span class="page-number">{currentPage + 1}</span>
                    {/if}
                    <button
                        class="page-nav"
                        disabled={currentPage === totalPages}
                        on:click={() => currentPage++}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    {/if}
</Container>

<style>
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .back-section {
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
    }

    .alunos-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .table-wrapper {
        margin-bottom: 1rem;
    }

    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .page-nav {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        background: white;
        cursor: pointer;
        border-radius: 4px;
    }

    .page-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-number {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        background: white;
        border-radius: 4px;
    }

    .page-number.active {
        background: #0d6efd;
        color: white;
        border-color: #0d6efd;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 16rem;
    }

    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-alert {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
    }

    .error-alert strong {
        font-weight: 700;
        margin-right: 0.5rem;
    }
</style>
