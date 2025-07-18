<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import type {
        ProblemaModel,
        AlunoModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";

    let problema: ProblemaModel | null = null;
    let aluno: AlunoModel | null = null;
    let turma: TurmaModel | null = null;
    let avaliacoesMap: Map<number, any> = new Map();
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;

    onMount(async () => {
        try {
            const { id_problema, id_aluno, id } = $page.params;

            // Get problema, aluno, turma and avaliações data
            const [problemaData, alunoData, turmaData, avaliacoesData] =
                await Promise.all([
                    api.get(`/problemas/get?id_problema=${id_problema}`),
                    api.get(`/alunos/get?id_aluno=${id_aluno}`),
                    api.get(`/turmas/get?id_turma=${id}`),
                    api.get(
                        `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${id_aluno}`,
                    ),
                ]);

            problema = Parsers.parseProblema(problemaData);
            aluno = Parsers.parseAluno(alunoData);
            turma = Parsers.parseTurma(turmaData);

            // Create a map of avaliacoes by aluno_avaliado
            avaliacoesData.forEach((av: any) => {
                if (av.id_aluno_avaliador === id_aluno) {
                    avaliacoesMap.set(av.id_aluno_avaliado, av);
                }
            });

            // Force Svelte to recognize the map update
            avaliacoesMap = new Map(avaliacoesMap);
        } catch (e: any) {
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
        }
    });

    function formatNotas(notas: string | null) {
        if (!notas) return "Não avaliado";
        try {
            const { competencia, habilidade, atitude } = JSON.parse(notas);
            return `(${competencia}/1, ${habilidade}/1, ${atitude}/1)`;
        } catch {
            return "Não avaliado";
        }
    }

    async function handleAvaliarAluno(id_aluno_avaliado: number) {
        // This will be implemented in another task
        console.log("Avaliar aluno clicked", id_aluno_avaliado);
    }

    $: alunosDaTurma =
        turma?.alunos?.filter((a) => a.id !== Number($page.params.id_aluno)) ||
        [];
    $: totalPages = Math.ceil(alunosDaTurma.length / itemsPerPage);
    $: paginatedAlunos = alunosDaTurma.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
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
            <div class="header">
                <h1>Avaliações de {aluno?.nome_completo || ""}</h1>
                <div class="problema-info">
                    <span class="problema-title"
                        >{problema?.nome_problema || ""}</span
                    >
                </div>
            </div>

            <div class="avaliacoes-section">
                <h2>Avaliações Enviadas aos Colegas</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Notas (C/H/A)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each paginatedAlunos as alunoAvaliado}
                                <tr>
                                    <td class="aluno-cell">
                                        <span
                                            >{alunoAvaliado.nome_completo ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                    <td
                                        class:nao-avaliado={!avaliacoesMap.has(
                                            alunoAvaliado.id,
                                        )}
                                    >
                                        {formatNotas(
                                            avaliacoesMap.get(alunoAvaliado.id)
                                                ?.notas || null,
                                        )}
                                    </td>
                                    <td>
                                        <Button
                                            variant={avaliacoesMap.has(
                                                alunoAvaliado.id,
                                            )
                                                ? "secondary"
                                                : "primary"}
                                            on:click={() =>
                                                handleAvaliarAluno(
                                                    alunoAvaliado.id,
                                                )}
                                        >
                                            {avaliacoesMap.has(alunoAvaliado.id)
                                                ? "Editar Avaliação"
                                                : "Avaliar"}
                                        </Button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
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

    .problema-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .problema-title {
        font-size: 1rem;
        color: #6c757d;
    }

    .avaliacoes-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .avaliacoes-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: #333;
    }

    .table-container {
        width: 100%;
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        text-align: left;
        padding: 1rem;
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
    }

    td {
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .aluno-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .nao-avaliado {
        color: #6c757d;
        font-style: italic;
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
