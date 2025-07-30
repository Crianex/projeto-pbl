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
    import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
    import type { PDFFont } from "pdf-lib";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import { tooltip } from "$lib/utils/tooltip";

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
    let zoomLevel = 1; // Default zoom level (100%)

    // Debug zoom level changes
    $: console.log("Zoom level changed to:", zoomLevel);

    async function fetchTurmas() {
        try {
            loading = true;
            error = null;

            const user = $currentUser;

            if (!user || !isProfessor(user)) {
                throw new Error("User not authenticated or not a professor");
            }

            // Use TurmasService.getAll() with the current professor's ID
            const allTurmas = await TurmasService.getAll(user.id, true);

            // Debug logging (can be removed in production)
            console.log("Debug fetchTurmas:", {
                allTurmasCount: allTurmas.length,
                user_id: user?.id,
                user_email: user?.email,
                isProfessor: user ? isProfessor(user) : false,
                allTurmas: allTurmas,
                allTurmasType: typeof allTurmas,
                isArray: Array.isArray(allTurmas),
            });

            if (user && isProfessor(user)) {
                // Show all turmas (consistent with /professor/turmas/ page behavior)
                // Note: The application allows professors to see all turmas, not just their own
                // This enables collaboration and administrative oversight
                turmas = allTurmas.sort((a, b) =>
                    (a.nome_turma || "").localeCompare(
                        b.nome_turma || "",
                        "pt-BR",
                        {
                            sensitivity: "base",
                        },
                    ),
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
        console.log("autoSelectFirstTurmaWithProblems - turmas:", turmas);
        console.log(
            "autoSelectFirstTurmaWithProblems - turmas type:",
            typeof turmas,
        );
        console.log(
            "autoSelectFirstTurmaWithProblems - isArray:",
            Array.isArray(turmas),
        );

        for (const turma of turmas) {
            try {
                const problemasData = await api.get(
                    `/problemas/list-by-turma?id_turma=${turma.id_turma}`,
                );

                // Select the first turma regardless of whether it has problems or avaliações
                selectedTurma = turma;
                problemas = problemasData.sort((a: ProblemaDB, b: ProblemaDB) =>
                    (a.nome_problema || "").localeCompare(
                        b.nome_problema || "",
                        "pt-BR",
                        {
                            sensitivity: "base",
                        },
                    ),
                );

                // Auto-select first problem if available
                if (problemasData.length > 0) {
                    selectedProblema = problemasData[0];
                    await fetchAvaliacoes(problemasData[0].id_problema);
                } else {
                    selectedProblema = null;
                    avaliacoes = [];
                    evaluationMatrix = {};
                }
                break;
            } catch (err) {
                console.error(
                    `Error fetching problemas for turma ${turma.id_turma}:`,
                    err,
                );
                // Even if there's an error, still select the turma
                selectedTurma = turma;
                problemas = [];
                selectedProblema = null;
                avaliacoes = [];
                evaluationMatrix = {};
                break;
            }
        }
    }

    async function fetchProblemas(turmaId: number) {
        try {
            loading = true;
            error = null;
            console.log("fetchProblemas - calling API for turmaId:", turmaId);
            const data = await api.get(
                `/problemas/list-by-turma?id_turma=${turmaId}`,
            );
            console.log("fetchProblemas - API response:", data);
            console.log("fetchProblemas - data type:", typeof data);
            console.log("fetchProblemas - isArray:", Array.isArray(data));
            problemas = data.sort((a: ProblemaDB, b: ProblemaDB) =>
                (a.nome_problema || "").localeCompare(
                    b.nome_problema || "",
                    "pt-BR",
                    {
                        sensitivity: "base",
                    },
                ),
            );

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
            // Even if there's an error, clear the data
            problemas = [];
            selectedProblema = null;
            avaliacoes = [];
            evaluationMatrix = {};
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
            console.log("fetchAvaliacoes - API response:", data);
            console.log("fetchAvaliacoes - data type:", typeof data);
            console.log("fetchAvaliacoes - isArray:", Array.isArray(data));

            // Ensure avaliacoes is always an array
            if (Array.isArray(data)) {
                avaliacoes = data;
            } else if (data && typeof data === "object") {
                // If it's a single object, wrap it in an array
                avaliacoes = [data];
            } else {
                avaliacoes = [];
            }
            console.log("fetchAvaliacoes - final avaliacoes:", avaliacoes);
            console.log(
                "fetchAvaliacoes - final avaliacoes type:",
                typeof avaliacoes,
            );
            console.log(
                "fetchAvaliacoes - final avaliacoes isArray:",
                Array.isArray(avaliacoes),
            );
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
        console.log("buildEvaluationMatrix - selectedTurma:", selectedTurma);
        console.log("buildEvaluationMatrix - avaliacoes:", avaliacoes);
        console.log(
            "buildEvaluationMatrix - avaliacoes type:",
            typeof avaliacoes,
        );
        console.log(
            "buildEvaluationMatrix - isArray:",
            Array.isArray(avaliacoes),
        );

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
                // Não inicialize com 0, deixe undefined
                // evaluationMatrix[evaluator.id][evaluated.id] = undefined;
            });
        });

        // Fill matrix with evaluation data
        avaliacoes.forEach((avaliacao, index) => {
            if (avaliacao.id_aluno_avaliador && avaliacao.id_aluno_avaliado) {
                const average = MediaCalculator.calculateSimpleMedia(
                    avaliacao.notas,
                );
                /* console.log(
                    `Evaluation ${index}: ${avaliacao.id_aluno_avaliador} -> ${avaliacao.id_aluno_avaliado} = ${average}`,
                ); */

                // Check if evaluator exists in matrix
                if (evaluationMatrix[avaliacao.id_aluno_avaliador]) {
                    evaluationMatrix[avaliacao.id_aluno_avaliador][
                        avaliacao.id_aluno_avaliado
                    ] = average;
                } else {
                    console.warn(
                        `Evaluator ID not found in matrix: evaluator=${avaliacao.id_aluno_avaliador}`,
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
            console.log("onMount - user changed:", {
                user: user,
                user_tipo: user?.tipo,
                isProfessor: user ? isProfessor(user) : false,
                hasLoaded: hasLoaded,
            });

            if (user !== undefined && !hasLoaded) {
                hasLoaded = true;
                console.log("onMount - calling fetchTurmas");
                fetchTurmas();
            }
        });

        // Add keyboard shortcuts for zoom
        function handleKeydown(event: KeyboardEvent) {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case "=":
                    case "+":
                        event.preventDefault();
                        zoomIn();
                        break;
                    case "-":
                        event.preventDefault();
                        zoomOut();
                        break;
                    case "0":
                        event.preventDefault();
                        resetZoom();
                        break;
                }
            }
        }

        document.addEventListener("keydown", handleKeydown);

        return () => {
            unsubscribe();
            document.removeEventListener("keydown", handleKeydown);
        };
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
        console.log("getMatrixStatistics - matrix:", matrix);
        console.log("getMatrixStatistics - students:", students);
        console.log("getMatrixStatistics - students type:", typeof students);
        console.log(
            "getMatrixStatistics - students isArray:",
            Array.isArray(students),
        );

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
            .map(
                (evaluatorId) =>
                    evaluationMatrix[Number(evaluatorId)][evaluatedId],
            )
            .filter((g, idx) => alunos[idx]?.id !== evaluatedId && g > 0);
        if (received.length <= 1) return false;
        const avg = received.reduce((a, b) => a + b, 0) / received.length;
        // Outlier se diferença absoluta for maior que 2 pontos
        return Math.abs(grade - avg) > 2;
    }

    // Função para detectar auto-avaliação
    function isSelfEvaluation(
        evaluatorId: number,
        evaluatedId: number,
    ): boolean {
        return evaluatorId === evaluatedId;
    }

    // Force reactive updates when matrix or alunos change
    $: if (evaluationMatrix && alunos) {
        console.log("Reactive update triggered - matrix and alunos changed");
        console.log("Current matrix:", evaluationMatrix);
        console.log("Current alunos:", alunos);
        console.log("Current alunos type:", typeof alunos);
        console.log("Current alunos isArray:", Array.isArray(alunos));
    }

    // Make statistics reactive to evaluationMatrix and alunos changes
    $: statistics = getMatrixStatistics(evaluationMatrix, alunos);

    // Make zoom styles reactive to zoomLevel changes
    $: zoomStyles = {
        fontSize: `${(0.95 * zoomLevel).toFixed(2)}rem`,
        cellHeight: `${Math.round(50 * zoomLevel)}px`,
        cellWidth: `${Math.round(60 * zoomLevel)}px`,
        nameWidth: `${Math.round(120 * zoomLevel)}px`,
        numberWidth: `${Math.round(50 * zoomLevel)}px`,
        averageWidth: `${Math.round(70 * zoomLevel)}px`,
        padding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
        headerPadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
        namePadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.75 * zoomLevel)}rem`,
        numberLeft: `${Math.round(120 * zoomLevel)}px`,
        averageLeft: `${Math.round(120 * zoomLevel) + Math.round(50 * zoomLevel)}px`,
    };
    $: console.log("Zoom styles updated:", zoomStyles);

    // 1. Add a derived variable for professor evaluations and a helper to get professor's grade for each student

    $: professor = selectedTurma?.professor;
    $: professorAvaliacao = Array.isArray(avaliacoes)
        ? avaliacoes.filter((a) => a.id_professor)
        : [];

    function getProfessorGradeFor(studentId: number): number | null {
        console.log("Professor avaliações:", professorAvaliacao);
        const avaliacao = professorAvaliacao.find(
            (a) => a.id_aluno_avaliado === studentId,
        );
        if (!avaliacao) return null;
        const avg = MediaCalculator.calculateSimpleMedia(avaliacao.notas);
        console.log("Avaliação do professor:", avaliacao);
        return avg;
    }

    // Zoom control functions
    function zoomIn() {
        if (zoomLevel < 2) {
            // Max zoom 200%
            zoomLevel = Math.min(2, zoomLevel + 0.1);
            console.log("Zoom in clicked, new zoomLevel:", zoomLevel);
        }
    }

    function zoomOut() {
        if (zoomLevel > 0.5) {
            // Min zoom 50%
            zoomLevel = Math.max(0.5, zoomLevel - 0.1);
            console.log("Zoom out clicked, new zoomLevel:", zoomLevel);
        }
    }

    function resetZoom() {
        zoomLevel = 1;
        console.log("Reset zoom clicked, new zoomLevel:", zoomLevel);
    }

    // Calculate dynamic styles based on zoom level
    function getZoomStyles() {
        const baseFontSize = 0.95;
        const baseCellHeight = 50;
        const baseCellWidth = 60;
        const baseNameWidth = 120;
        const baseNumberWidth = 50;
        const baseAverageWidth = 70;

        const nameWidth = Math.round(baseNameWidth * zoomLevel);
        const numberWidth = Math.round(baseNumberWidth * zoomLevel);
        const averageWidth = Math.round(baseAverageWidth * zoomLevel);

        return {
            fontSize: `${(baseFontSize * zoomLevel).toFixed(2)}rem`,
            cellHeight: `${Math.round(baseCellHeight * zoomLevel)}px`,
            cellWidth: `${Math.round(baseCellWidth * zoomLevel)}px`,
            nameWidth: `${nameWidth}px`,
            numberWidth: `${numberWidth}px`,
            averageWidth: `${averageWidth}px`,
            padding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
            headerPadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
            namePadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.75 * zoomLevel)}rem`,
            numberLeft: `${nameWidth}px`,
            averageLeft: `${nameWidth + numberWidth}px`,
        };
    }

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
        // Add professor row
        if (professor) {
            const row = [
                `"${professor.nome_completo?.split(" ").slice(0, 2).join(" ") || "Professor"}"`,
                "Prof.",
                "-",
            ];
            alunos.forEach((evaluated) => {
                if (professor.id === evaluated.id) {
                    row.push("X");
                } else {
                    const grade = getProfessorGradeFor(
                        evaluated.id,
                    )?.toString()!;
                    row.push(grade);
                }
            });
            csv += row.join(",") + "\n";
        }
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

    // PDF Export using pdf-lib
    async function exportMatrixAsPDF() {
        if (!alunos.length || !Object.keys(evaluationMatrix).length) return;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Define all variables first
        const leftMargin = 30; // Reduced from 40 to 30
        const cellHeight = 25; // Reduced from 32 to 25
        const nameFontSize = 11; // Reduced from 13 to 11
        const namePadding = 15; // Reduced from 20 to 15
        const otherColWidth = 55; // Reduced from 70 to 55

        // Dynamically calculate the max width needed for the name column
        const maxNameWidth = Math.max(
            ...alunos.map((a) =>
                font.widthOfTextAtSize(
                    a.nome_completo?.split(" ").slice(0, 2).join(" ") || "N/A",
                    nameFontSize,
                ),
            ),
        );
        const nameColWidth = Math.ceil(maxNameWidth) + namePadding;

        // Calculate page size based on table width
        const tableWidth =
            leftMargin + nameColWidth + otherColWidth * (alunos.length + 2); // +2 for number and average columns
        const pageWidth = Math.max(800, tableWidth + 40); // Add some margin
        const pageHeight = Math.max(
            600,
            100 + (alunos.length + 3) * cellHeight,
        ); // +3 for header, students, and professor row

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = page.getHeight() - 40; // Reduced from 50 to 40
        const headerBg = rgb(0.88, 0.91, 1);
        const borderColor = rgb(0.8, 0.8, 0.8);
        // Title
        page.drawText(
            `Matriz de Avaliações - ${selectedProblema?.nome_problema || "Problema"}`,
            { x: leftMargin, y, size: 18, font, color: rgb(0, 0, 0) }, // Reduced from 22 to 18
        );
        y -= 30; // Reduced from 40 to 30
        // Table header
        let x = leftMargin;
        const headers = [
            "Aluno",
            "Número",
            "Média",
            ...alunos.map((_, idx) => (idx + 1).toString()),
        ];
        headers.forEach((header, i) => {
            const colWidth = i === 0 ? nameColWidth : otherColWidth;
            page.drawRectangle({
                x,
                y,
                width: colWidth,
                height: cellHeight,
                color: headerBg,
                borderColor,
                borderWidth: 1,
            });
            page.drawText(header, {
                x: x + 8, // Reduced from 10 to 8
                y: y + 10, // Reduced from 12 to 10
                size: 12, // Reduced from 15 to 12
                font,
                color: rgb(0, 0, 0),
            });
            x += colWidth;
        });
        y -= cellHeight;
        // Table body
        alunos.forEach((evaluator, evaluatorIdx) => {
            x = leftMargin;
            // Aluno name
            const name =
                evaluator.nome_completo?.split(" ").slice(0, 2).join(" ") ||
                "N/A";
            const nameLines = wrapText(
                name,
                nameColWidth - 8, // Reduced from 10 to 8
                font,
                nameFontSize,
            );
            const rowHeight = Math.max(
                cellHeight,
                nameLines.length * (nameFontSize + 1) + 6, // Reduced spacing
            );
            page.drawRectangle({
                x,
                y,
                width: nameColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            nameLines.forEach((line, i) => {
                page.drawText(line, {
                    x: x + 8, // Reduced from 10 to 8
                    y: y + rowHeight - 12 - i * (nameFontSize + 1), // Reduced spacing
                    size: nameFontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
            });
            x += nameColWidth;
            // Número
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((evaluatorIdx + 1).toString(), {
                x: x + 20, // Reduced from 24 to 20
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Média
            const avg = getReceivedAverage(evaluator.id) || "-";
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText(avg.toString(), {
                x: x + 20, // Reduced from 24 to 20
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Grades
            alunos.forEach((evaluated) => {
                page.drawRectangle({
                    x,
                    y,
                    width: otherColWidth,
                    height: rowHeight,
                    borderColor,
                    borderWidth: 1,
                });
                let text = "-";
                if (evaluator.id === evaluated.id) {
                    text = "X";
                } else {
                    const grade =
                        evaluationMatrix[evaluator.id]?.[evaluated.id];
                    text =
                        grade && grade > 0
                            ? grade.toString()
                            : grade === 0
                              ? "0"
                              : "-";
                }
                page.drawText(text, {
                    x: x + 22, // Reduced from 30 to 22
                    y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                    size: 11, // Reduced from 13 to 11
                    font,
                    color: rgb(0, 0, 0),
                });
                x += otherColWidth;
            });
            y -= rowHeight;
        });
        // Professor row
        if (professor) {
            x = leftMargin;
            const name =
                professor.nome_completo?.split(" ").slice(0, 2).join(" ") ||
                "Professor";
            const nameLines = wrapText(
                name,
                nameColWidth - 8, // Reduced from 10 to 8
                font,
                nameFontSize,
            );
            const rowHeight = Math.max(
                cellHeight,
                nameLines.length * (nameFontSize + 1) + 6, // Reduced spacing
            );
            page.drawRectangle({
                x,
                y,
                width: nameColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            nameLines.forEach((line, i) => {
                page.drawText(line, {
                    x: x + 8, // Reduced from 10 to 8
                    y: y + rowHeight - 12 - i * (nameFontSize + 1), // Reduced spacing
                    size: nameFontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
            });
            x += nameColWidth;
            // Número
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("Prof.", {
                x: x + 8, // Reduced from 10 to 8
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Média
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("-", {
                x: x + 20, // Reduced from 24 to 20
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Grades
            alunos.forEach((evaluated) => {
                page.drawRectangle({
                    x,
                    y,
                    width: otherColWidth,
                    height: rowHeight,
                    borderColor,
                    borderWidth: 1,
                });
                let text: string;
                if (professor.id === evaluated.id) {
                    text = "X";
                } else {
                    const grade = getProfessorGradeFor(evaluated.id);
                    text = grade !== null ? `${grade}` : "-";
                }
                page.drawText(text, {
                    x: x + 22, // Reduced from 30 to 22
                    y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                    size: 11, // Reduced from 13 to 11
                    font,
                    color: rgb(0, 0, 0),
                });
                x += otherColWidth;
            });
            y -= rowHeight;
        }
        // Download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${selectedProblema?.nome_problema || "matriz"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper to wrap text for the name column
    function wrapText(
        text: string,
        maxWidth: number,
        font: PDFFont,
        fontSize: number,
    ): string[] {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";
        for (let word of words) {
            const testLine = currentLine ? currentLine + " " + word : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth + 4 > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Helper to get detailed evaluation information for tooltips
    function getEvaluationDetails(
        evaluatorId: number,
        evaluatedId: number,
    ): string {
        if (!selectedProblema || !avaliacoes) return "";

        const evaluator = alunos.find((a) => a.id === evaluatorId);
        const evaluated = alunos.find((a) => a.id === evaluatedId);

        if (!evaluator || !evaluated) return "";

        let details = `<strong>${evaluator.nome_completo}</strong> avaliou <strong>${evaluated.nome_completo}</strong><br><br>`;

        // Get the specific evaluation
        const evaluation = avaliacoes.find(
            (av) =>
                av.id_aluno_avaliador === evaluatorId &&
                av.id_aluno_avaliado === evaluatedId,
        );

        if (!evaluation) {
            details += "❌ <strong>Avaliação não enviada</strong>";
            return details;
        }

        try {
            const notas = JSON.parse(evaluation.notas);
            details += "📊 <strong>Detalhes da avaliação:</strong><br>";

            Object.entries(notas).forEach(([tag, criterios]) => {
                if (typeof criterios === "object" && criterios !== null) {
                    details += `<br><strong>${tag}:</strong><br>`;
                    Object.entries(criterios).forEach(([criterio, nota]) => {
                        if (typeof nota === "number") {
                            details += `  • ${criterio}: ${nota.toFixed(1)}<br>`;
                        }
                    });
                }
            });

            // Add average
            const average = MediaCalculator.calculateSimpleMedia(
                evaluation.notas,
            );
            details += `<br><strong>Média final: ${average.toFixed(2)}</strong>`;
        } catch (error) {
            details += "❌ <strong>Erro ao processar avaliação</strong>";
        }

        return details;
    }

    // Helper to get falta information for tooltips
    function getFaltaInfo(studentId: number): string {
        if (!selectedProblema || !selectedProblema.faltas_por_tag) return "";

        try {
            const faltasPorTag = JSON.parse(selectedProblema.faltas_por_tag);
            const student = alunos.find((a) => a.id === studentId);

            if (!student) return "";

            const missedTags = Object.entries(faltasPorTag)
                .filter(([tag, students]) => {
                    if (typeof students === "object" && students !== null) {
                        return (students as any)[studentId] === true;
                    }
                    return false;
                })
                .map(([tag]) => tag);

            if (missedTags.length === 0) {
                return "";
            }

            return `<br><br>⚠️ <strong>Faltas registradas:</strong><br>• ${missedTags.join("<br>• ")}`;
        } catch (error) {
            return "";
        }
    }

    // Helper to get falta information for the evaluated student
    function getEvaluatedFaltaInfo(evaluatedId: number): string {
        if (!selectedProblema || !selectedProblema.faltas_por_tag) return "";

        try {
            const faltasPorTag = JSON.parse(selectedProblema.faltas_por_tag);
            const evaluatedStudent = alunos.find((a) => a.id === evaluatedId);

            if (!evaluatedStudent) return "";

            const missedTags = Object.entries(faltasPorTag)
                .filter(([tag, students]) => {
                    if (typeof students === "object" && students !== null) {
                        return (students as any)[evaluatedId] === true;
                    }
                    return false;
                })
                .map(([tag]) => tag);

            if (missedTags.length === 0) {
                return "";
            }

            return `<br><br>⚠️ <strong>AVISO: Aluno avaliado faltou em:</strong><br>• ${missedTags.join("<br>• ")}`;
        } catch (error) {
            return "";
        }
    }

    // Helper to generate complete tooltip content
    function getTooltipContent(
        evaluatorId: number,
        evaluatedId: number,
    ): string {
        const evaluationDetails = getEvaluationDetails(
            evaluatorId,
            evaluatedId,
        );
        const evaluatorFaltaInfo = getFaltaInfo(evaluatorId);
        const evaluatedFaltaInfo = getEvaluatedFaltaInfo(evaluatedId);

        return evaluationDetails + evaluatorFaltaInfo + evaluatedFaltaInfo;
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
                            {problema.nome_problema} (Média: {problema.media_geral !==
                                null && problema.media_geral !== undefined
                                ? problema.media_geral.toFixed(2)
                                : "Não avaliado"}
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
            <div class="controls-section">
                <div class="export-buttons">
                    <Button variant="secondary" on:click={exportMatrixAsCSV}>
                        Exportar CSV
                    </Button>
                    <Button variant="secondary" on:click={exportMatrixAsPDF}>
                        Exportar PDF
                    </Button>
                </div>

                <div class="zoom-controls">
                    <Button
                        variant="secondary"
                        on:click={zoomOut}
                        disabled={zoomLevel <= 0.5}
                    >
                        <span style="font-size: 1.2rem;">−</span>
                    </Button>
                    <span class="zoom-level"
                        >{Math.round(zoomLevel * 100)}%</span
                    >
                    <Button
                        variant="secondary"
                        on:click={zoomIn}
                        disabled={zoomLevel >= 2}
                    >
                        <span style="font-size: 1.2rem;">+</span>
                    </Button>
                    <Button
                        variant="secondary"
                        on:click={resetZoom}
                        disabled={zoomLevel === 1}
                    >
                        Reset
                    </Button>
                </div>
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
                    <div class="scroll-hint">
                        📱 Deslize horizontalmente para ver todas as colunas
                    </div>
                    <div class="matrix-wrapper">
                        <table
                            class="evaluation-matrix"
                            style="font-size: {zoomStyles.fontSize};"
                        >
                            <thead>
                                <tr>
                                    <th
                                        class="student-name-header"
                                        style="min-width: {zoomStyles.nameWidth}; max-width: {zoomStyles.nameWidth}; padding: {zoomStyles.namePadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        >Aluno</th
                                    >
                                    <th
                                        class="student-number-header"
                                        style="min-width: {zoomStyles.numberWidth}; max-width: {zoomStyles.numberWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.numberLeft};"
                                        >Número</th
                                    >
                                    <th
                                        class="average-header"
                                        style="min-width: {zoomStyles.averageWidth}; max-width: {zoomStyles.averageWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.averageLeft};"
                                        >Média</th
                                    >
                                    {#each alunos as aluno, index}
                                        <th
                                            class="student-header"
                                            title={aluno.nome_completo}
                                            style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
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
                                            style="min-width: {zoomStyles.nameWidth}; max-width: {zoomStyles.nameWidth}; padding: {zoomStyles.namePadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        >
                                            {evaluator.nome_completo
                                                ?.split(" ")
                                                .slice(0, 2)
                                                .join(" ") || "N/A"}
                                        </td>
                                        <td
                                            class="student-number"
                                            style="min-width: {zoomStyles.numberWidth}; max-width: {zoomStyles.numberWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.numberLeft};"
                                        >
                                            {evaluatorIndex + 1}
                                        </td>
                                        <td
                                            class="average-cell"
                                            style="min-width: {zoomStyles.averageWidth}; max-width: {zoomStyles.averageWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.averageLeft};"
                                        >
                                            {getReceivedAverage(evaluator.id) ||
                                                "-"}
                                        </td>
                                        {#each alunos as evaluated}
                                            {@const grade =
                                                evaluationMatrix[
                                                    evaluator.id
                                                ]?.[evaluated.id]}
                                            {@const isSelfEval =
                                                isSelfEvaluation(
                                                    evaluator.id,
                                                    evaluated.id,
                                                )}
                                            {#if isSelfEval}
                                                <td
                                                    class="grade-cell self-evaluation"
                                                    style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                    use:tooltip={{
                                                        title: getTooltipContent(
                                                            evaluator.id,
                                                            evaluated.id,
                                                        ),
                                                    }}
                                                >
                                                    {#if grade && grade > 0}
                                                        <span
                                                            class="self-eval-grade"
                                                            >{grade}</span
                                                        >
                                                    {:else}
                                                        <span>N</span>
                                                    {/if}
                                                </td>
                                            {:else if grade === undefined || grade === null}
                                                <td
                                                    class="grade-cell"
                                                    style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                    use:tooltip={{
                                                        title: getTooltipContent(
                                                            evaluator.id,
                                                            evaluated.id,
                                                        ),
                                                    }}>N</td
                                                >
                                            {:else if grade > 0}
                                                <td
                                                    class="grade-cell{isOutlier(
                                                        evaluated.id,
                                                        grade,
                                                    )
                                                        ? ' outlier-grade'
                                                        : ''}"
                                                    style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                    use:tooltip={{
                                                        title: getTooltipContent(
                                                            evaluator.id,
                                                            evaluated.id,
                                                        ),
                                                    }}>{grade}</td
                                                >
                                            {:else if grade === 0}
                                                <td
                                                    class="grade-cell zero-grade"
                                                    style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                    use:tooltip={{
                                                        title: getTooltipContent(
                                                            evaluator.id,
                                                            evaluated.id,
                                                        ),
                                                    }}>0</td
                                                >
                                            {:else}
                                                <td
                                                    class="grade-cell"
                                                    style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                    use:tooltip={{
                                                        title: getTooltipContent(
                                                            evaluator.id,
                                                            evaluated.id,
                                                        ),
                                                    }}>N</td
                                                >
                                            {/if}
                                        {/each}
                                    </tr>
                                {/each}
                                <tr class="professor-row">
                                    <td
                                        class="student-name"
                                        title={professor?.nome_completo}
                                        style="min-width: {zoomStyles.nameWidth}; max-width: {zoomStyles.nameWidth}; padding: {zoomStyles.namePadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                    >
                                        {professor
                                            ? professor.nome_completo
                                                  ?.split(" ")
                                                  .slice(0, 2)
                                                  .join(" ")
                                            : "Professor"}
                                    </td>
                                    <td
                                        class="student-number"
                                        style="min-width: {zoomStyles.numberWidth}; max-width: {zoomStyles.numberWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.numberLeft};"
                                        >Prof.</td
                                    >
                                    <td
                                        class="average-cell"
                                        style="min-width: {zoomStyles.averageWidth}; max-width: {zoomStyles.averageWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize}; left: {zoomStyles.averageLeft};"
                                        >-</td
                                    >
                                    {#each alunos as evaluated}
                                        {#if professor && evaluated.id === professor.id}
                                            <td
                                                class="grade-cell professor-grade self-evaluation tooltip-cell"
                                                style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                title="Auto-avaliação do professor"
                                            >
                                                <span>X</span>
                                            </td>
                                        {:else if getProfessorGradeFor(evaluated.id) === null}
                                            <td
                                                class="grade-cell professor-grade tooltip-cell"
                                                style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                title="Professor não avaliou este aluno"
                                                >N</td
                                            >
                                        {:else}
                                            <td
                                                class="grade-cell professor-grade tooltip-cell"
                                                style="min-width: {zoomStyles.cellWidth}; width: {zoomStyles.cellWidth}; padding: {zoomStyles.padding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                                title="Avaliação do professor: {getProfessorGradeFor(
                                                    evaluated.id,
                                                )}"
                                            >
                                                {getProfessorGradeFor(
                                                    evaluated.id,
                                                )}
                                            </td>
                                        {/if}
                                    {/each}
                                </tr>
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
                            <strong>Média:</strong> Nota média recebida, pelo aluno,
                            de seus colegas
                        </li>
                        <li>
                            <strong>Colunas numeradas (1, 2, 3...):</strong> Notas
                            dadas para cada aluno (identificado pelo número)
                        </li>
                        <li>
                            <strong>N:</strong> Avaliação não enviada para o colega
                        </li>
                        <li>
                            <span
                                style="background:#ffcccc;padding:2px 8px;border-radius:4px;"
                                >&nbsp;</span
                            > Nota zero enviada
                        </li>
                        <li>
                            <span
                                style="background:#fff9c4;padding:2px 8px;border-radius:4px;"
                                >&nbsp;</span
                            > Nota fora do padrão dos colegas
                        </li>
                        <li>
                            <span
                                style="background:#e3fbec;padding:2px 8px;border-radius:4px;color:#168f41;font-weight:600;"
                                >&nbsp;</span
                            > Auto-avaliação realizada
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
                <p class="empty-state-subtitle">
                    Quando problemas forem criados para esta turma, eles
                    aparecerão aqui.
                </p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .relatorios-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
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
        overflow-y: visible;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        background: #f8fafc;
        margin-bottom: 0.5rem;
        width: 100%;
        white-space: nowrap;
    }

    .matrix-wrapper {
        min-width: max-content;
        width: fit-content;
        transition: all 0.2s ease;
        display: inline-block;
    }

    .evaluation-matrix {
        width: auto;
        min-width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.95rem;
        background: #fff;
        table-layout: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
    }

    .evaluation-matrix th {
        background: #e0e7ff;
        font-weight: 700;
        color: #22223b;
        border-bottom: 2px solid #bfc6e0;
    }

    .evaluation-matrix td {
        text-align: center;
        border-bottom: 1px solid #f0f0f0;
    }

    .evaluation-matrix tr:nth-child(even) td {
        background: #f8fafc;
    }

    .student-name-header,
    .student-name {
        background: #f3f4fa !important;
        font-weight: 600;
        text-align: left;
        position: sticky;
        left: 0;
        z-index: 10;
        border-right: 1px solid #e0e7ff;
    }

    .student-number-header,
    .student-number {
        background: #f3f4fa !important;
        font-weight: 600;
        text-align: center;
        position: sticky;
        z-index: 10;
        border-right: 1px solid #e0e7ff;
    }

    .average-header,
    .average-cell {
        background: #e0e7ff !important;
        font-weight: 700;
        color: #6c63ff;
        position: sticky;
        z-index: 10;
        text-align: center;
        border-right: 1px solid #e0e7ff;
    }

    .grade-cell {
        background: #fff !important;
        font-size: 0.95rem;
        border-radius: 3px;
        min-width: 60px;
        width: 60px;
        white-space: nowrap;
        font-weight: 600;
        padding: 0.75rem 0.5rem;
    }

    .student-header {
        min-width: 60px;
        width: 60px;
        white-space: nowrap;
        text-align: center;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .scroll-hint {
        background: #e0f2fe;
        color: #0277bd;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        text-align: center;
        border-bottom: 1px solid #b3e5fc;
        font-weight: 500;
        display: none;
    }

    @media (max-width: 1024px) {
        .scroll-hint {
            display: block;
        }
    }

    .grade-cell.self-evaluation {
        background: var(--color-nature-background-light, #e3fbec) !important;
        color: var(--color-nature-main, #168f41);
        font-weight: 600;
        border: 1px solid var(--color-nature-border, rgba(22, 143, 65, 0.2));
    }

    .self-eval-grade {
        color: var(--color-nature-main, #168f41);
        font-weight: 700;
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

    .professor-row {
        background: #e3f2fd !important;
        font-weight: 600;
    }
    .grade-cell.professor-grade {
        background: #e3f2fd !important;
        color: #1976d2 !important;
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

    .empty-state-subtitle {
        font-size: 0.9rem;
        color: #9ca3af;
        margin-top: 0.5rem;
        margin-bottom: 0;
    }

    .controls-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .export-buttons {
        display: flex;
        gap: 1rem;
    }

    .zoom-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f8fafc;
        padding: 0.5rem;
        border-radius: 6px;
        border: 1px solid #e3e6ed;
    }

    .zoom-level {
        font-weight: 600;
        color: #6c63ff;
        min-width: 3rem;
        text-align: center;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .relatorios-container {
            padding: 0.2rem 0.05rem;
            gap: 0.4rem;
            margin-top: 3rem;
        }

        .controls-section {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }

        .export-buttons {
            justify-content: center;
        }

        .zoom-controls {
            justify-content: center;
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
            font-size: 0.9rem;
        }
        .matrix-legend {
            padding: 0.2rem 0.1rem;
            font-size: 0.9rem;
        }
        .empty-state {
            padding: 0.5rem 0.1rem;
        }
        .student-name-header,
        .student-name {
            min-width: 90px;
            max-width: 110px;
            font-size: 0.88rem;
        }
        .student-number-header,
        .student-number {
            font-size: 0.88rem;
        }
        .average-header,
        .average-cell {
            font-size: 0.88rem;
        }
        .grade-cell {
            font-size: 0.88rem;
            min-width: 45px;
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
