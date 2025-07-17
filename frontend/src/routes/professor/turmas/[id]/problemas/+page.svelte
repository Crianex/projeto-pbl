<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import Dialog from "$lib/components/Dialog.svelte";

    const turmaId = $page.params.id;

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let problemas: Array<{
        id_problema: number;
        nome_problema: string;
        data_inicio: string;
        data_fim: string;
        media_geral: number;
    }> = [];
    let loading = true;
    let error: string | null = null;
    let deleteConfirmOpen = false;
    let problemaToDelete: any = null;

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Fetch turma details
            const turmaData = await api.get(`/turmas/get?id=${turmaId}`);
            turma = {
                nome_turma: turmaData.nome_turma,
                id_professor: turmaData.id_professor,
            };

            // Fetch problemas for this turma
            const problemasData = await api.get(`/problemas/list`);
            problemas = problemasData.filter(
                (p: any) => p.id_turma === parseInt(turmaId),
            );
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to fetch data";
            console.error("Error fetching data:", err);
        } finally {
            loading = false;
        }
    }

    async function handleCreateProblema() {
        await goto(`/professor/turmas/${turmaId}/problemas/novo`);
    }

    async function handleDeleteProblema() {
        if (!problemaToDelete) return;

        try {
            loading = true;
            await api.delete(
                `/problemas/delete?id=${problemaToDelete.id_problema}`,
            );
            await fetchData();
            closeDeleteConfirm();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to delete problema";
            console.error("Error deleting problema:", err);
        } finally {
            loading = false;
        }
    }

    function openDeleteConfirm(problema: any) {
        problemaToDelete = problema;
        deleteConfirmOpen = true;
    }

    function closeDeleteConfirm() {
        deleteConfirmOpen = false;
        problemaToDelete = null;
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("pt-BR");
    }

    onMount(fetchData);
</script>

<div class="container">
    <div class="header">
        <div class="title-section">
            <a href="/professor/turmas" class="back-link">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M19 12H5M12 19l-7-7 7-7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                Voltar para turmas
            </a>
            <h1>Problemas - {turma.nome_turma}</h1>
        </div>
        <Button variant="primary" on:click={handleCreateProblema}>
            + Criar problema
        </Button>
    </div>

    {#if loading}
        <div class="loading">Carregando problemas...</div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={fetchData}
                >Tentar novamente</Button
            >
        </div>
    {:else if problemas.length === 0}
        <div class="empty-state">
            <p>Nenhum problema encontrado para esta turma.</p>
            <Button variant="primary" on:click={handleCreateProblema}>
                Criar primeiro problema
            </Button>
        </div>
    {:else}
        <div class="problemas-list">
            {#each problemas as problema (problema.id_problema)}
                <div class="problema-item">
                    <div class="problema-info">
                        <h3>{problema.nome_problema}</h3>
                        <div class="problema-details">
                            <span
                                >Período: {formatDate(problema.data_inicio)} - {formatDate(
                                    problema.data_fim,
                                )}</span
                            >
                            <span
                                >Média geral: {problema.media_geral.toFixed(
                                    2,
                                )}</span
                            >
                        </div>
                    </div>
                    <div class="actions">
                        <Button
                            variant="secondary"
                            on:click={() =>
                                goto(
                                    `/professor/turmas/${turmaId}/problemas/${problema.id_problema}`,
                                )}
                        >
                            Ver detalhes
                        </Button>
                        <button
                            class="delete-button"
                            on:click={() => openDeleteConfirm(problema)}
                            title="Excluir problema"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<Dialog open={deleteConfirmOpen} on:close={closeDeleteConfirm}>
    <svelte:fragment slot="header">
        <h2>Confirmar exclusão</h2>
    </svelte:fragment>
    <div class="delete-confirm-content">
        <p>
            Tem certeza que deseja excluir o problema "{problemaToDelete?.nome_problema}"?
        </p>
        <p class="warning">
            Esta ação não pode ser desfeita e todos os dados do problema serão
            perdidos.
        </p>
        <div class="dialog-actions">
            <Button variant="secondary" on:click={closeDeleteConfirm}>
                Cancelar
            </Button>
            <Button variant="danger" on:click={handleDeleteProblema}>
                Excluir problema
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        text-decoration: none;
        font-size: 0.875rem;
    }

    .back-link:hover {
        color: #0d6efd;
    }

    .header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
    }

    .problemas-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .problema-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .problema-info h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }

    .problema-details {
        display: flex;
        gap: 1.5rem;
        color: #6c757d;
        font-size: 0.875rem;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .delete-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #dc3545;
        border-radius: 4px;
    }

    .delete-button:hover {
        background-color: #f8f9fa;
    }

    .loading,
    .error,
    .empty-state {
        text-align: center;
        padding: 2rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }

    .error {
        color: #dc3545;
    }

    .error button {
        margin-top: 1rem;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .delete-confirm-content {
        padding: 1rem;
    }

    .delete-confirm-content p {
        margin-bottom: 1rem;
    }

    .delete-confirm-content .warning {
        color: #dc3545;
        font-size: 0.875rem;
    }

    .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }
</style>
