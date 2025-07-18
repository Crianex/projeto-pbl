<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import type { ProblemaModel, AlunoModel } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";

    let problema: ProblemaModel | null = null;
    let aluno: AlunoModel | null = null;
    let avaliacoesEnviadas: any[] = [];
    let avaliacoesRecebidas: any[] = [];
    let loading = true;
    let error: string | null = null;
    let currentPageEnviadas = 1;
    let currentPageRecebidas = 1;
    let itemsPerPage = 5;

    onMount(async () => {
        try {
            const { id_problema, id_aluno } = $page.params;

            // Get problema, aluno and avaliações data
            const [problemaData, alunoData, avaliacoesData] = await Promise.all(
                [
                    api.get(`/problemas/get?id_problema=${id_problema}`),
                    api.get(`/alunos/get?id_aluno=${id_aluno}`),
                    api.get(
                        `/avaliacoes/list?id_problema=${id_problema}&id_aluno=${id_aluno}`,
                    ),
                ],
            );

            problema = Parsers.parseProblema(problemaData);
            aluno = Parsers.parseAluno(alunoData);

            // Separate avaliacoes into enviadas and recebidas
            avaliacoesEnviadas = avaliacoesData.filter(
                (av: any) => av.id_aluno_avaliador === id_aluno,
            );
            avaliacoesRecebidas = avaliacoesData.filter(
                (av: any) => av.id_aluno_avaliado === id_aluno,
            );
        } catch (e: any) {
            error = e.message || "Erro ao carregar as avaliações";
        } finally {
            loading = false;
        }
    });

    function formatNotas(notas: string) {
        try {
            const { competencia, habilidade, atitude } = JSON.parse(notas);
            return `(${competencia}/1, ${habilidade}/1, ${atitude}/1)`;
        } catch {
            return "(0/1, 0/1, 0/1)";
        }
    }

    async function handleAvaliarAluno() {
        // This will be implemented in another task
        console.log("Avaliar aluno clicked");
    }

    $: totalPagesEnviadas = Math.ceil(avaliacoesEnviadas.length / itemsPerPage);
    $: totalPagesRecebidas = Math.ceil(
        avaliacoesRecebidas.length / itemsPerPage,
    );
    $: paginatedEnviadas = avaliacoesEnviadas.slice(
        (currentPageEnviadas - 1) * itemsPerPage,
        currentPageEnviadas * itemsPerPage,
    );
    $: paginatedRecebidas = avaliacoesRecebidas.slice(
        (currentPageRecebidas - 1) * itemsPerPage,
        currentPageRecebidas * itemsPerPage,
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
                <h1>Avaliações do Aluno</h1>
            </div>

            <div class="avaliacoes-section">
                <h2>Avaliações Enviadas</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Notas (C/H/A)</th>
                                <th>Enviada para</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each paginatedEnviadas as avaliacao}
                                <tr>
                                    <td class="aluno-cell">
                                        <img
                                            src={avaliacao.aluno?.avatar || ""}
                                            alt=""
                                            class="avatar"
                                        />
                                        <span
                                            >{avaliacao.aluno?.nome ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                    <td>{formatNotas(avaliacao.notas)}</td>
                                    <td class="aluno-cell">
                                        <img
                                            src={avaliacao.enviada_para
                                                ?.avatar || ""}
                                            alt=""
                                            class="avatar"
                                        />
                                        <span
                                            >{avaliacao.enviada_para?.nome ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <button
                        class="page-nav"
                        disabled={currentPageEnviadas === 1}
                        on:click={() => currentPageEnviadas--}
                    >
                        &lt;
                    </button>
                    <span class="page-number active">{currentPageEnviadas}</span
                    >
                    {#if currentPageEnviadas < totalPagesEnviadas}
                        <span class="page-number"
                            >{currentPageEnviadas + 1}</span
                        >
                    {/if}
                    <button
                        class="page-nav"
                        disabled={currentPageEnviadas === totalPagesEnviadas}
                        on:click={() => currentPageEnviadas++}
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div class="avaliacoes-section">
                <h2>Avaliações Recebidas</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Notas (C/H/A)</th>
                                <th>Enviada para</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each paginatedRecebidas as avaliacao}
                                <tr>
                                    <td class="aluno-cell">
                                        <img
                                            src={avaliacao.aluno?.avatar || ""}
                                            alt=""
                                            class="avatar"
                                        />
                                        <span
                                            >{avaliacao.aluno?.nome ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                    <td>{formatNotas(avaliacao.notas)}</td>
                                    <td class="aluno-cell">
                                        <img
                                            src={avaliacao.enviada_para
                                                ?.avatar || ""}
                                            alt=""
                                            class="avatar"
                                        />
                                        <span
                                            >{avaliacao.enviada_para?.nome ||
                                                "Nome não disponível"}</span
                                        >
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <button
                        class="page-nav"
                        disabled={currentPageRecebidas === 1}
                        on:click={() => currentPageRecebidas--}
                    >
                        &lt;
                    </button>
                    <span class="page-number active"
                        >{currentPageRecebidas}</span
                    >
                    {#if currentPageRecebidas < totalPagesRecebidas}
                        <span class="page-number"
                            >{currentPageRecebidas + 1}</span
                        >
                    {/if}
                    <button
                        class="page-nav"
                        disabled={currentPageRecebidas === totalPagesRecebidas}
                        on:click={() => currentPageRecebidas++}
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div class="actions">
                <Button variant="primary" on:click={handleAvaliarAluno}
                    >Avaliar Aluno</Button
                >
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

    .actions {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
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
