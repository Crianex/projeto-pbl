<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/utils/api";
    import type {
        AlunoModel,
        ProblemaModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";

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

    onMount(async () => {
        try {
            const { id_problema, id } = $page.params;

            // Get both problema and turma data
            const [problemaData, turmaData] = await Promise.all([
                api.get(`/problemas/get?id_problema=${id_problema}`),
                api.get(`/turmas/get?id_turma=${id}`),
            ]);

            problema = Parsers.parseProblema(problemaData);
            turma = Parsers.parseTurma(turmaData);

            if (!turma?.alunos) {
                throw new Error("Não há alunos nesta turma");
            }

            // Get avaliações for each aluno
            const avaliacoesPromises = turma.alunos.map(async (aluno) => {
                try {
                    const avaliacoes = await api.get(
                        `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${aluno.id}`,
                    );
                    const mediaNotas = calcularMedia(avaliacoes);
                    return {
                        ...aluno,
                        mediaNotas,
                    };
                } catch (e) {
                    // If there's an error getting avaliacoes, return aluno with zero grades
                    return {
                        ...aluno,
                        mediaNotas: null,
                    };
                }
            });

            alunos = await Promise.all(avaliacoesPromises);
        } catch (e: any) {
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
        }
    });

    function calcularMedia(avaliacoes: any[]) {
        if (!avaliacoes.length) return null;

        // Separate received and sent evaluations
        const avaliacoesRecebidas = avaliacoes.filter(
            (av) => av.id_aluno_avaliado === av.id_aluno,
        );

        if (!avaliacoesRecebidas.length) return null;

        const soma = avaliacoesRecebidas.reduce(
            (acc, av) => {
                try {
                    const notas = JSON.parse(av.notas);
                    return {
                        competencia: acc.competencia + (notas.competencia || 0),
                        habilidade: acc.habilidade + (notas.habilidade || 0),
                        atitude: acc.atitude + (notas.atitude || 0),
                    };
                } catch {
                    return acc;
                }
            },
            { competencia: 0, habilidade: 0, atitude: 0 },
        );

        return {
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
    }

    function formatMedia(media: AlunoComMedia["mediaNotas"]) {
        if (!media) return "Não avaliado";
        return `(${media.competencia}, ${media.habilidade}, ${media.atitude})`;
    }

    function verDetalhes(id_aluno: string) {
        goto(`${$page.url.pathname}/${id_aluno}`);
    }

    $: totalPages = Math.ceil(alunos.length / itemsPerPage);
    $: paginatedAlunos = alunos.slice(
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
                <h1>Alunos - {problema?.nome_problema || ""}</h1>
            </div>

            <div class="alunos-section">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Média (C/H/A)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each paginatedAlunos as aluno}
                                <tr>
                                    <td class="aluno-cell">
                                        <span
                                            >{aluno.nome_completo ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                    <td class:nao-avaliado={!aluno.mediaNotas}
                                        >{formatMedia(aluno.mediaNotas)}</td
                                    >
                                    <td>
                                        <Button
                                            variant="secondary"
                                            on:click={() =>
                                                verDetalhes(
                                                    aluno.id.toString(),
                                                )}
                                        >
                                            Ver Detalhes
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

    .alunos-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
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

    .nao-avaliado {
        color: #6c757d;
        font-style: italic;
    }
</style>
