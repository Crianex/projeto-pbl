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
    import SearchBar from "$lib/components/SearchBar.svelte";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import Pagination from "$lib/components/Pagination.svelte";
    import { currentUser } from "$lib/utils/auth";
    import { MediaCalculator } from "$lib/utils/utils";

    let problema: ProblemaModel | null = null;
    let turma: TurmaModel | null = null;
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let searchTerm = "";
    let alunos: Array<AlunoModel & { medias: Record<string, number> | null }> =
        [];
    let criteriosList: { nome_criterio: string; descricao_criterio: string }[] =
        [];
    let avaliacoesData: any[] = [];

    // Table configuration
    let columns: Column[] = [
        {
            key: "aluno",
            label: "Aluno",
            width: "40%",
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

    $: if (problema && problema.criterios) {
        // Flatten all criterios from all groups and deduplicate by nome_criterio
        const criteriosMap = new Map<string, string>();
        Object.values(problema.criterios).forEach((criteriosArr) => {
            criteriosArr.forEach((criterio) => {
                if (!criteriosMap.has(criterio.nome_criterio)) {
                    criteriosMap.set(
                        criterio.nome_criterio,
                        criterio.descricao_criterio,
                    );
                }
            });
        });
        criteriosList = Array.from(criteriosMap.entries()).map(
            ([nome_criterio, descricao_criterio]) => ({
                nome_criterio,
                descricao_criterio,
            }),
        );
    }

    // Table configuration
    $: columns =
        criteriosList.length > 0
            ? [
                  {
                      key: "aluno",
                      label: "Aluno",
                      width: "20%",
                  },
                  ...criteriosList.map((criterio) => ({
                      key: criterio.nome_criterio.toLowerCase(),
                      label: criterio.nome_criterio.charAt(0),
                      tooltip: `${criterio.nome_criterio}\n\n${criterio.descricao_criterio}`,
                      width: `${criteriosList.length > 0 ? 30 / criteriosList.length : 30}%`,
                  })),
                  {
                      key: "media",
                      label: "Média",
                      width: "10%",
                  },
                  {
                      key: "avaliar",
                      label: "Já avaliou?",
                      width: "15%",
                      render: (row: any) => ({
                          component: "span",
                          props: {
                              text: row.hasEvaluation ? "✓" : "-",
                              style: row.hasEvaluation
                                  ? "color: #22c55e; font-size: 1.2rem; font-weight: bold;"
                                  : "color: #6b7280;",
                          },
                      }),
                  },
                  {
                      key: "actions",
                      label: "",
                      width: "15%",
                      render: (row: any) => ({
                          component: "button",
                          props: {
                              variant: "secondary",
                              text: "Ver Detalhes",
                              onClick: () => verDetalhes(row.id.toString()),
                          },
                      }),
                  },
              ]
            : [
                  {
                      key: "aluno",
                      label: "Aluno",
                      width: "60%",
                  },
                  {
                      key: "loading",
                      label: "Carregando critérios...",
                      width: "40%",
                  },
              ];

    onMount(async () => {
        try {
            const { id_problema, id } = $page.params;
            logger.info(
                `Loading problema details for id_problema: ${id_problema}, turma: ${id}`,
            );
            // Get both problema and turma data using cache services
            logger.info("Fetching problema, turma, and avaliações data...");
            const [problemaData, turmaData, fetchedAvaliacoesData] =
                await Promise.all([
                    ProblemasService.getById(id_problema),
                    TurmasService.getById(id),
                    AvaliacoesService.getByProblema(id_problema),
                ]);
            logger.info("Data fetched successfully", {
                problemaData: !!problemaData,
                turmaData: !!turmaData,
                avaliacoesCount: fetchedAvaliacoesData?.length || 0,
            });
            problema = problemaData;
            turma = turmaData;
            avaliacoesData = fetchedAvaliacoesData;
            logger.info("Data parsed successfully", {
                problema: problema?.nome_problema,
                turma: turma?.nome_turma,
                alunosCount: turma?.alunos?.length || 0,
            });
            if (!turma?.alunos) {
                throw new Error("Não há alunos nesta turma");
            }
            logger.info(
                `Successfully loaded data, waiting for criterios processing`,
            );
        } catch (e: any) {
            logger.error("Error loading problema details:", e);
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
            logger.info("Loading completed");
        }
    });

    // Process alunos - show all alunos even if there are no evaluations yet
    $: if (turma?.alunos && criteriosList.length > 0) {
        console.log(
            "🔍 DEBUG - Processing alunos with criteriosList:",
            criteriosList,
        );
        alunos = turma.alunos.map((aluno) => {
            const medias =
                avaliacoesData.length > 0
                    ? MediaCalculator.calcularMediaPorCriterio(
                          avaliacoesData,
                          aluno.id,
                          criteriosList,
                      )
                    : null; // Show alunos without evaluations
            return {
                ...aluno,
                medias,
            };
        });
        logger.info(
            `Successfully processed ${alunos.length} alunos with ${criteriosList.length} criterios`,
        );
    } else if (turma?.alunos && criteriosList.length === 0) {
        // Show alunos even when criterios haven't loaded yet
        alunos = turma.alunos.map((aluno) => ({
            ...aluno,
            medias: null,
        }));
    }

    function verDetalhes(id_aluno: string) {
        logger.info(`Navigating to aluno details: ${id_aluno}`);
        goto(`${$page.url.pathname}/${id_aluno}`);
    }

    function avaliarAluno(id_aluno: number) {
        const id_problema = $page.params.id_problema;
        logger.info(`Navigating to evaluate aluno: ${id_aluno}`);
        // Navigate to the unified evaluation page for professor evaluation
        goto(
            `/avaliacao?id_problema=${id_problema}&id_aluno_avaliado=${id_aluno}&id_professor=${$currentUser?.id}`,
        );
    }

    function handleBack() {
        goto(`/professor/turmas/${$page.params.id}/problemas`);
    }

    function handleSearch(event: CustomEvent<string>) {
        searchTerm = event.detail;
        currentPage = 1; // Reset to first page when searching
    }

    // Filter alunos based on search term
    $: filteredAlunos = searchTerm
        ? alunos.filter((aluno) =>
              aluno.nome_completo
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()),
          )
        : alunos;

    $: totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
    $: paginatedAlunos = filteredAlunos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Transform data for Table component
    $: tableRows = paginatedAlunos.map((aluno) => {
        // Check if this professor has already evaluated this student
        const professorEvaluation = avaliacoesData.find(
            (av) =>
                av.id_aluno_avaliado === aluno.id &&
                av.id_professor === $currentUser?.id,
        );

        const row: any = {
            id: aluno.id,
            aluno: aluno.nome_completo || "Nome não disponível",
            hasEvaluation: !!professorEvaluation,
            avaliar: "",
            actions: "",
        };

        // Add individual criteria scores
        criteriosList.forEach((criterio) => {
            const key = criterio.nome_criterio.toLowerCase();
            row[key] =
                aluno.medias && key in aluno.medias
                    ? aluno.medias[key]
                    : "Não avaliado";
        });

        // Calculate overall media from individual criteria
        row.media = aluno.medias
            ? MediaCalculator.calculateOverallMedia(aluno.medias)
            : "Não avaliado";

        return row;
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
                <div class="search-section">
                    <SearchBar
                        bind:value={searchTerm}
                        placeholder="Pesquisar alunos..."
                        showButton={false}
                        on:search={handleSearch}
                    />
                </div>

                <div class="table-wrapper">
                    <Table {columns} rows={tableRows} enableSelection={false} />
                </div>

                <Pagination
                    {currentPage}
                    {totalPages}
                    on:pageChange={(e) => (currentPage = e.detail.page)}
                />
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

    .search-section {
        margin-bottom: 1.5rem;
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
