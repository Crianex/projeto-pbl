<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import SearchBar from "$lib/components/SearchBar.svelte";
    import type { TurmaModel } from "$lib/interfaces/interfaces";
    import { api } from "$lib/utils/api";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let turmas: TurmaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let deleteConfirmOpen = false;
    let turmaToDelete: TurmaModel | null = null;
    let openDropdownId: number | null = null;

    let currentPage = 1;
    let itemsPerPage = 5;
    let searchQuery = "";

    async function fetchTurmas() {
        try {
            loading = true;
            error = null;
            const data = await api.get("/turmas/list");
            turmas = data;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch turmas";
            console.error("Error fetching turmas:", err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchTurmas();
        // Add click outside listener
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });

    function handleClickOutside(event: MouseEvent) {
        const dropdowns = document.querySelectorAll(".dropdown");
        let clickedInsideDropdown = false;

        dropdowns.forEach((dropdown) => {
            if (dropdown.contains(event.target as Node)) {
                clickedInsideDropdown = true;
            }
        });

        if (!clickedInsideDropdown) {
            openDropdownId = null;
        }
    }

    function toggleDropdown(event: MouseEvent, turmaId: number) {
        event.stopPropagation();
        openDropdownId = openDropdownId === turmaId ? null : turmaId;
    }

    $: filteredTurmas = turmas.filter((turma) =>
        turma.nome_turma?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    $: totalPages = Math.ceil(filteredTurmas.length / itemsPerPage);
    $: paginatedTurmas = filteredTurmas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    async function handleCreateTurma() {
        await goto("/professor/turmas/nova");
    }

    async function handleDeleteTurma() {
        if (!turmaToDelete) return;

        try {
            loading = true;
            await api.delete(`/turmas/delete?id=${turmaToDelete.id_turma}`);
            await fetchTurmas();
            closeDeleteConfirm();
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to delete turma";
            console.error("Error deleting turma:", err);
        } finally {
            loading = false;
        }
    }

    function openDeleteConfirm(turma: TurmaModel) {
        turmaToDelete = turma;
        deleteConfirmOpen = true;
    }

    function closeDeleteConfirm() {
        deleteConfirmOpen = false;
        turmaToDelete = null;
    }
</script>

<div class="turmas-container">
    <div class="header">
        <h1>Turmas</h1>
        <SearchBar
            bind:value={searchQuery}
            placeholder="Buscar turma..."
            buttonText="+ Criar turma"
            on:search={(e) => (searchQuery = e.detail)}
            on:buttonClick={handleCreateTurma}
        />
    </div>

    {#if loading}
        <div class="loading">Carregando turmas...</div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={fetchTurmas}
                >Tentar novamente</Button
            >
        </div>
    {:else if turmas.length === 0}
        <div class="empty-state">
            <p>Nenhuma turma encontrada.</p>
        </div>
    {:else}
        <div class="turmas-list">
            {#each paginatedTurmas as turma (turma.id_turma)}
                <div class="turma-item">
                    <span>{turma.nome_turma}</span>
                    <div class="actions">
                        <a
                            href={`/professor/turmas/${turma.id_turma}`}
                            class="btn-primary"
                        >
                            Editar
                        </a>
                        <div class="dropdown">
                            <button
                                class="more-options"
                                on:click={(e) =>
                                    toggleDropdown(e, turma.id_turma)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                </svg>
                            </button>
                            <div
                                class="dropdown-content"
                                class:show={openDropdownId === turma.id_turma}
                            >
                                <a
                                    href={`/professor/turmas/${turma.id_turma}/problemas`}
                                    class="dropdown-item"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                    Ver problemas
                                </a>
                                <button
                                    class="dropdown-item delete"
                                    on:click={() => openDeleteConfirm(turma)}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Excluir turma
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <div class="pagination">
            <button
                class="page-nav"
                disabled={currentPage === 1}
                on:click={() => currentPage--}
            >
                Previous
            </button>

            {#each Array(totalPages) as _, i}
                <button
                    class="page-number"
                    class:active={currentPage === i + 1}
                    on:click={() => (currentPage = i + 1)}
                >
                    {i + 1}
                </button>
            {/each}

            <button
                class="page-nav"
                disabled={currentPage === totalPages}
                on:click={() => currentPage++}
            >
                Next
            </button>
        </div>
    {/if}
</div>

<Dialog open={deleteConfirmOpen} on:close={closeDeleteConfirm}>
    <svelte:fragment slot="header">
        <h2>Confirmar exclusão</h2>
    </svelte:fragment>
    <div class="delete-confirm-content">
        <p>
            Tem certeza que deseja excluir a turma "{turmaToDelete?.nome_turma}"?
        </p>
        <p class="warning">
            Esta ação não pode ser desfeita e todos os dados da turma serão
            perdidos.
        </p>
        <div class="dialog-actions">
            <Button variant="secondary" on:click={closeDeleteConfirm}>
                Cancelar
            </Button>
            <Button variant="danger" on:click={handleDeleteTurma}>
                Excluir turma
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .turmas-container {
        width: 100%;
        height: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
    }

    .header {
        margin-bottom: 2rem;
    }

    .header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .search-bar {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search-bar input {
        flex: 3;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .create-turma-button {
        flex: 1;
    }

    .turmas-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: visible;
        margin-bottom: 2rem;
    }

    .turma-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .turma-item:last-child {
        border-bottom: none;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    :global(.btn-primary) {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        background: #0d6efd;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    :global(.btn-primary:hover) {
        background: #0b5ed7;
    }

    .more-options {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #6c757d;
        border-radius: 4px;
    }

    .more-options:hover {
        background-color: #f8f9fa;
    }

    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        top: 100%;
        background-color: white;
        min-width: 160px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        z-index: 1;
        margin-top: 0.25rem;
    }

    .dropdown-content.show {
        display: block;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        color: #212529;
        font-size: 0.875rem;
    }

    .dropdown-item.delete {
        color: #dc3545;
    }

    .dropdown-item:hover {
        background-color: #f8f9fa;
    }

    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
    }

    .page-nav,
    .page-number {
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

    .page-number.active {
        background: #0d6efd;
        color: white;
        border-color: #0d6efd;
    }

    .page-nav:hover:not(:disabled),
    .page-number:hover:not(.active) {
        background: #f8f9fa;
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
