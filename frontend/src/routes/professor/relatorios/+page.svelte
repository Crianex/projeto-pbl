<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type {
        TurmaModel,
        ProblemaModel,
        AlunoModel,
        AvaliacaoModel,
    } from "$lib/interfaces/interfaces";
    import { TurmasService } from "$lib/services/turmas_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { MediaCalculator } from "$lib/utils/utils";
    import CardList from "$lib/components/CardList.svelte";
    import Button from "$lib/components/Button.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let turmas: TurmaModel[] = [];
    let problemas: ProblemaModel[] = [];
    let alunos: AlunoModel[] = [];
    let avaliacoes: AvaliacaoModel[] = [];
    let loading = true;
    let error: string | null = null;

    // Filter states
    let selectedTurma: string = "";
    let selectedProblema: string = "";
    let selectedAluno: string = "";

    // Matrix data
    let evaluationMatrix: {
        [evaluatorId: number]: { [evaluatedId: number]: number };
    } = {};
    let statistics = {
        totalAvaliacoes: 0,
        mediaGeral: 0,
        desvioPadrao: 0,
        outlierCount: 0,
    };

    onMount(async () => {
        try {
            loading = true;
            error = null;

            // Fetch all data
            const [turmasData, alunosData] = await Promise.all([
                TurmasService.getAll(),
                api.get("/alunos/get-all"),
            ]);

            // Get problemas and avaliacoes from all turmas
            const problemasData = [];
            const avaliacoesData = [];

            for (const turma of turmasData) {
                try {
                    const turmaProblemas = await ProblemasService.getByTurma(
                        turma.id_turma.toString(),
                    );
                    problemasData.push(...turmaProblemas);

                    for (const problema of turmaProblemas) {
                        const problemaAvaliacoes =
                            await AvaliacoesService.getByProblema(
                                problema.id_problema.toString(),
                            );
                        avaliacoesData.push(...problemaAvaliacoes);
                    }
                } catch (err) {
                    console.warn(
                        `Error fetching data for turma ${turma.id_turma}:`,
                        err,
                    );
                }
            }

            turmas = turmasData;
            problemas = problemasData;
            alunos = alunosData;
            avaliacoes = avaliacoesData;

            logger.info("Data loaded successfully", {
                turmas: turmas.length,
                problemas: problemas.length,
                alunos: alunos.length,
                avaliacoes: avaliacoes.length,
            });
        } catch (err: any) {
            error = err.message || "Erro ao carregar dados";
            logger.error("Error loading data:", err);
        } finally {
            loading = false;
        }
    });

    // Filter functions
    function getFilteredProblemas() {
        if (!selectedTurma) return problemas;
        return problemas.filter(
            (p) => p.id_turma?.toString() === selectedTurma,
        );
    }

    function getFilteredAlunos() {
        if (!selectedTurma) return alunos;
        const turma = turmas.find(
            (t) => t.id_turma.toString() === selectedTurma,
        );
        return turma?.alunos || [];
    }

    function getFilteredAvaliacoes() {
        let filtered = avaliacoes;

        if (selectedProblema) {
            filtered = filtered.filter(
                (a) => a.id_problema?.toString() === selectedProblema,
            );
        }

        if (selectedAluno) {
            filtered = filtered.filter(
                (a) =>
                    a.aluno_avaliador?.id.toString() === selectedAluno ||
                    a.aluno_avaliado?.id.toString() === selectedAluno,
            );
        }

        return filtered;
    }

    // Matrix calculation
    $: if (
        getFilteredAlunos().length > 0 &&
        getFilteredAvaliacoes().length > 0
    ) {
        calculateMatrix();
        calculateStatistics();
    }

    function calculateMatrix() {
        const filteredAlunos = getFilteredAlunos();
        const filteredAvaliacoes = getFilteredAvaliacoes();

        // Initialize matrix
        evaluationMatrix = {};
        filteredAlunos.forEach((evaluator) => {
            evaluationMatrix[evaluator.id] = {};
            filteredAlunos.forEach((evaluated) => {
                evaluationMatrix[evaluator.id][evaluated.id] = 0;
            });
        });

        // Fill matrix with evaluations
        filteredAvaliacoes.forEach((avaliacao) => {
            if (avaliacao.aluno_avaliador && avaliacao.aluno_avaliado) {
                const average =
                    MediaCalculator.calculateSimpleMediaFromAvaliacao(
                        avaliacao,
                    );
                if (
                    evaluationMatrix[avaliacao.aluno_avaliador.id] &&
                    evaluationMatrix[avaliacao.aluno_avaliador.id][
                        avaliacao.aluno_avaliado.id
                    ] !== undefined
                ) {
                    evaluationMatrix[avaliacao.aluno_avaliador.id][
                        avaliacao.aluno_avaliado.id
                    ] = average;
                }
            }
        });
    }

    function calculateStatistics() {
        const filteredAvaliacoes = getFilteredAvaliacoes();
        const grades = filteredAvaliacoes
            .map((a) => MediaCalculator.calculateSimpleMediaFromAvaliacao(a))
            .filter((g) => g > 0);

        if (grades.length === 0) {
            statistics = {
                totalAvaliacoes: 0,
                mediaGeral: 0,
                desvioPadrao: 0,
                outlierCount: 0,
            };
            return;
        }

        const media = grades.reduce((a, b) => a + b, 0) / grades.length;
        const variance =
            grades.reduce((sum, grade) => sum + Math.pow(grade - media, 2), 0) /
            grades.length;
        const desvioPadrao = Math.sqrt(variance);

        // Count outliers (grades more than 2 standard deviations from mean)
        const outlierCount = grades.filter(
            (grade) => Math.abs(grade - media) > 2 * desvioPadrao,
        ).length;

        statistics = {
            totalAvaliacoes: grades.length,
            mediaGeral: Number(media.toFixed(2)),
            desvioPadrao: Number(desvioPadrao.toFixed(2)),
            outlierCount,
        };
    }

    function isOutlier(studentId: number, grade: number): boolean {
        if (grade === 0) return false;
        const received = Object.keys(evaluationMatrix)
            .map(
                (evaluatorId) =>
                    evaluationMatrix[Number(evaluatorId)][studentId],
            )
            .filter((g) => g > 0);
        if (received.length <= 1) return false;
        const avg = received.reduce((a, b) => a + b, 0) / received.length;
        return Math.abs(grade - avg) > 2;
    }

    function getReceivedAverage(studentId: number): number {
        const receivedGrades: number[] = [];
        Object.keys(evaluationMatrix).forEach((evaluatorId) => {
            const grade = evaluationMatrix[Number(evaluatorId)][studentId];
            if (grade > 0 && Number(evaluatorId) !== studentId) {
                receivedGrades.push(grade);
            }
        });
        return receivedGrades.length > 0
            ? Number(
                  (
                      receivedGrades.reduce((a, b) => a + b, 0) /
                      receivedGrades.length
                  ).toFixed(2),
              )
            : 0;
    }

    function exportToPDF() {
        // Implementation for PDF export
        logger.info("Exporting to PDF...");
    }

    function exportToExcel() {
        // Implementation for Excel export
        logger.info("Exporting to Excel...");
    }
