<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/design_system/utils/api";
    import { logger } from "$lib/design_system/utils/logger";
    import type {
        AlunoModel,
        AvaliacaoModel,
        ProblemaModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/design_system/components/Button.svelte";
    import Container from "$lib/design_system/components/Container.svelte";
    import BackButton from "$lib/design_system/components/BackButton.svelte";
    import SearchBar from "$lib/design_system/components/SearchBar.svelte";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import Pagination from "$lib/design_system/components/Pagination.svelte";
    import { currentUser } from "$lib/utils/auth";
    import { MediaCalculator } from "$lib/utils/utils";
    import CardList from "$lib/components/CardList.svelte";
    import AlunoCard from "$lib/components/AlunoCard.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let problema: ProblemaModel | null = null;
    let turma: TurmaModel | null = null;
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let searchTerm = "";
    let windowWidth = 0;
    let sortBy = "nome_completo";
    let sortOrder = "asc";

    // Responsive items per page
    $: itemsPerPage = windowWidth <= 768 ? 5 : 10;
    let alunos: Array<
        AlunoModel & {
            finalMedia: {
                professor: number;
                auto: number;
                peers: number;
                total: number;
            } | null;
        }
    > = [];
    let criteriosList: { nome_criterio: string; descricao_criterio: string }[] =
        [];
    let avaliacoesData: AvaliacaoModel[] = [];
    let evaluationMatrix: {
        [evaluatorId: number]: { [evaluatedId: number]: number };
    } = {};

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

    onMount(() => {
        // Set initial window width
        windowWidth = window.innerWidth;

        // Add resize listener
        const handleResize = () => {
            windowWidth = window.innerWidth;
        };

        window.addEventListener("resize", handleResize);

        // Load data
        (async () => {
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
                // Build evaluation matrix (same as relatorios)
                if (turma && turma.alunos) {
                    evaluationMatrix = {};
                    turma.alunos.forEach((evaluator) => {
                        evaluationMatrix[evaluator.id] = {};
                        turma!.alunos!.forEach((evaluated) => {
                            evaluationMatrix[evaluator.id][evaluated.id] = 0;
                        });
                    });
                    avaliacoesData.forEach((avaliacao) => {
                        if (
                            avaliacao.aluno_avaliador &&
                            avaliacao.aluno_avaliado
                        ) {
                            const sum =
                                MediaCalculator.calculateRawSumFromAvaliacao(
                                    avaliacao,
                                );
                            console.log(`sum: ${sum}`);
                            if (
                                evaluationMatrix[
                                    avaliacao.aluno_avaliador.id
                                ] &&
                                evaluationMatrix[avaliacao.aluno_avaliador.id][
                                    avaliacao.aluno_avaliado.id
                                ] !== undefined
                            ) {
                                evaluationMatrix[avaliacao.aluno_avaliador.id][
                                    avaliacao.aluno_avaliado.id
                                ] = sum;
                            }
                        }
                    });
                }
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
        })();

        // Return cleanup function
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    });

    // Process alunos - show all alunos even if there are no evaluations yet
    $: if (
        turma?.alunos &&
        problema &&
        problema.criterios &&
        problema.definicao_arquivos_de_avaliacao
    ) {
        console.log(
            "🔍 DEBUG - Processing alunos with criterios and file definitions:",
            problema.criterios,
            problema.definicao_arquivos_de_avaliacao,
        );
        alunos = turma.alunos.map((aluno) => {
            let finalMedia = null;
            if (avaliacoesData.length > 0) {
                finalMedia = MediaCalculator.calculateFinalMedia(
                    avaliacoesData,
                    aluno.id,
                    problema!.criterios,
                    problema!.definicao_arquivos_de_avaliacao,
                );
            }
            console.log(
                "DEBUG final media for aluno",
                aluno.nome_completo,
                finalMedia,
            );
            return {
                ...aluno,
                finalMedia,
            };
        });
        logger.info(
            `Successfully processed ${alunos.length} alunos with final media calculation`,
        );
    } else if (turma?.alunos) {
        // Show alunos even when criterios haven't loaded yet
        alunos = turma.alunos.map((aluno) => ({
            ...aluno,
            finalMedia: null,
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

    function handleSort(newSortBy: string) {
        if (sortBy === newSortBy) {
            // Toggle sort order if clicking the same column
            sortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
            // Set new sort column and default to ascending
            sortBy = newSortBy;
            sortOrder = "asc";
        }
        currentPage = 1; // Reset to first page when sorting
    }

    function getReceivedAverage(studentId: number): number {
        const receivedGrades: number[] = [];
        if (!evaluationMatrix) return 0;
        Object.keys(evaluationMatrix).forEach((evaluatorId) => {
            const grade = evaluationMatrix[Number(evaluatorId)][studentId];
            if (grade > 0 && Number(evaluatorId) !== studentId) {
                receivedGrades.push(grade);
            }
        });
        return receivedGrades.length > 0
            ? Number(receivedGrades.reduce((a, b) => a + b, 0).toFixed(2))
            : 0;
    }

    // Add this helper function for outlier detection (copy from relatorios if not present)
    function isOutlier(studentId: number, grade: number): boolean {
        if (grade === 0) return false;
        // Collect all received grades for this student (excluding self-evaluation and zeros)
        const received = Object.keys(evaluationMatrix)
            .map(
                (evaluatorId) =>
                    evaluationMatrix[Number(evaluatorId)][studentId],
            )
            .filter((g, idx) => alunos[idx]?.id !== studentId && g > 0);
        if (received.length <= 1) return false;
        const avg = received.reduce((a, b) => a + b, 0) / received.length;
        // Outlier if absolute difference is greater than 2 points
        return Math.abs(grade - avg) > 2;
    }

    // Filter and sort alunos
    $: filteredAndSortedAlunos = (() => {
        let filtered = searchTerm
            ? alunos.filter((aluno) =>
                  aluno.nome_completo
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()),
              )
            : alunos;

        // Sort the filtered results
        return filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case "nome_completo":
                    aValue = a.nome_completo || "";
                    bValue = b.nome_completo || "";
                    break;
                case "media":
                    aValue = getReceivedAverage(a.id);
                    bValue = getReceivedAverage(b.id);
                    break;
                case "avaliacoes":
                    aValue = Object.keys(evaluationMatrix).filter(
                        (evaluatorId) => {
                            const grade =
                                evaluationMatrix[Number(evaluatorId)][a.id];
                            return grade > 0 && Number(evaluatorId) !== a.id;
                        },
                    ).length;
                    bValue = Object.keys(evaluationMatrix).filter(
                        (evaluatorId) => {
                            const grade =
                                evaluationMatrix[Number(evaluatorId)][b.id];
                            return grade > 0 && Number(evaluatorId) !== b.id;
                        },
                    ).length;
                    break;
                default:
                    aValue = a.nome_completo || "";
                    bValue = b.nome_completo || "";
            }

            // Handle string comparison
            if (typeof aValue === "string" && typeof bValue === "string") {
                const comparison = aValue.localeCompare(bValue, "pt-BR", {
                    sensitivity: "base",
                });
                return sortOrder === "asc" ? comparison : -comparison;
            }

            // Handle number comparison
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            }

            // Fallback to string comparison
            const aStr = String(aValue || "");
            const bStr = String(bValue || "");
            const comparison = aStr.localeCompare(bStr, "pt-BR", {
                sensitivity: "base",
            });
            return sortOrder === "asc" ? comparison : -comparison;
        });
    })();

    $: totalPages = Math.ceil(filteredAndSortedAlunos.length / itemsPerPage);
    $: paginatedAlunos = filteredAndSortedAlunos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Debug pagination
    $: console.log("Pagination debug:", {
        totalAlunos: alunos.length,
        filteredAlunos: filteredAndSortedAlunos.length,
        currentPage,
        itemsPerPage,
        totalPages,
        paginatedAlunosLength: paginatedAlunos.length,
        startIndex: (currentPage - 1) * itemsPerPage,
        endIndex: currentPage * itemsPerPage,
    });
