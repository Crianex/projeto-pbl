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
    import jsPDF from "jspdf";
    import "jspdf-autotable";

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

    // Função para detectar outlier
    function isOutlier(evaluatedId: number, grade: number): boolean {
        if (grade === 0) return false;
        // Coletar todas as notas recebidas pelo avaliado (exceto autoavaliação e zeros)
        const received = Object.keys(evaluationMatrix)
            .map((evaluatorId) => evaluationMatrix[Number(evaluatorId)][evaluatedId])
            .filter((g, idx) => alunos[idx]?.id !== evaluatedId && g > 0);
        if (received.length <= 1) return false;
        const avg = received.reduce((a, b) => a + b, 0) / received.length;
        // Outlier se diferença absoluta for maior que 2 pontos
        return Math.abs(grade - avg) > 2;
    }

    // Force reactive updates when matrix or alunos change
    $: if (evaluationMatrix && alunos) {
        console.log("Reactive update triggered - matrix and alunos changed");
        console.log("Current matrix:", evaluationMatrix);
        console.log("Current alunos:", alunos);
    }

    // Make statistics reactive to evaluationMatrix and alunos changes
    $: statistics = getMatrixStatistics(evaluationMatrix, alunos);

    // CSV Export
    function exportMatrixAsCSV() {
        if (!alunos.length || !Object.keys(evaluationMatrix).length) return;
        let csv = "Aluno,Número,Média";
        alunos.forEach((aluno, idx) => {
            csv += `,${idx + 1}`;
        });
        csv += "\n";
        alunos.forEach((evaluator, evaluatorIdx) => {
            const row = [
                `"${evaluator.nome_completo?.split(" ").slice(0, 2).join(" ") || "N/A"}"`,
                evaluatorIdx + 1,
                getReceivedAverage(evaluator.id) || "-",
            ];
            alunos.forEach((evaluated) => {
                if (evaluator.id === evaluated.id) {
                    row.push("X");
                } else {
                    const grade =
                        evaluationMatrix[evaluator.id]?.[evaluated.id];
                    row.push(grade && grade > 0 ? grade : "-");
                }
            });
            csv += row.join(",") + "\n";
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute(
            "download",
            `relatorio_${selectedProblema?.nome_problema || "matriz"}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // PDF Export
    function exportMatrixAsPDF() {
        if (!alunos.length || !Object.keys(evaluationMatrix).length) return;
        const doc = new jsPDF();
        const title = `Matriz de Avaliações - ${selectedProblema?.nome_problema || "Problema"}`;
        doc.text(title, 14, 16);
        // Build table head
        const head = [
            [
                "Aluno",
                "Número",
                "Média",
                ...alunos.map((_, idx) => (idx + 1).toString()),
            ],
        ];
        // Build table body
        const body = alunos.map((evaluator, evaluatorIdx) => {
            const row = [
                evaluator.nome_completo?.split(" ").slice(0, 2).join(" ") ||
                    "N/A",
                evaluatorIdx + 1,
                getReceivedAverage(evaluator.id) || "-",
            ];
            alunos.forEach((evaluated) => {
                if (evaluator.id === evaluated.id) {
                    row.push("X");
                } else {
                    const grade =
                        evaluationMatrix[evaluator.id]?.[evaluated.id];
                    row.push(grade && grade > 0 ? grade : "-");
                }
            });
            return row;
        });
        // @ts-ignore
        doc.autoTable({ head, body, startY: 22 });
        doc.save(
            `relatorio_${selectedProblema?.nome_problema || "matriz"}.pdf`,
        );
    }
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
            <div
                class="export-buttons"
                style="display: flex; gap: 1rem; margin-bottom: 1.5rem;"
            >
                <Button variant="secondary" on:click={exportMatrixAsCSV}>
                    Exportar CSV
                </Button>
                <Button variant="secondary" on:click={exportMatrixAsPDF}>
                    Exportar PDF
                </Button>
            </div>
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
                                        {#each alunos as evaluated}
                                            {@const grade = evaluationMatrix[evaluator.id]?.[evaluated.id]}
                                            <td class="grade-cell{evaluator.id === evaluated.id ? ' self-evaluation' : ''}{grade === 0 && evaluator.id !== evaluated.id ? ' zero-grade' : ''}{isOutlier(evaluated.id, grade) ? ' outlier-grade' : ''}">
                                                {#if evaluator.id === evaluated.id}
                                                    <span class="grade-cell self-evaluation">X</span>
                                                {:else}
                                                    {grade > 0 ? grade : grade === 0 ? 0 : '-'}
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
                        <li><strong>Número:</strong> Identificação numérica do aluno na matriz</li>
                        <li><strong>Média:</strong> Nota média recebida pelo aluno de seus colegas</li>
                        <li><strong>Colunas numeradas (1, 2, 3...):</strong> Notas dadas para cada aluno (identificado pelo número)</li>
                        <li><strong>X:</strong> Auto-avaliação (aluno não avalia a si mesmo)</li>
                        <li><span style="background:#ffcccc;padding:2px 8px;border-radius:4px;">&nbsp;</span> Nota zero enviada</li>
                        <li><span style="background:#fff9c4;padding:2px 8px;border-radius:4px;">&nbsp;</span> Nota fora do padrão dos colegas</li>
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
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: #fafbfc;
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        margin-top: 2.5rem;
    }

    .header {
        margin-bottom: 0.7rem;
        margin-top: 0;
    }

    .header h1 {
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        color: #22223b;
    }

    .subtitle {
        color: #6c757d;
        margin-bottom: 0.7rem;
        font-size: 0.98rem;
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
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 8px;
        padding: 0.7rem 0.7rem;
        display: flex;
        gap: 0.7rem;
        align-items: end;
        box-shadow: none;
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

    .filter-select:hover:not(:disabled), .filter-select:focus {
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
        justify-content: center;
    }

    .stat-card {
        text-align: center;
        padding: 0.5rem 0.7rem;
        background: #f8fafc;
        border: 1px solid #e0e7ff;
        border-radius: 6px;
        box-shadow: none;
        min-width: 70px;
        transition: none;
    }

    .stat-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #6c63ff;
        margin-bottom: 0.1rem;
    }

    .stat-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .matrix-container {
        overflow-x: auto;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        background: #f8fafc;
        margin-bottom: 0.5rem;
    }

    .matrix-wrapper {
        min-width: max-content;
    }

    .evaluation-matrix {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.93rem;
        background: #fff;
    }

    .evaluation-matrix th {
        background: #e0e7ff;
        font-weight: 700;
        color: #22223b;
        padding: 0.5rem 0.3rem;
        border-bottom: 2px solid #bfc6e0;
    }

    .evaluation-matrix td {
        padding: 0.5rem 0.3rem;
        text-align: center;
        border-bottom: 1px solid #f0f0f0;
    }

    .evaluation-matrix tr:nth-child(even) td {
        background: #f8fafc;
    }

    .student-name-header, .student-name {
        background: #f3f4fa !important;
        font-weight: 600;
        text-align: left;
        min-width: 90px;
        max-width: 120px;
        position: sticky;
        left: 0;
        z-index: 10;
        border-right: 1px solid #e0e7ff;
        font-size: 0.93rem;
    }

    .student-number-header, .student-number {
        background: #f3f4fa !important;
        font-weight: 600;
        text-align: center;
        min-width: 35px;
        max-width: 45px;
        position: sticky;
        left: 90px;
        z-index: 10;
        border-right: 1px solid #e0e7ff;
        font-size: 0.93rem;
    }

    .average-header, .average-cell {
        background: #e0e7ff !important;
        font-weight: 700;
        color: #6c63ff;
        min-width: 50px;
        max-width: 60px;
        position: sticky;
        left: 135px;
        z-index: 10;
        text-align: center;
        border-right: 1px solid #e0e7ff;
        font-size: 0.93rem;
    }

    .grade-cell {
        background: #fff !important;
        font-size: 0.93rem;
        border-radius: 3px;
    }

    .grade-cell.self-evaluation {
        background: #f3f4fa !important;
        color: #b0b0b0;
        font-weight: 600;
    }

    .grade-cell.zero-grade {
        background: #ffeaea !important;
        color: #e53935 !important;
        font-weight: 600;
    }

    .grade-cell.outlier-grade {
        background: #fff9c4 !important;
        color: #bfa600 !important;
        font-weight: 600;
    }

    .matrix-legend {
        margin-top: 0.7rem;
        padding: 0.4rem 0.7rem;
        background: #f8fafc;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        font-size: 0.93rem;
        color: #495057;
        box-shadow: none;
    }

    .matrix-legend h4 {
        margin: 0 0 0.4rem 0;
        color: #22223b;
        font-size: 0.97rem;
        font-weight: 700;
    }

    .matrix-legend ul {
        margin: 0;
        padding-left: 1rem;
    }

    .matrix-legend li {
        margin-bottom: 0.2rem;
        color: #495057;
        line-height: 1.4;
    }

    .matrix-legend li:last-child {
        margin-bottom: 0;
    }

    .empty-state {
        text-align: center;
        padding: 1rem 0.5rem;
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        color: #6c757d;
        font-size: 1rem;
        box-shadow: none;
    }

    @media (max-width: 768px) {
        .relatorios-container {
            padding: 0.2rem 0.05rem;
            gap: 0.4rem;
            margin-top: 3rem;
        }
        .header {
            margin-top: 0;
            margin-bottom: 0.5rem;
        }
        .header h1 {
            text-align: center;
            font-size: 1rem;
        }
        .subtitle {
            text-align: center;
            font-size: 0.93rem;
            margin-bottom: 0.4rem;
        }
        .filters-section {
            flex-direction: column;
            gap: 0.2rem;
            align-items: stretch;
            padding: 0.3rem 0.1rem;
        }
        .filter-group {
            min-width: 100%;
            gap: 0.1rem;
        }
        .filter-select {
            font-size: 0.93rem;
            padding: 0.2rem 0.3rem;
        }
        .matrix-section {
            padding: 0.3rem 0.1rem;
        }
        .matrix-section h2 {
            font-size: 0.93rem;
            text-align: center;
        }
        .matrix-subtitle {
            font-size: 0.85rem;
            margin-bottom: 0.3rem;
        }
        .statistics-header {
            flex-direction: column;
            gap: 0.2rem;
            padding: 0;
        }
        .stat-card {
            padding: 0.2rem 0.3rem;
            min-width: 60px;
        }
        .stat-value {
            font-size: 0.93rem;
        }
        .stat-label {
            font-size: 0.7rem;
        }
        .matrix-container {
            font-size: 0.85rem;
        }
        .matrix-legend {
            padding: 0.2rem 0.1rem;
            font-size: 0.9rem;
        }
        .empty-state {
            padding: 0.5rem 0.1rem;
        }
        .student-name-header, .student-name {
            min-width: 70px;
            max-width: 90px;
            font-size: 0.85rem;
        }
        .student-number-header, .student-number {
            min-width: 25px;
            max-width: 35px;
            left: 70px;
            font-size: 0.85rem;
        }
        .average-header, .average-cell {
            min-width: 35px;
            max-width: 45px;
            left: 95px;
            font-size: 0.85rem;
        }
        .grade-cell {
            font-size: 0.85rem;
        }
    }
    @media (max-width: 480px) {
        .relatorios-container {
            padding: 0.05rem;
        }
        .filters-section {
            padding: 0.1rem 0.02rem;
        }
        .matrix-section {
            padding: 0.1rem 0.02rem;
        }
        .matrix-legend {
            padding: 0.08rem 0.02rem;
        }
        .empty-state {
            padding: 0.2rem 0.02rem;
        }
    }
</style>
