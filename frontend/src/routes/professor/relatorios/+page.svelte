<script lang="ts">
    import { onMount } from "svelte";
    import { currentUser, isCoordenador, isProfessor } from "$lib/utils/auth";
    import { TurmasService } from "$lib/services/turmas_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { ProfessoresService } from "$lib/services/professores_service";
    import { MediaCalculator, PDFExportUtils } from "$lib/utils/utils";
    import type {
        TurmaModel,
        AlunoModel,
        AvaliacaoModel,
        ProblemaModel,
        ProfessorModel,
    } from "$lib/interfaces/interfaces";
    import Button from "$lib/components/Button.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

    import Tooltip from "$lib/components/Tooltip.svelte";
    import { tooltip } from "$lib/utils/tooltip";
    import MatrixLegend from "$lib/components/MatrixLegend.svelte";
    import ExportControls from "$lib/components/ExportControls.svelte";
    import EmptyStates from "$lib/components/EmptyStates.svelte";
    import StatisticsHeader from "$lib/components/StatisticsHeader.svelte";
    import RelatoriosFilters from "$lib/components/RelatoriosFilters.svelte";
    import MatrixControls from "$lib/components/MatrixControls.svelte";
    import { turmaCache } from "$lib/utils/cache";

    let turmas: TurmaModel[] = [];
    let selectedTurma: TurmaModel | null = null;
    let selectedProblema: ProblemaModel | null = null;
    let problemas: ProblemaModel[] = [];
    let avaliacoes: AvaliacaoModel[] = [];
    let loading = true;
    let error: string | null = null;
    let firstLoad = true;

    // Professor filter for coordenadores
    let professores: ProfessorModel[] = [];
    let selectedProfessorId: number | null = null;
    let loadingProfessores = false;

    // Cache for loaded data
    let problemasCache: { [turmaId: number]: ProblemaModel[] } = {};
    let avaliacoesCache: { [problemaId: number]: AvaliacaoModel[] } = {};
    let turmasCache: TurmaModel[] = [];
    let loadingProblemas = false;
    let loadingAvaliacoes = false;

    // Matrix data structure
    let evaluationMatrix: {
        [evaluatorId: number]: { [evaluatedId: number]: number };
    } = {};
    let alunos: AlunoModel[] = [];
    let zoomLevel = 1; // Default zoom level (100%)
    let scaleFormat = "0-3"; // Default scale format ("0-3" or "0-10")

    // Debug zoom level changes
    // $: console.log("Zoom level changed to:", zoomLevel);

    // Function to convert grades between scales
    function convertGrade(
        grade: number,
        fromScale: string = "0-3",
        toScale: string = "0-10",
    ): number {
        if (grade === 0 || !grade) return grade;

        if (fromScale === "0-3" && toScale === "0-10") {
            // Convert from 0-3 to 0-10 scale
            return Number((grade * (10 / 3)).toFixed(2));
        } else if (fromScale === "0-10" && toScale === "0-3") {
            // Convert from 0-10 to 0-3 scale
            return Number((grade * (3 / 10)).toFixed(2));
        }

        return grade;
    }

    // Function to format grade based on current scale
    function formatGrade(grade: number): number {
        if (!grade || grade === 0) return grade;

        if (scaleFormat === "0-10") {
            return convertGrade(grade, "0-3", "0-10");
        }

        return grade;
    }

    // New function to calculate final media for a student using the new logic
    function getFinalMediaForStudent(studentId: number): {
        professor: number;
        auto: number;
        peers: number;
        total: number;
    } {
        if (!selectedProblema || !avaliacoes || !alunos) {
            console.log("getFinalMediaForStudent: Missing data", {
                selectedProblema: !!selectedProblema,
                avaliacoes: avaliacoes?.length,
                alunos: alunos?.length,
                studentId,
            });
            return { professor: 0, auto: 0, peers: 0, total: 0 };
        }

        // If showing average of all problems, calculate average across all problems
        if (selectedProblema.id_problema === -1) {
            return getAverageFinalMediaAcrossAllProblems(studentId);
        }

        try {
            // Parse criterios and file definitions from the problem
            let criteriosGroup = {};
            let fileDefs = [];
            try {
                criteriosGroup =
                    typeof selectedProblema.criterios === "string"
                        ? JSON.parse(selectedProblema.criterios)
                        : selectedProblema.criterios;
            } catch {}
            try {
                fileDefs =
                    typeof selectedProblema.definicao_arquivos_de_avaliacao ===
                    "string"
                        ? JSON.parse(
                              selectedProblema.definicao_arquivos_de_avaliacao,
                          )
                        : selectedProblema.definicao_arquivos_de_avaliacao;
            } catch {}

            // Parse avaliacoes to get proper structure
            const parsedAvaliacoes = avaliacoes.map((av) => {
                let notas = av.notas;
                let notas_por_arquivo = av.notas_por_arquivo;
                try {
                    notas =
                        typeof notas === "string" ? JSON.parse(notas) : notas;
                } catch {}
                try {
                    notas_por_arquivo =
                        typeof notas_por_arquivo === "string"
                            ? JSON.parse(notas_por_arquivo)
                            : notas_por_arquivo;
                } catch {}
                return { ...av, notas, notas_por_arquivo };
            });

            console.log("getFinalMediaForStudent: Calling MediaCalculator", {
                studentId,
                parsedAvaliacoesCount: parsedAvaliacoes.length,
                criteriosGroup,
                fileDefs,
            });

            // Use the new MediaCalculator function
            const result = MediaCalculator.calculateFinalMedia(
                parsedAvaliacoes,
                studentId,
                criteriosGroup,
                fileDefs,
            );

            console.log(
                "getFinalMediaForStudent: Result for studentId",
                studentId,
            );
            console.log("Raw result:", result);
            console.log("Formatted result:", {
                professor: formatGrade(result.professor),
                auto: formatGrade(result.auto),
                peers: formatGrade(result.peers),
                total: formatGrade(result.total),
            });

            return {
                professor: formatGrade(result.professor),
                auto: formatGrade(result.auto),
                peers: formatGrade(result.peers),
                total: formatGrade(result.total),
            };
        } catch (error) {
            console.error("Error calculating final media for student:", error);
            return { professor: 0, auto: 0, peers: 0, total: 0 };
        }
    }

    // Helper function to calculate average final media across all problems
    function getAverageFinalMediaAcrossAllProblems(studentId: number): {
        professor: number;
        auto: number;
        peers: number;
        total: number;
    } {
        if (!problemas || problemas.length === 0) {
            return { professor: 0, auto: 0, peers: 0, total: 0 };
        }

        const allResults: {
            professor: number;
            auto: number;
            peers: number;
            total: number;
        }[] = [];

        // Calculate final media for each problem
        for (const problema of problemas) {
            try {
                // Get avaliacoes for this specific problem
                const problemAvaliacoes = avaliacoes.filter(
                    (av) => av.id_problema === problema.id_problema,
                );

                if (problemAvaliacoes.length === 0) continue;

                // Parse criterios and file definitions from the problem
                let criteriosGroup = {};
                let fileDefs = [];
                try {
                    criteriosGroup =
                        typeof problema.criterios === "string"
                            ? JSON.parse(problema.criterios)
                            : problema.criterios;
                } catch {}
                try {
                    fileDefs =
                        typeof problema.definicao_arquivos_de_avaliacao ===
                        "string"
                            ? JSON.parse(
                                  problema.definicao_arquivos_de_avaliacao,
                              )
                            : problema.definicao_arquivos_de_avaliacao;
                } catch {}

                // Parse avaliacoes to get proper structure
                const parsedAvaliacoes = problemAvaliacoes.map((av) => {
                    let notas = av.notas;
                    let notas_por_arquivo = av.notas_por_arquivo;
                    try {
                        notas =
                            typeof notas === "string"
                                ? JSON.parse(notas)
                                : notas;
                    } catch {}
                    try {
                        notas_por_arquivo =
                            typeof notas_por_arquivo === "string"
                                ? JSON.parse(notas_por_arquivo)
                                : notas_por_arquivo;
                    } catch {}
                    return { ...av, notas, notas_por_arquivo };
                });

                // Calculate final media for this problem
                const result = MediaCalculator.calculateFinalMedia(
                    parsedAvaliacoes,
                    studentId,
                    criteriosGroup,
                    fileDefs,
                );

                allResults.push({
                    professor: result.professor,
                    auto: result.auto,
                    peers: result.peers,
                    total: result.total,
                });
            } catch (error) {
                console.warn(
                    `Error calculating final media for problema ${problema.id_problema}:`,
                    error,
                );
            }
        }

        // Calculate averages
        if (allResults.length === 0) {
            return { professor: 0, auto: 0, peers: 0, total: 0 };
        }

        const avgProfessor =
            allResults.reduce((sum, r) => sum + r.professor, 0) /
            allResults.length;
        const avgAuto =
            allResults.reduce((sum, r) => sum + r.auto, 0) / allResults.length;
        const avgPeers =
            allResults.reduce((sum, r) => sum + r.peers, 0) / allResults.length;
        const avgTotal =
            allResults.reduce((sum, r) => sum + r.total, 0) / allResults.length;

        return {
            professor: formatGrade(Number(avgProfessor.toFixed(2))),
            auto: formatGrade(Number(avgAuto.toFixed(2))),
            peers: formatGrade(Number(avgPeers.toFixed(2))),
            total: formatGrade(Number(avgTotal.toFixed(2))),
        };
    }

    async function fetchProfessores() {
        try {
            loadingProfessores = true;
            const data = await ProfessoresService.list();
            professores = data.sort((a, b) =>
                (a.nome_completo || "").localeCompare(
                    b.nome_completo || "",
                    "pt-BR",
                    { sensitivity: "base" },
                ),
            );
        } catch (err) {
            console.error("Error fetching professores:", err);
            professores = [];
        } finally {
            loadingProfessores = false;
        }
    }

    async function fetchTurmas() {
        try {
            loading = true;
            error = null;

            const user = $currentUser;

            if (!user || (!isProfessor(user) && !isCoordenador(user))) {
                throw new Error(
                    "User not authenticated or not a professor/coordenador",
                );
            }

            let allTurmas: TurmaModel[] = [];

            if (isCoordenador(user)) {
                if (turmasCache.length > 0) {
                    allTurmas = turmasCache;
                    if (selectedProfessorId) {
                        allTurmas = allTurmas.filter(
                            (t) => t.professor?.id === selectedProfessorId,
                        );
                    }
                } else {
                    // Coordenadores can see all turmas, optionally filtered by professor
                    // Get all turmas without professor filter
                    allTurmas = await TurmasService.getAll(null);
                    turmasCache = turmas;

                    if (selectedProfessorId) {
                        allTurmas = allTurmas.filter(
                            (t) => t.professor?.id === selectedProfessorId,
                        );
                    }
                }
            } else {
                // Professors see all turmas (existing behavior)
                allTurmas = await TurmasService.getAll(user.id);
                turmasCache = turmas;
            }

            // Debug logging (can be removed in production)
            console.log("Debug fetchTurmas:", {
                allTurmasCount: allTurmas.length,
                user_id: user?.id,
                user_email: user?.email,
                isProfessor: user ? isProfessor(user) : false,
                isCoordenador: user ? isCoordenador(user) : false,
                selectedProfessorId,
                allTurmas: allTurmas,
                allTurmasType: typeof allTurmas,
                isArray: Array.isArray(allTurmas),
            });

            // Sort turmas alphabetically
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

        // Select the first turma and load its problemas
        if (turmas.length > 0) {
            selectedTurma = turmas[0];
            await fetchProblemas(selectedTurma.id_turma);

            console.log(
                "autoSelectFirstTurmaWithProblems - problemas:",
                problemas,
            );

            // Auto-select the first problema if available
            if (problemas.length > 1) {
                selectedProblema = problemas[0];
                if (selectedProblema.id_problema === -1) {
                    selectedProblema = problemas[1];
                }
                await fetchAvaliacoes(selectedProblema.id_problema);
            } else {
                selectedProblema = null;
                avaliacoes = [];
                evaluationMatrix = {};
            }
        }
    }

    async function fetchProblemas(turmaId: number) {
        try {
            loadingProblemas = true;
            error = null;

            // Check cache first
            if (problemasCache[turmaId]) {
                console.log(
                    "fetchProblemas - using cached data for turmaId:",
                    turmaId,
                );
                problemas = problemasCache[turmaId];

                problemas = [
                    {
                        id_problema: -1,
                        nome_problema: "Média de Todos os Problemas",
                        media_geral: null,
                        id_turma: selectedTurma?.id_turma || 0,
                        created_at: new Date(),
                        turma: null,
                        criterios: {},
                        definicao_arquivos_de_avaliacao: [],
                        data_e_hora_criterios_e_arquivos: {},
                        faltas_por_tag: {},
                    },
                    ...problemas,
                ];

                // Auto-select first problem if this is the initial load (no selectedProblema yet)
                if (!selectedProblema && problemas.length > 1) {
                    selectedProblema = problemas[0];
                    if (selectedProblema.id_problema === -1) {
                        selectedProblema = problemas[1];
                    }
                    await fetchAvaliacoes(selectedProblema.id_problema);
                } else {
                    selectedProblema = null;
                    avaliacoes = [];
                    evaluationMatrix = {};
                }
                return;
            }

            console.log(
                "fetchProblemas - calling service for turmaId:",
                turmaId,
            );
            const data = await ProblemasService.getByTurma(turmaId.toString());
            console.log("fetchProblemas - service response:", data);
            console.log("fetchProblemas - data type:", typeof data);
            console.log("fetchProblemas - isArray:", Array.isArray(data));

            const sortedData = data.sort((a: ProblemaModel, b: ProblemaModel) =>
                (a.nome_problema || "").localeCompare(
                    b.nome_problema || "",
                    "pt-BR",
                    {
                        sensitivity: "base",
                    },
                ),
            );

            // Cache the data
            problemasCache[turmaId] = sortedData;
            problemas = sortedData;

            problemas = [
                {
                    id_problema: -1,
                    nome_problema: "Média de Todos os Problemas",
                    media_geral: null,
                    id_turma: selectedTurma?.id_turma || 0,
                    created_at: new Date(),
                    turma: null,
                    criterios: {},
                    definicao_arquivos_de_avaliacao: [],
                    data_e_hora_criterios_e_arquivos: {},
                    faltas_por_tag: {},
                },
                ...problemas,
            ];

            // Auto-select first problem if this is the initial load (no selectedProblema yet)
            if (!selectedProblema && sortedData.length > 0) {
                selectedProblema = sortedData[0];
                if (selectedProblema.id_problema === -1) {
                    selectedProblema = sortedData[1];
                }
                await fetchAvaliacoes(selectedProblema.id_problema);
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
            loadingProblemas = false;
        }
    }

    async function fetchAvaliacoes(problemaId: number) {
        try {
            loadingAvaliacoes = true;

            // Check cache first
            if (avaliacoesCache[problemaId]) {
                console.log(
                    "fetchAvaliacoes - using cached data for problemaId:",
                    problemaId,
                );
                avaliacoes = avaliacoesCache[problemaId];
                buildEvaluationMatrix();
                return;
            }

            console.log(`Fetching avaliacoes for problema: ${problemaId}`);
            const data = await AvaliacoesService.getByProblema(
                problemaId.toString(),
            );
            console.log("fetchAvaliacoes - service response:", data);
            console.log("fetchAvaliacoes - data type:", typeof data);
            console.log("fetchAvaliacoes - isArray:", Array.isArray(data));

            // Ensure avaliacoes is always an array
            let processedData: AvaliacaoModel[] = [];
            if (Array.isArray(data)) {
                processedData = data;
            } else if (data && typeof data === "object") {
                // If it's a single object, wrap it in an array
                processedData = [data];
            } else {
                processedData = [];
            }

            // Cache the data
            avaliacoesCache[problemaId] = processedData;
            avaliacoes = processedData;

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
            loadingAvaliacoes = false;
        }
    }

    async function fetchAllProblemsAvaliacoes() {
        try {
            loadingAvaliacoes = true;
            error = null;

            if (!selectedTurma || problemas.length === 0) {
                avaliacoes = [];
                buildEvaluationMatrix();
                return;
            }

            // Check if we already have all problems cached
            const allProblemsCached = problemas.every(
                (problema) => avaliacoesCache[problema.id_problema],
            );

            if (allProblemsCached) {
                console.log("All problems already cached, combining data...");
                const allAvaliacoes = problemas.flatMap(
                    (problema) => avaliacoesCache[problema.id_problema],
                );
                avaliacoes = allAvaliacoes;
                console.log("Combined cached avaliacoes:", avaliacoes.length);
                buildEvaluationMatrix();
                return;
            }

            console.log(
                "Fetching all problems avaliacoes for turma:",
                selectedTurma.id_turma,
            );

            // Fetch all avaliacoes for all problems in the turma
            const allAvaliacoes: AvaliacaoModel[] = [];

            for (const problema of problemas) {
                try {
                    // Check if we already have this problem's avaliacoes in cache
                    if (avaliacoesCache[problema.id_problema]) {
                        console.log(
                            `Using cached avaliacoes for problema ${problema.id_problema}`,
                        );
                        allAvaliacoes.push(
                            ...avaliacoesCache[problema.id_problema],
                        );
                    } else {
                        const data = await AvaliacoesService.getByProblema(
                            problema.id_problema.toString(),
                        );
                        let processedData: AvaliacaoModel[] = [];

                        if (Array.isArray(data)) {
                            processedData = data;
                        } else if (data && typeof data === "object") {
                            processedData = [data];
                        }

                        // Cache individual problem avaliacoes
                        avaliacoesCache[problema.id_problema] = processedData;
                        allAvaliacoes.push(...processedData);
                    }
                } catch (err) {
                    console.warn(
                        `Failed to fetch avaliacoes for problema ${problema.id_problema}:`,
                        err,
                    );
                }
            }

            avaliacoes = allAvaliacoes;
            console.log(
                "fetchAllProblemsAvaliacoes - total avaliacoes:",
                avaliacoes.length,
            );
            buildEvaluationMatrix();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch all problems avaliacoes";
            console.error("Error fetching all problems avaliacoes:", err);
            avaliacoes = [];
        } finally {
            loadingAvaliacoes = false;
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

        alunos = (selectedTurma.alunos || []).sort((a, b) =>
            (a.nome_completo || "").localeCompare(
                b.nome_completo || "",
                "pt-BR",
                { sensitivity: "base" },
            ),
        );
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
        if (selectedProblema?.id_problema === -1) {
            // Calculate averages across all problems
            const evaluationCounts: {
                [evaluatorId: number]: { [evaluatedId: number]: number };
            } = {};
            const evaluationSums: {
                [evaluatorId: number]: { [evaluatedId: number]: number };
            } = {};

            // Initialize counts and sums
            alunos.forEach((evaluator) => {
                evaluationCounts[evaluator.id] = {};
                evaluationSums[evaluator.id] = {};
                alunos.forEach((evaluated) => {
                    evaluationCounts[evaluator.id][evaluated.id] = 0;
                    evaluationSums[evaluator.id][evaluated.id] = 0;
                });
            });

            // Sum up all evaluations
            avaliacoes.forEach((avaliacao) => {
                if (
                    avaliacao.aluno_avaliador?.id &&
                    avaliacao.aluno_avaliado?.id
                ) {
                    const sum =
                        MediaCalculator.calculateRawSumFromAvaliacao(avaliacao);

                    if (evaluationSums[avaliacao.aluno_avaliador.id]) {
                        evaluationSums[avaliacao.aluno_avaliador.id][
                            avaliacao.aluno_avaliado.id
                        ] += sum;
                        evaluationCounts[avaliacao.aluno_avaliador.id][
                            avaliacao.aluno_avaliado.id
                        ]++;
                    }
                }
            });

            // Calculate averages
            alunos.forEach((evaluator) => {
                alunos.forEach((evaluated) => {
                    const count = evaluationCounts[evaluator.id][evaluated.id];
                    const sum = evaluationSums[evaluator.id][evaluated.id];

                    if (count > 0) {
                        evaluationMatrix[evaluator.id][evaluated.id] = Number(
                            (sum / count).toFixed(2),
                        );
                    }
                });
            });
        } else {
            // Single problem - use original logic
            avaliacoes.forEach((avaliacao, index) => {
                if (
                    avaliacao.aluno_avaliador?.id &&
                    avaliacao.aluno_avaliado?.id
                ) {
                    const sum =
                        MediaCalculator.calculateRawSumFromAvaliacao(avaliacao);
                    /* console.log(
                        `Evaluation ${index}: ${avaliacao.aluno_avaliador.id} -> ${avaliacao.aluno_avaliado.id} = ${sum}`,
                    ); */

                    // Check if evaluator exists in matrix
                    if (evaluationMatrix[avaliacao.aluno_avaliador.id]) {
                        evaluationMatrix[avaliacao.aluno_avaliador.id][
                            avaliacao.aluno_avaliado.id
                        ] = sum;
                    } else {
                        console.warn(
                            `Evaluator ID not found in matrix: evaluator=${avaliacao.aluno_avaliador.id}`,
                        );
                    }
                }
            });
        }

        console.log("Final evaluation matrix:", evaluationMatrix);
    }

    async function handleTurmaSelect(event: CustomEvent) {
        const turmaId = event.detail;

        if (turmaId) {
            selectedTurma = turmas.find((t) => t.id_turma === turmaId) || null;
            selectedProblema = null;
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

    async function handleProblemaSelect(event: CustomEvent) {
        const problemaId = event.detail;

        if (problemaId === -1) {
            // Handle average of all problems
            selectedProblema = {
                id_problema: -1,
                nome_problema: "Média de Todos os Problemas",
                media_geral: null,
                id_turma: selectedTurma?.id_turma || 0,
                created_at: new Date(),
                turma: selectedTurma,
                criterios: {},
                definicao_arquivos_de_avaliacao: [],
                data_e_hora_criterios_e_arquivos: {},
                faltas_por_tag: {},
            } as ProblemaModel;
            await fetchAllProblemsAvaliacoes();
            console.log(
                "fetchAllProblemsAvaliacoes - selectedProblema:",
                selectedProblema,
            );
        } else if (problemaId) {
            selectedProblema =
                problemas.find((p) => p.id_problema === problemaId) || null;
            if (selectedProblema) {
                await fetchAvaliacoes(problemaId);
            }
        } else {
            selectedProblema = null;
            avaliacoes = [];
            evaluationMatrix = {};
        }
    }

    async function handleProfessorSelect(event: CustomEvent) {
        const professorId = event.detail;
        selectedProfessorId = professorId;

        // Reset selections when professor changes
        selectedTurma = null;
        selectedProblema = null;
        problemas = [];
        avaliacoes = [];
        evaluationMatrix = {};

        // Clear caches when switching professors
        avaliacoesCache = {};

        // Fetch turmas for the selected professor
        await fetchTurmas();
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

                // Fetch professores if user is coordenador
                if (isCoordenador(user)) {
                    fetchProfessores();
                }
            }
        });

        // Add keyboard shortcuts for zoom
        function handleKeydown(event: KeyboardEvent) {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case "=":
                    case "+":
                        event.preventDefault();
                        if (zoomLevel < 1.5) {
                            zoomLevel = Math.min(1.5, zoomLevel + 0.05);
                        }
                        break;
                    case "-":
                        event.preventDefault();
                        if (zoomLevel > 0.5) {
                            zoomLevel = Math.max(0.5, zoomLevel - 0.05);
                        }
                        break;
                    case "0":
                        event.preventDefault();
                        zoomLevel = 1;
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

        const average =
            receivedGrades.length > 0
                ? Number(
                      (
                          receivedGrades.reduce((a, b) => a + b, 0) /
                          receivedGrades.length
                      ).toFixed(2),
                  )
                : 0;

        return formatGrade(average);
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
            maiorNota: formatGrade(Number(maiorNota.toFixed(2))),
            mediaGeral: formatGrade(mediaGeral),
            menorNota: formatGrade(Number(menorNota.toFixed(2))),
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
    // $: if (evaluationMatrix && alunos) {
    //     console.log("Reactive update triggered - matrix and alunos changed");
    //     console.log("Current matrix:", evaluationMatrix);
    //     console.log("Current alunos:", alunos);
    //     console.log("Current alunos type:", typeof alunos);
    //     console.log("Current alunos isArray:", Array.isArray(alunos));
    // }

    // Make statistics reactive to evaluationMatrix and alunos changes, but not zoom changes
    $: statistics =
        selectedProblema && alunos.length > 0
            ? getMatrixStatistics(evaluationMatrix, alunos)
            : {
                  totalAlunos: 0,
                  maiorNota: 0,
                  mediaGeral: 0,
                  menorNota: 0,
              };

    // Make zoom styles reactive to zoomLevel changes
    $: zoomStyles = {
        fontSize: `${(0.95 * zoomLevel).toFixed(2)}rem`,
        cellHeight: `${Math.round(50 * zoomLevel)}px`,
        cellWidth: `${Math.round(60 * zoomLevel)}px`,
        nameWidth: `${Math.round(120 * zoomLevel)}px`,
        numberWidth: `${Math.round(50 * zoomLevel)}px`,
        finalMediaWidth: `${Math.round(70 * zoomLevel)}px`,
        padding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
        headerPadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.5 * zoomLevel)}rem`,
        namePadding: `${Math.round(0.75 * zoomLevel)}rem ${Math.round(0.75 * zoomLevel)}rem`,
        numberLeft: `${Math.round(120 * zoomLevel)}px`,
    };
    // $: console.log("Zoom styles updated:", zoomStyles);

    // 1. Add a derived variable for professor evaluations and a helper to get professor's grade for each student

    $: professor =
        selectedProfessorId && $currentUser && isCoordenador($currentUser)
            ? professores.find((p) => p.id === selectedProfessorId) ||
              selectedTurma?.professor
            : selectedTurma?.professor;
    $: professorAvaliacao = Array.isArray(avaliacoes)
        ? avaliacoes.filter((a) => {
              // If coordenador has selected a specific professor, filter by that professor
              if (
                  selectedProfessorId &&
                  $currentUser &&
                  isCoordenador($currentUser)
              ) {
                  return a.id_professor === selectedProfessorId;
              }
              // Otherwise, show evaluations from the turma's professor
              return a.id_professor;
          })
        : [];

    function getProfessorGradeFor(studentId: number): number | null {
        console.log("Professor avaliações:", professorAvaliacao);
        const avaliacao = professorAvaliacao.find(
            (a) => a.aluno_avaliado?.id === studentId,
        );
        if (!avaliacao) return null;
        const sum = MediaCalculator.calculateRawSumFromAvaliacao(avaliacao);
        console.log("Avaliação do professor:", avaliacao);
        return formatGrade(sum);
    }

    // CSV Export
    function exportMatrixAsCSV() {
        if (!alunos.length || !Object.keys(evaluationMatrix).length) return;

        const isAllProblems = selectedProblema?.id_problema === -1;
        const title = isAllProblems
            ? "Média de Todos os Problemas"
            : selectedProblema?.nome_problema || "matriz";

        let csv = "Aluno,Número,Prof.,Auto,Pares,Total";
        alunos.forEach((aluno, idx) => {
            csv += `,${idx + 1}`;
        });
        csv += "\n";
        alunos.forEach((evaluator, evaluatorIdx) => {
            const finalMedia = getFinalMediaForStudent(evaluator.id);
            const row = [
                `"${evaluator.nome_completo?.split(" ").slice(0, 2).join(" ") || "N/A"}"`,
                evaluatorIdx + 1,
                finalMedia.professor || "-",
                finalMedia.auto || "-",
                finalMedia.peers || "-",
                finalMedia.total || "-",
            ];
            alunos.forEach((evaluated) => {
                if (evaluator.id === evaluated.id) {
                    row.push("X");
                } else {
                    const grade =
                        evaluationMatrix[evaluator.id]?.[evaluated.id];
                    row.push(grade && grade > 0 ? formatGrade(grade) : "-");
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
                "-",
                "-",
                "-",
            ];
            alunos.forEach((evaluated) => {
                if (professor.id === evaluated.id) {
                    row.push("X");
                } else {
                    const grade = getProfessorGradeFor(evaluated.id);
                    row.push(grade !== null ? grade.toString() : "-");
                }
            });
            csv += row.join(",") + "\n";
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `relatorio_${title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // PDF Export using pdf-lib
    async function exportMatrixAsPDF() {
        await PDFExportUtils.exportMatrixAsPDF(
            alunos,
            evaluationMatrix,
            selectedProblema,
            professor,
            getFinalMediaForStudent,
            getProfessorGradeFor,
            formatGrade,
        );
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

        if (selectedProblema.id_problema === -1) {
            // Show average across all problems
            details +=
                "📊 <strong>Média de todos os problemas:</strong><br><br>";

            const problemEvaluations: {
                [problemaId: number]: { nota: number; problemaNome: string };
            } = {};

            // Group evaluations by problem
            avaliacoes.forEach((avaliacao) => {
                if (
                    avaliacao.aluno_avaliador?.id === evaluatorId &&
                    avaliacao.aluno_avaliado?.id === evaluatedId &&
                    avaliacao.id_problema
                ) {
                    const problema = problemas.find(
                        (p) => p.id_problema === avaliacao.id_problema,
                    );
                    if (problema) {
                        const sum =
                            MediaCalculator.calculateRawSumFromAvaliacao(
                                avaliacao,
                            );
                        problemEvaluations[avaliacao.id_problema] = {
                            nota: sum,
                            problemaNome:
                                problema.nome_problema ||
                                "Problema desconhecido",
                        };
                    }
                }
            });

            if (Object.keys(problemEvaluations).length === 0) {
                details += "❌ <strong>Nenhuma avaliação encontrada</strong>";
            } else {
                Object.entries(problemEvaluations).forEach(
                    ([problemaId, data]) => {
                        details += `• <strong>${data.problemaNome}:</strong> ${formatGrade(data.nota).toFixed(2)}<br>`;
                    },
                );

                const average =
                    Object.values(problemEvaluations).reduce(
                        (sum, data) => sum + data.nota,
                        0,
                    ) / Object.values(problemEvaluations).length;
                details += `<br><strong>Média final: ${formatGrade(average).toFixed(2)}</strong>`;
            }
        } else {
            // Single problem - use original logic
            // Get the specific evaluation
            const evaluation = avaliacoes.find(
                (av) =>
                    av.aluno_avaliador?.id === evaluatorId &&
                    av.aluno_avaliado?.id === evaluatedId,
            );

            if (!evaluation) {
                details += "❌ <strong>Avaliação não enviada</strong>";
                return details;
            }

            try {
                const notas = evaluation.notas;
                details += "📊 <strong>Detalhes da avaliação:</strong><br>";

                Object.entries(notas).forEach(([tag, criterios]) => {
                    if (typeof criterios === "object" && criterios !== null) {
                        details += `<br><strong>${tag}:</strong><br>`;
                        Object.entries(criterios).forEach(
                            ([criterio, nota]) => {
                                if (typeof nota === "number") {
                                    details += `  • ${criterio}: ${formatGrade(nota).toFixed(1)}<br>`;
                                }
                            },
                        );
                    }
                });

                // Add sum
                const sum =
                    MediaCalculator.calculateRawSumFromAvaliacao(evaluation);
                details += `<br><strong>Soma final: ${formatGrade(sum).toFixed(2)}</strong>`;
            } catch (error) {
                details += "❌ <strong>Erro ao processar avaliação</strong>";
            }
        }

        return details;
    }

    // Helper to get falta information for tooltips
    function getFaltaInfo(studentId: number): string {
        if (!selectedProblema || !selectedProblema.faltas_por_tag) return "";

        try {
            const faltasPorTag = selectedProblema.faltas_por_tag;
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
            const faltasPorTag = selectedProblema.faltas_por_tag;
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

    // Helper function to clear all caches (useful for debugging or manual refresh)
    function clearAllCaches() {
        console.log("Clearing all caches");
        problemasCache = {};
        avaliacoesCache = {};
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
            <p>Carregando turmas...</p>
        </div>
    {:else if loadingProblemas}
        <div class="loading">
            <LoadingSpinner />
            <p>Carregando problemas...</p>
        </div>
    {:else if loadingAvaliacoes}
        <div class="loading">
            <LoadingSpinner />
            <p>Carregando avaliações...</p>
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
        <RelatoriosFilters
            {turmas}
            {selectedTurma}
            {problemas}
            {selectedProblema}
            {professores}
            {selectedProfessorId}
            isCoordenador={$currentUser ? isCoordenador($currentUser) : false}
            on:turmaSelect={handleTurmaSelect}
            on:problemaSelect={handleProblemaSelect}
            on:professorSelect={handleProfessorSelect}
        />

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
                <p>
                    <strong>Cache Status:</strong>
                    Problemas: {Object.keys(problemasCache).length} turmas,
                    Avaliacoes: {Object.keys(avaliacoesCache).length} problemas
                </p>
            </div>
        {/if} -->

        <!-- Evaluation Matrix -->
        {#if selectedTurma && !selectedProblema}
            <div class="no-problema-selected">
                <p>Selecione um problema para visualizar as avaliações</p>
            </div>
        {:else if selectedProblema && alunos.length > 0}
            <ExportControls
                on:exportCSV={exportMatrixAsCSV}
                on:exportPDF={exportMatrixAsPDF}
            />
            <div class="matrix-section">
                <h2>Matriz de Avaliações - {selectedProblema.nome_problema}</h2>
                <p class="matrix-subtitle">
                    Linhas: Quem avaliou | Colunas: Quem foi avaliado (por
                    número)
                    {#if selectedProblema.id_problema === -1}
                        <br /><span style="color: #6c63ff; font-weight: 600;"
                            >📊 Mostrando média de todos os problemas da turma</span
                        >
                    {/if}
                </p>

                <!-- Matrix Controls -->
                <MatrixControls
                    {scaleFormat}
                    {zoomLevel}
                    on:scaleChange={(e) => (scaleFormat = e.detail)}
                    on:zoomChange={(e) => (zoomLevel = e.detail)}
                />

                <!-- Statistics Header -->
                <StatisticsHeader {statistics} />

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

                                    <!-- New columns for final media calculation -->
                                    <th
                                        class="final-media-header"
                                        style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        title="Nota do Professor (10 pontos)"
                                        >Prof.</th
                                    >
                                    <th
                                        class="final-media-header"
                                        style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        title="Auto Avaliação (10 pontos)"
                                        >Auto</th
                                    >
                                    <th
                                        class="final-media-header"
                                        style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        title="Avaliação dos Pares (10 pontos)"
                                        >Pares</th
                                    >
                                    <th
                                        class="final-media-header"
                                        style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                        title="Total Final (30 pontos)"
                                        >Total</th
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
                                    {@const finalMedia =
                                        getFinalMediaForStudent(evaluator.id)}
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

                                        <!-- New columns for final media calculation -->
                                        <td
                                            class="final-media-cell"
                                            style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                            title="Nota do Professor (10 pontos)"
                                        >
                                            {finalMedia.professor || "-"}
                                        </td>
                                        <td
                                            class="final-media-cell"
                                            style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                            title="Auto Avaliação (10 pontos)"
                                        >
                                            {finalMedia.auto || "-"}
                                        </td>
                                        <td
                                            class="final-media-cell"
                                            style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                            title="Avaliação dos Pares (10 pontos)"
                                        >
                                            {finalMedia.peers || "-"}
                                        </td>
                                        <td
                                            class="final-media-cell"
                                            style="min-width: {zoomStyles.finalMediaWidth}; max-width: {zoomStyles.finalMediaWidth}; padding: {zoomStyles.headerPadding}; height: {zoomStyles.cellHeight}; font-size: {zoomStyles.fontSize};"
                                            title="Total Final (30 pontos)"
                                        >
                                            {finalMedia.total || "-"}
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
                                                            >{formatGrade(
                                                                grade,
                                                            )}</span
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
                                                    }}>{formatGrade(grade)}</td
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
                            </tbody>
                        </table>
                    </div>
                </div>

                <MatrixLegend />
            </div>
        {/if}

        <EmptyStates {turmas} {selectedTurma} {problemas} {loading} />
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

    .no-problema-selected {
        text-align: center;
        padding: 3rem 2rem;
        background: #f8f9fa;
        color: #6c757d;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
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

    .final-media-header,
    .final-media-cell {
        background: #f0f4ff !important;
        font-weight: 600;
        color: #4a5568;
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

        .matrix-container {
            font-size: 0.9rem;
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

        .matrix-section {
            padding: 0.1rem 0.02rem;
        }
    }
</style>
