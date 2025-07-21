<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type {
        ProblemaModel,
        AlunoModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import type { Column } from "$lib/interfaces/column";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { AlunosService } from "$lib/services/alunos_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import Pagination from "$lib/components/Pagination.svelte";

    let problema: ProblemaModel | null = null;
    let aluno: AlunoModel | null = null;
    let turma: TurmaModel | null = null;
    let avaliacoesMap: Map<number, any> = new Map();
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;

    // Table configuration
    let columns: Column[] = [
        {
            key: "aluno",
            label: "Aluno Avaliado",
            width: "50%",
        },
        {
            key: "notas",
            label: "Notas (C/H/A)",
            width: "25%",
        },
        {
            key: "actions",
            label: "Ações",
            width: "25%",
            render: (row: any) => ({
                component: "button",
                props: {
                    variant: row.isEvaluated ? "secondary" : "primary",
                    text: row.isEvaluated ? "Editar Avaliação" : "Avaliar",
                    onClick: () => handleAvaliarAluno(row.id),
                },
            }),
        },
    ];

    let tableRows: any[] = [];

    onMount(async () => {
        try {
            const { id_problema, id_aluno, id } = $page.params;
            logger.info(
                `Loading aluno details for id_aluno: ${id_aluno}, problema: ${id_problema}, turma: ${id}`,
            );

            // Get problema, aluno, turma and all avaliações data for the problema using cache services
            logger.info(
                "Fetching problema, aluno, turma, and all avaliações data...",
            );
            const [problemaData, alunoData, turmaData, avaliacoesData] =
                await Promise.all([
                    ProblemasService.getById(id_problema),
                    AlunosService.getById(id_aluno),
                    TurmasService.getById(id),
                    AvaliacoesService.getByProblema(id_problema),
                ]);

            logger.info("Data fetched successfully", {
                problemaData: !!problemaData,
                alunoData: !!alunoData,
                turmaData: !!turmaData,
                avaliacoesCount: avaliacoesData?.length || 0,
            });

            problema = problemaData;
            aluno = alunoData;
            turma = turmaData;

            logger.info("Data parsed successfully", {
                problema: problema?.nome_problema,
                aluno: aluno?.nome_completo,
                turma: turma?.nome_turma,
            });

            // Filter evaluations where the specified aluno is the evaluator (avaliador)
            const currentAlunoId = Number($page.params.id_aluno);
            const filteredAvaliacoesData = avaliacoesData.filter(
                (av: any) => av.id_aluno_avaliador === currentAlunoId,
            );

            // Create a map of avaliacoes by aluno_avaliado (including self-evaluations)
            filteredAvaliacoesData.forEach((av: any) => {
                avaliacoesMap.set(av.id_aluno_avaliado, av);
            });

            logger.info(
                `Processed ${avaliacoesMap.size} avaliações for display`,
            );

            // Force Svelte to recognize the map update
            avaliacoesMap = new Map(avaliacoesMap);
        } catch (e: any) {
            logger.error("Error loading aluno details:", e);
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
            logger.info("Loading completed");
        }
    });

    function formatNotas(notas: string | null) {
        if (!notas) return "Não avaliado";
        try {
            const notasObj = JSON.parse(notas);
            logger.debug(`Parsing notas:`, notasObj);

            // Handle nested structure with categories
            let competencia = 0;
            let habilidade = 0;
            let atitude = 0;
            let count = 0;

            // Iterate through all categories in the notas
            Object.values(notasObj).forEach((categoria: any) => {
                if (typeof categoria === "object" && categoria !== null) {
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

            const formattedNotas = `(${competencia.toFixed(2)}, ${habilidade.toFixed(2)}, ${atitude.toFixed(2)})`;
            logger.debug(`Formatted notas: ${formattedNotas}`);
            return formattedNotas;
        } catch (error) {
            logger.warn(`Failed to parse notas:`, notas, error);
            return "Erro ao processar notas";
        }
    }

    async function handleAvaliarAluno(id_aluno_avaliado: number) {
        // This will be implemented in another task
        console.log("Avaliar aluno clicked", id_aluno_avaliado);
    }

    // Show all students in the turma, with evaluation status
    $: alunosDaTurma = turma?.alunos || [];
    $: currentAlunoId = Number($page.params.id_aluno);

    // Get all students that the current aluno has evaluated
    $: evaluatedStudentIds = Array.from(avaliacoesMap.keys());

    // Show all students in the turma
    $: filteredAlunos = alunosDaTurma;

    $: totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
    $: paginatedAlunos = filteredAlunos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Transform data for Table component
    $: tableRows = paginatedAlunos.map((alunoAvaliado) => {
        const isSelfEvaluation =
            alunoAvaliado.id === Number($page.params.id_aluno);
        const isEvaluated = avaliacoesMap.has(alunoAvaliado.id);
        const notas = formatNotas(
            avaliacoesMap.get(alunoAvaliado.id)?.notas || null,
        );

        return {
            id: alunoAvaliado.id,
            aluno: isSelfEvaluation
                ? `${alunoAvaliado.nome_completo || "Nome não disponível"} (Auto-avaliação)`
                : alunoAvaliado.nome_completo || "Nome não disponível",
            notas: notas,
            notasClass: !isEvaluated ? "nao-avaliado" : "",
            isEvaluated: isEvaluated,
            isSelfEvaluation: isSelfEvaluation,
            rowClass: isSelfEvaluation ? "self-evaluation" : "",
            // For actions column - will be handled by custom rendering
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
            <BackButton text="Voltar" on:click={() => history.back()} />
            <div class="header">
                <h1>Avaliações de {aluno?.nome_completo || ""}</h1>
                <div class="problema-info">
                    <span class="problema-title"
                        >{problema?.nome_problema || ""}</span
                    >
                </div>
            </div>

            <div class="avaliacoes-section">
                <h2>Avaliações do Aluno</h2>

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
