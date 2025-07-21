<script lang="ts">
    import { onMount } from "svelte";
    import { currentUser, isProfessor } from "$lib/utils/auth";
    import { api } from "$lib/utils/api";
    import { TurmasService } from "$lib/services/turmas_service";
    import { MediaCalculator } from "$lib/utils/utils";
    import type {
        TurmaModel,
        AlunoModel,
        AvaliacaoDB,
        ProblemaDB,
    } from "$lib/interfaces/interfaces";
    import Button from "$lib/components/Button.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

    let turmas: TurmaModel[] = [];
    let selectedTurma: TurmaModel | null = null;
    let selectedProblema: ProblemaDB | null = null;
    let problemas: ProblemaDB[] = [];
    let avaliacoes: AvaliacaoDB[] = [];
    let loading = true;
    let error: string | null = null;

    // Matrix data structure
    let evaluationMatrix: {
        [evaluatorId: number]: { [evaluatedId: number]: number };
    } = {};
    let alunos: AlunoModel[] = [];

    async function fetchTurmas() {
        try {
            loading = true;
            error = null;

            const allTurmas = await TurmasService.getAll();
            const user = $currentUser;

            if (user && isProfessor(user)) {
                turmas = allTurmas.filter(
                    (turma: TurmaModel) => turma.id_professor === user.id,
                );

                // Auto-select first turma that has problems
                await autoSelectFirstTurmaWithProblems();
            } else {
                turmas = [];
                error =
                    user === undefined
                        ? "Loading user information..."
                        : "Access denied: You must be a professor to view reports";
            }
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch turmas";
            console.error("Error fetching turmas:", err);
        } finally {
            loading = false;
        }
    }

    async function autoSelectFirstTurmaWithProblems() {
        for (const turma of turmas) {
            try {
                const problemasData = await api.get(
                    `/problemas/list-by-turma?id_turma=${turma.id_turma}`,
                );

                if (problemasData.length > 0) {
                    selectedTurma = turma;
                    problemas = problemasData;
                    // Auto-select first problem
                    selectedProblema = problemasData[0];
                    await fetchAvaliacoes(problemasData[0].id_problema);
                    break;
                }
            } catch (err) {
                console.error(
                    `Error fetching problemas for turma ${turma.id_turma}:`,
                    err,
                );
            }
        }
    }

    async function fetchProblemas(turmaId: number) {
        try {
            loading = true;
            const data = await api.get(
                `/problemas/list-by-turma?id_turma=${turmaId}`,
            );
            problemas = data;

            // Auto-select first problem if available
            if (data.length > 0) {
                selectedProblema = data[0];
                await fetchAvaliacoes(data[0].id_problema);
            } else {
                selectedProblema = null;
                avaliacoes = [];
                evaluationMatrix = {};
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch problemas";
            console.error("Error fetching problemas:", err);
        } finally {
            loading = false;
        }
    }

    async function fetchAvaliacoes(problemaId: number) {
        try {
            loading = true;
            console.log(`Fetching avaliacoes for problema: ${problemaId}`);
            const data = await api.get(
                `/avaliacoes/list?id_problema=${problemaId}`,
            );
            console.log(`Received ${data?.length || 0} avaliacoes:`, data);
            avaliacoes = data || [];
            console.log("About to build evaluation matrix...");
            buildEvaluationMatrix();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch avaliacoes";
            console.error("Error fetching avaliacoes:", err);
        } finally {
            loading = false;
        }
    }

    function buildEvaluationMatrix() {
        if (!selectedTurma || !avaliacoes) {
            console.log("Cannot build matrix - missing data:", {
                selectedTurma: !!selectedTurma,
                avaliacoes: avaliacoes?.length,
            });
            return;
        }

        alunos = selectedTurma.alunos || [];
        evaluationMatrix = {};

        console.log("Building matrix with:", {
            alunosCount: alunos.length,
            avaliacoesCount: avaliacoes.length,
        });

        // Initialize matrix
        alunos.forEach((evaluator) => {
            evaluationMatrix[evaluator.id] = {};
            alunos.forEach((evaluated) => {
                evaluationMatrix[evaluator.id][evaluated.id] = 0;
            });
        });

        // Fill matrix with evaluation data
        avaliacoes.forEach((avaliacao, index) => {
            if (avaliacao.id_aluno_avaliador && avaliacao.id_aluno_avaliado) {
                const average = MediaCalculator.calculateSimpleMedia(
                    avaliacao.notas,
                );
                console.log(
                    `Evaluation ${index}: ${avaliacao.id_aluno_avaliador} -> ${avaliacao.id_aluno_avaliado} = ${average}`,
                );

                // Check if student IDs exist in matrix
                if (
                    evaluationMatrix[avaliacao.id_aluno_avaliador] &&
                    evaluationMatrix[avaliacao.id_aluno_avaliador][
                        avaliacao.id_aluno_avaliado
                    ] !== undefined
                ) {
                    evaluationMatrix[avaliacao.id_aluno_avaliador][
                        avaliacao.id_aluno_avaliado
                    ] = average;
                } else {
                    console.warn(
                        `Student IDs not found in matrix: evaluator=${avaliacao.id_aluno_avaliador}, evaluated=${avaliacao.id_aluno_avaliado}`,
                    );
                }
            }
        });

        console.log("Final evaluation matrix:", evaluationMatrix);
    }

    async function handleTurmaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const turmaId = parseInt(target.value);

        if (turmaId) {
            selectedTurma = turmas.find((t) => t.id_turma === turmaId) || null;
            selectedProblema = null;
            problemas = [];
            avaliacoes = [];
            evaluationMatrix = {};
            await fetchProblemas(turmaId);
        } else {
            // Handle case where no turma is selected
            selectedTurma = null;
            selectedProblema = null;
            problemas = [];
            avaliacoes = [];
            evaluationMatrix = {};
        }
    }

    async function handleProblemaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const problemaId = parseInt(target.value);

        if (problemaId) {
            selectedProblema =
                problemas.find((p) => p.id_problema === problemaId) || null;
            await fetchAvaliacoes(problemaId);
        }
    }

    onMount(() => {
        // Test MediaCalculator with sample data
        console.log("Testing MediaCalculator:");
        const testNota =
            '{"categoria1": {"criterio1": 8, "criterio2": 9}, "categoria2": {"criterio3": 7}}';
        const testResult = MediaCalculator.calculateSimpleMedia(testNota);
        console.log(`Test: ${testNota} -> ${testResult}`);

        let hasLoaded = false;
        const unsubscribe = currentUser.subscribe((user) => {
            if (user !== undefined && !hasLoaded) {
                hasLoaded = true;
                fetchTurmas();
            }
        });

        return unsubscribe;
    });

    function getReceivedAverage(studentId: number): number {
        const receivedGrades: number[] = [];

        Object.keys(evaluationMatrix).forEach((evaluatorId) => {
            const grade = evaluationMatrix[Number(evaluatorId)][studentId];
            if (grade > 0) {
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

    function getMatrixStatistics(matrix = evaluationMatrix, students = alunos) {
        console.log("Getting statistics for matrix:", matrix);
        console.log("Alunos:", students);

        if (!matrix || Object.keys(matrix).length === 0) {
            console.log("No evaluation matrix data");
            return {
                totalAlunos: students?.length || 0,
                maiorNota: 0,
                mediaGeral: 0,
                menorNota: 0,
            };
        }

        const allGrades: number[] = [];

        // Collect all non-zero grades (excluding self-evaluations)
        // Use the same access pattern as the template
        students.forEach((evaluator) => {
            students.forEach((evaluated) => {
                if (evaluator.id !== evaluated.id) {
                    const grade = matrix[evaluator.id]?.[evaluated.id];
                    console.log(
                        `Checking grade: ${evaluator.id} -> ${evaluated.id} = ${grade}`,
                    );
                    if (grade && grade > 0) {
                        allGrades.push(grade);
                    }
                }
            });
        });

        console.log("All grades collected:", allGrades);

        if (allGrades.length === 0) {
            console.log("No valid grades found");
            return {
                totalAlunos: students?.length || 0,
                maiorNota: 0,
                mediaGeral: 0,
                menorNota: 0,
            };
        }

        const maiorNota = Math.max(...allGrades);
        const menorNota = Math.min(...allGrades);
        const mediaGeral = Number(
            (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(
                2,
            ),
        );

        const result = {
            totalAlunos: students?.length || 0,
            maiorNota: Number(maiorNota.toFixed(2)),
            mediaGeral,
            menorNota: Number(menorNota.toFixed(2)),
        };

        console.log("Statistics result:", result);
        return result;
    }

    // Force reactive updates when matrix or alunos change
    $: if (evaluationMatrix && alunos) {
        console.log("Reactive update triggered - matrix and alunos changed");
        console.log("Current matrix:", evaluationMatrix);
        console.log("Current alunos:", alunos);
    }

    // Make statistics reactive to evaluationMatrix and alunos changes
    $: statistics = getMatrixStatistics(evaluationMatrix, alunos);
</script>

<div class="relatorios-container">
    <div class="header">
        <h1>Relatórios de Avaliações</h1>
        <p class="subtitle">
            Visualize as notas que os alunos deram uns aos outros
        </p>
    </div>

    {#if loading}
        <div class="loading">
            <LoadingSpinner />
            <p>Carregando dados...</p>
        </div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={fetchTurmas}>
                Tentar novamente
            </Button>
        </div>
    {:else}
        <!-- Filters Section -->
        <div class="filters-section">
            <div class="filter-group">
                <label for="turma-select">Turma:</label>
                <select
                    id="turma-select"
                    value={selectedTurma?.id_turma || ""}
                    on:change={handleTurmaSelect}
                    class="filter-select"
                >
                    <option value="">Selecione uma turma</option>
                    {#each turmas as turma}
                        <option value={turma.id_turma}>
                            {turma.nome_turma} ({turma.alunos?.length || 0} alunos)
                        </option>
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <label for="problema-select">Problema:</label>
                <select
                    id="problema-select"
                    value={selectedProblema?.id_problema || ""}
                    on:change={handleProblemaSelect}
                    class="filter-select"
                    disabled={!selectedTurma || problemas.length === 0}
                >
                    <option value="">Selecione um problema</option>
                    {#each problemas as problema}
                        <option value={problema.id_problema}>
                            {problema.nome_problema} (Média: {problema.media_geral?.toFixed(
                                2,
                            ) || "N/A"})
                        </option>
                    {/each}
                </select>
            </div>
        </div>

        <!--  {#if selectedProblema}
            <div class="debug-section">
                <h3>Debug Info</h3>
                <p>
                    <strong>Selected Turma:</strong>
                    {selectedTurma?.nome_turma || "None"}
                </p>
                <p>
                    <strong>Selected Problema:</strong>
                    {selectedProblema?.nome_problema || "None"}
                </p>
                <p><strong>Alunos Count:</strong> {alunos?.length || 0}</p>
                <p>
                    <strong>Avaliacoes Count:</strong>
                    {avaliacoes?.length || 0}
                </p>
                <p>
                    <strong>Matrix Keys:</strong>
                    {Object.keys(evaluationMatrix || {}).length}
                </p>
                <p>
                    <strong>Sample Matrix Value:</strong>
                    {#if alunos?.length >= 2}
                        {evaluationMatrix?.[alunos[0]?.id]?.[alunos[1]?.id] ||
                            "undefined"}
                    {:else}
                        N/A
                    {/if}
                </p>
                <p>
                    <strong>Matrix Structure:</strong>
                    {#if Object.keys(evaluationMatrix || {}).length > 0}
                        {JSON.stringify(Object.keys(evaluationMatrix)).slice(
                            0,
                            100,
                        )}...
                    {:else}
                        Empty
                    {/if}
                </p>
                <p>
                    <strong>First Student Matrix:</strong>
                    {#if alunos?.length > 0 && evaluationMatrix?.[alunos[0]?.id]}
                        {JSON.stringify(evaluationMatrix[alunos[0].id]).slice(
                            0,
                            100,
                        )}...
                    {:else}
                        Empty
                    {/if}
                </p>
            </div>
        {/if} -->

        <!-- Evaluation Matrix -->
        {#if selectedProblema && alunos.length > 0}
            <div class="matrix-section">
                <h2>Matriz de Avaliações - {selectedProblema.nome_problema}</h2>
                <p class="matrix-subtitle">
                    Linhas: Quem avaliou | Colunas: Quem foi avaliado (por
                    número)
                </p>

                <!-- Statistics Header -->
                <div class="statistics-header">
                    <div class="stat-card">
                        <div class="stat-value">{statistics.totalAlunos}</div>
                        <div class="stat-label">Total Alunos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{statistics.maiorNota}</div>
                        <div class="stat-label">Maior Nota</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{statistics.mediaGeral}</div>
                        <div class="stat-label">Média Geral</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{statistics.menorNota}</div>
                        <div class="stat-label">Menor Nota</div>
                    </div>
                </div>

                <div class="matrix-container">
                    <div class="matrix-wrapper">
                        <table class="evaluation-matrix">
                            <thead>
                                <tr>
                                    <th class="student-name-header">Aluno</th>
                                    <th class="student-number-header">Número</th
                                    >
                                    <th class="average-header">Média</th>
                                    {#each alunos as aluno, index}
                                        <th
                                            class="student-header"
                                            title={aluno.nome_completo}
                                        >
                                            {index + 1}
                                        </th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody>
                                {#each alunos as evaluator, evaluatorIndex}
                                    <tr>
                                        <td
                                            class="student-name"
                                            title={evaluator.nome_completo}
                                        >
                                            {evaluator.nome_completo
                                                ?.split(" ")
                                                .slice(0, 2)
                                                .join(" ") || "N/A"}
                                        </td>
                                        <td class="student-number">
                                            {evaluatorIndex + 1}
                                        </td>
                                        <td class="average-cell">
                                            {getReceivedAverage(evaluator.id) ||
                                                "-"}
                                        </td>
                                        {#each alunos as evaluated, evaluatedIndex}
                                            <td
                                                class="grade-cell"
                                                class:self-evaluation={evaluator.id ===
                                                    evaluated.id}
                                                class:no-grade={evaluationMatrix[
                                                    evaluator.id
                                                ]?.[evaluated.id] === 0 &&
                                                    evaluator.id !==
                                                        evaluated.id}
                                            >
                                                {#if evaluator.id === evaluated.id}
                                                    X
                                                {:else if evaluationMatrix[evaluator.id]?.[evaluated.id]}
                                                    {evaluationMatrix[
                                                        evaluator.id
                                                    ][evaluated.id]}
                                                {:else}
                                                    -
                                                {/if}
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="matrix-legend">
                    <h4>Legenda:</h4>
                    <ul>
                        <li>
                            <strong>Número:</strong> Identificação numérica do aluno
                            na matriz
                        </li>
                        <li>
                            <strong>Média:</strong> Nota média recebida pelo aluno
                            de seus colegas
                        </li>
                        <li>
                            <strong>Colunas numeradas (1, 2, 3...):</strong> Notas
                            dadas para cada aluno (identificado pelo número)
                        </li>
                        <li>
                            <strong>X:</strong> Auto-avaliação (aluno não avalia
                            a si mesmo)
                        </li>
                    </ul>
                </div>
            </div>
        {/if}

        {#if turmas.length === 0 && !loading}
            <div class="empty-state">
                <p>Nenhuma turma encontrada.</p>
            </div>
        {:else if selectedTurma && problemas.length === 0 && !loading}
            <div class="empty-state">
                <p>Nenhum problema encontrado para esta turma.</p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .relatorios-container {
        width: 100%;
        height: 100%;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .header h1 {
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #2c3e50;
    }

    .subtitle {
        color: #6c757d;
        margin-bottom: 2rem;
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 4rem 2rem;
        text-align: center;
    }

    .error {
        text-align: center;
        padding: 2rem;
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
    }

    .filters-section {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        gap: 2rem;
        align-items: end;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 250px;
    }

    .filter-group label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 0.9rem;
    }

    .filter-select {
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        background: white;
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.2s ease;
    }

    .filter-select:hover:not(:disabled) {
        border-color: #007bff;
    }

    .filter-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .filter-select:disabled {
        background: #f8f9fa;
        color: #6c757d;
        cursor: not-allowed;
    }

    .matrix-section {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .matrix-section h2 {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #2c3e50;
    }

    .matrix-subtitle {
        color: #6c757d;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .statistics-header {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    }

    .stat-card {
        text-align: center;
        padding: 1rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .matrix-container {
        overflow-x: auto;
        border: 1px solid #dee2e6;
        border-radius: 8px;
    }

    .matrix-wrapper {
        min-width: max-content;
    }

    .evaluation-matrix {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .evaluation-matrix th,
    .evaluation-matrix td {
        padding: 0.75rem 0.5rem;
        text-align: center;
        border: 1px solid #dee2e6;
    }

    .student-name-header {
        background: #f8f9fa;
        font-weight: 600;
        text-align: left;
        min-width: 150px;
        max-width: 150px;
        position: sticky;
        left: 0;
        z-index: 10;
    }

    .student-number-header {
        background: #f8f9fa;
        font-weight: 600;
        text-align: center;
        min-width: 60px;
        max-width: 60px;
        position: sticky;
        left: 150px;
        z-index: 10;
    }

    .student-name {
        background: #f8f9fa;
        font-weight: 500;
        text-align: left;
        min-width: 150px;
        max-width: 150px;
        position: sticky;
        left: 0;
        z-index: 5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .student-number {
        background: #f8f9fa;
        font-weight: 600;
        text-align: center;
        min-width: 60px;
        max-width: 60px;
        position: sticky;
        left: 150px;
        z-index: 5;
    }

    .student-header {
        background: #f8f9fa;
        font-weight: 600;
        min-width: 50px;
        max-width: 50px;
        text-align: center;
        font-size: 0.9rem;
    }

    .average-header,
    .average-label {
        background: #e3f2fd;
        font-weight: 600;
        color: #1976d2;
        min-width: 80px;
        max-width: 80px;
        position: sticky;
        left: 210px;
        z-index: 10;
        text-align: center;
    }

    .grade-cell {
        background: white;
        font-weight: 500;
    }

    .grade-cell.self-evaluation {
        background: #f5f5f5;
        color: #6c757d;
    }

    .grade-cell.no-grade {
        background: #fff3cd;
        color: #856404;
    }

    .average-cell {
        background: #e3f2fd;
        font-weight: 600;
        color: #1976d2;
        min-width: 80px;
        max-width: 80px;
        position: sticky;
        left: 210px;
        z-index: 5;
        text-align: center;
    }

    .matrix-legend {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    .matrix-legend h4 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1rem;
    }

    .matrix-legend ul {
        margin: 0;
        padding-left: 1.5rem;
    }

    .matrix-legend li {
        margin-bottom: 0.5rem;
        color: #495057;
    }

    .matrix-legend li:last-child {
        margin-bottom: 0;
    }

    .debug-section {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 2rem;
        font-family: monospace;
        font-size: 0.9rem;
    }

    .debug-section h3 {
        margin: 0 0 1rem 0;
        color: #856404;
    }

    .debug-section p {
        margin: 0.5rem 0;
        color: #856404;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        color: #6c757d;
    }

    @media (max-width: 768px) {
        .relatorios-container {
            padding: 1rem;
        }

        .filters-section {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .filter-group {
            min-width: 100%;
        }

        .statistics-header {
            grid-template-columns: repeat(2, 1fr);
            padding: 1rem;
        }

        .stat-card {
            padding: 0.75rem;
        }

        .stat-value {
            font-size: 1.5rem;
        }

        .stat-label {
            font-size: 0.8rem;
        }

        .matrix-container {
            font-size: 0.8rem;
        }

        .student-name-header,
        .student-name {
            min-width: 120px;
            max-width: 120px;
        }

        .student-number-header,
        .student-number {
            min-width: 50px;
            max-width: 50px;
            left: 120px;
        }

        .average-header,
        .average-cell {
            min-width: 70px;
            max-width: 70px;
            left: 170px;
        }

        .student-header {
            min-width: 40px;
            max-width: 40px;
            font-size: 0.8rem;
        }
    }
</style>