</script>

<PageHeader
    backUrl="/professor"
    backText="Voltar"
    title="Relatórios de Avaliações"
/>

<div class="relatorios-container">
    {#if loading}
        <div class="loading">
            <LoadingSpinner />
            <p>Carregando dados...</p>
        </div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button
                variant="secondary"
                on:click={() => window.location.reload()}
            >
                Tentar novamente
            </Button>
        </div>
    {:else}
        <div class="filters-section">
            <div class="filter-group">
                <label for="turma-filter">Turma:</label>
                <select
                    id="turma-filter"
                    class="filter-select"
                    bind:value={selectedTurma}
                    on:change={() => {
                        selectedProblema = "";
                        selectedAluno = "";
                    }}
                >
                    <option value="">Todas as turmas</option>
                    {#each turmas as turma}
                        <option value={turma.id_turma}
                            >{turma.nome_turma}</option
                        >
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="problema-filter">Problema:</label>
                <select
                    id="problema-filter"
                    class="filter-select"
                    bind:value={selectedProblema}
                    on:change={() => {
                        selectedAluno = "";
                    }}
                >
                    <option value="">Todos os problemas</option>
                    {#each getFilteredProblemas() as problema}
                        <option value={problema.id_problema}
                            >{problema.nome_problema}</option
                        >
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="aluno-filter">Aluno:</label>
                <select
                    id="aluno-filter"
                    class="filter-select"
                    bind:value={selectedAluno}
                >
                    <option value="">Todos os alunos</option>
                    {#each getFilteredAlunos() as aluno}
                        <option value={aluno.id}>{aluno.nome_completo}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="matrix-section">
            <h2>Matriz de Avaliações</h2>
            <p class="matrix-subtitle">
                Visualize as notas que os alunos deram uns aos outros
            </p>

            <div class="statistics-header">
                <div class="stat-card">
                    <div class="stat-value">{statistics.totalAvaliacoes}</div>
                    <div class="stat-label">Total de Avaliações</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{statistics.mediaGeral}</div>
                    <div class="stat-label">Média Geral</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{statistics.desvioPadrao}</div>
                    <div class="stat-label">Desvio Padrão</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{statistics.outlierCount}</div>
                    <div class="stat-label">Outliers</div>
                </div>
            </div>

            {#if getFilteredAlunos().length > 0}
                <div class="matrix-container">
                    <table class="matrix-table">
                        <thead>
                            <tr>
                                <th class="student-name-header">Aluno</th>
                                <th class="student-number-header">#</th>
                                <th class="average-header">Média</th>
                                {#each getFilteredAlunos() as aluno}
                                    <th class="grade-header"
                                        >{aluno.nome_completo?.split(" ")[0] || "N/A"}</th
                                    >
                                {/each}
                            </tr>
                        </thead>
                        <tbody>
                            {#each getFilteredAlunos() as aluno, index}
                                {@const receivedAvg = getReceivedAverage(
                                    aluno.id,
                                )}
                                <tr>
                                    <td class="student-name"
                                        >{aluno.nome_completo}</td
                                    >
                                    <td class="student-number">{index + 1}</td>
                                    <td class="average-cell">{receivedAvg}</td>
                                    {#each getFilteredAlunos() as evaluatedAluno}
                                        {@const grade =
                                            evaluationMatrix[aluno.id]?.[
                                                evaluatedAluno.id
                                            ] || 0}
                                        {@const isOutlierGrade = isOutlier(
                                            evaluatedAluno.id,
                                            grade,
                                        )}
                                        <td
                                            class="grade-cell {isOutlierGrade
                                                ? 'outlier'
                                                : ''} {grade === 0
                                                ? 'no-grade'
                                                : ''}"
                                        >
                                            {grade > 0 ? grade : "-"}
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <div class="matrix-legend">
                    <div class="legend-item">
                        <span class="legend-color no-grade"></span>
                        <span>Sem avaliação</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color outlier"></span>
                        <span>Outlier</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color normal"></span>
                        <span>Normal</span>
                    </div>
                </div>
            {:else}
                <div class="empty-state">
                    <p>Nenhum aluno encontrado para os filtros selecionados.</p>
                </div>
            {/if}
        </div>

        <div class="export-section">
            <Button variant="secondary" on:click={exportToPDF}>
                Exportar PDF
            </Button>
            <Button variant="secondary" on:click={exportToExcel}>
                Exportar Excel
            </Button>
        </div>
    {/if}
</div>

<style>
    .relatorios-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .filters-section {
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 8px;
        padding: 0.7rem 0.7rem;
        display: flex;
        gap: 0.7rem;
        align-items: end;
        box-shadow: none;
        margin-bottom: 1rem;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 120px;
    }

    .filter-group label {
        font-weight: 600;
        color: #22223b;
        font-size: 0.92rem;
    }

    .filter-select {
        padding: 0.4rem 0.6rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #f8fafc;
        font-size: 0.97rem;
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .filter-select:hover:not(:disabled),
    .filter-select:focus {
        border-color: #6c63ff;
        outline: none;
        box-shadow: 0 0 0 2px #e0e7ff;
    }

    .filter-select:disabled {
        background: #f1f1f1;
        color: #b0b0b0;
        cursor: not-allowed;
    }

    .matrix-section {
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 8px;
        padding: 0.7rem 0.5rem;
        box-shadow: none;
        margin-bottom: 1rem;
    }

    .matrix-section h2 {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        color: #22223b;
    }

    .matrix-subtitle {
        color: #6c757d;
        font-size: 0.93rem;
        margin-bottom: 0.7rem;
    }

    .statistics-header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 6px;
    }

    .stat-card {
        flex: 1;
        text-align: center;
        padding: 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid #e9ecef;
    }

    .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #495057;
    }

    .stat-label {
        font-size: 0.75rem;
        color: #6c757d;
        margin-top: 0.25rem;
    }

    .matrix-container {
        overflow-x: auto;
        margin-bottom: 1rem;
    }

    .matrix-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }

    .matrix-table th,
    .matrix-table td {
        padding: 0.5rem;
        text-align: center;
        border: 1px solid #e9ecef;
        position: relative;
    }

    .matrix-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
    }

    .student-name-header,
    .student-name {
        min-width: 120px;
        max-width: 150px;
        text-align: left;
        font-size: 0.85rem;
    }

    .student-number-header,
    .student-number {
        min-width: 30px;
        max-width: 40px;
        font-size: 0.85rem;
    }

    .average-header,
    .average-cell {
        min-width: 50px;
        max-width: 60px;
        font-weight: 600;
        color: #495057;
    }

    .grade-header {
        min-width: 60px;
        max-width: 80px;
        font-size: 0.8rem;
        transform: rotate(-45deg);
        transform-origin: center;
        white-space: nowrap;
    }

    .grade-cell {
        min-width: 60px;
        max-width: 80px;
        font-size: 0.85rem;
    }

    .grade-cell.outlier {
        background-color: #fff3cd;
        color: #856404;
        font-weight: 600;
    }

    .grade-cell.no-grade {
        background-color: #f8f9fa;
        color: #6c757d;
    }

    .matrix-legend {
        display: flex;
        gap: 1rem;
        justify-content: center;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }

    .legend-color.no-grade {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
    }

    .legend-color.outlier {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
    }

    .legend-color.normal {
        background-color: white;
        border: 1px solid #e9ecef;
    }

    .export-section {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1rem;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
    }

    .error {
        color: #dc3545;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    @media (max-width: 768px) {
        .relatorios-container {
            padding: 0.5rem;
        }
        .filters-section {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
        }
        .filter-group {
            min-width: 100%;
        }
        .statistics-header {
            flex-wrap: wrap;
            gap: 0.25rem;
        }
        .stat-card {
            min-width: calc(50% - 0.25rem);
        }
        .matrix-container {
            font-size: 0.75rem;
        }
        .student-name-header,
        .student-name {
            min-width: 80px;
            max-width: 100px;
        }
        .grade-header {
            min-width: 40px;
            max-width: 50px;
            font-size: 0.7rem;
        }
        .grade-cell {
            min-width: 40px;
            max-width: 50px;
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .relatorios-container {
            padding: 0.25rem;
        }
        .matrix-container {
            font-size: 0.7rem;
        }
        .student-name-header,
        .student-name {
            min-width: 60px;
            max-width: 80px;
        }
        .grade-header {
            min-width: 30px;
            max-width: 40px;
            font-size: 0.65rem;
        }
        .grade-cell {
            min-width: 30px;
            max-width: 40px;
            font-size: 0.7rem;
        }
        .export-section {
            flex-direction: column;
            align-items: center;
        }
    }
</style>