</script>

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
    <PageHeader
        backUrl="/professor/turmas/{$page.params.id}/problemas"
        backText="Voltar para problemas"
        title="Alunos - {problema?.nome_problema || ''}"
    />

    <div class="content-wrapper">
        <div class="alunos-section">
            <div class="search-section">
                <SearchBar
                    bind:value={searchTerm}
                    placeholder="Pesquisar alunos..."
                    showButton={false}
                    on:search={handleSearch}
                />
            </div>

            <div class="sort-section">
                <div class="sort-buttons">
                    <Button
                        variant={sortBy === "nome_completo"
                            ? "primary"
                            : "secondary"}
                        size="sm"
                        on:click={() => handleSort("nome_completo")}
                    >
                        Nome {sortBy === "nome_completo"
                            ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                            : ""}
                    </Button>
                    <Button
                        variant={sortBy === "media" ? "primary" : "secondary"}
                        size="sm"
                        on:click={() => handleSort("media")}
                    >
                        Média {sortBy === "media"
                            ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                            : ""}
                    </Button>
                    <Button
                        variant={sortBy === "avaliacoes"
                            ? "primary"
                            : "secondary"}
                        size="sm"
                        on:click={() => handleSort("avaliacoes")}
                    >
                        Avaliações {sortBy === "avaliacoes"
                            ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                            : ""}
                    </Button>
                </div>
            </div>

            <CardList
                items={paginatedAlunos}
                {loading}
                {error}
                loadingMessage="Carregando alunos..."
                emptyMessage="Nenhum aluno encontrado."
                showRetryButton={true}
                onRetry={() => window.location.reload()}
            >
                <svelte:fragment slot="default">
                    {#each paginatedAlunos as aluno}
                        {@const professorEvaluation = avaliacoesData.find(
                            (av) =>
                                av.aluno_avaliado?.id === aluno.id &&
                                av.id_professor === $currentUser?.id,
                        )}
                        {@const hasEvaluation = !!professorEvaluation}
                        {@const finalMedia = aluno.finalMedia}
                        {@const overallMedia = finalMedia
                            ? `${finalMedia.total.toFixed(2)} (Prof: ${finalMedia.professor.toFixed(2)}, Auto: ${finalMedia.auto.toFixed(2)}, Pares: ${finalMedia.peers.toFixed(2)})`
                            : "Não avaliado"}
                        {@const professorEvaluationValue = professorEvaluation
                            ? MediaCalculator.calculateRawSumFromAvaliacao(
                                  professorEvaluation,
                              )
                            : null}

                        <AlunoCard
                            {aluno}
                            {criteriosList}
                            {hasEvaluation}
                            {overallMedia}
                            professorEvaluation={professorEvaluationValue}
                            {avaliacoesData}
                            {problema}
                            onVerDetalhes={verDetalhes}
                            onAvaliar={avaliarAluno}
                        />
                    {/each}
                </svelte:fragment>
            </CardList>

            <Pagination
                {currentPage}
                {totalPages}
                on:pageChange={(e) => (currentPage = e.detail.page)}
            />
        </div>
    </div>
{/if}

<style>
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .alunos-section {
        background: white;
        border-radius: 12px;
    }

    .search-section {
        margin-bottom: 1.5rem;
    }

    .sort-section {
        margin-bottom: 1.5rem;
    }

    .sort-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .sort-buttons button {
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
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
