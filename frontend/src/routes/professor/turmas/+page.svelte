<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import SearchBar from "$lib/components/SearchBar.svelte";
    import type { TurmaModel } from "$lib/interfaces/interfaces";
    import { api } from "$lib/utils/api";
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { afterNavigate } from "$app/navigation";
    import { currentUser, isProfessor } from "$lib/utils/auth";
    import { TurmasService } from "$lib/services/turmas_service";
    import { cacheInvalidation } from "$lib/utils/stores";
    import Pagination from "../../../lib/components/Pagination.svelte";
    import CardList from "$lib/components/CardList.svelte";
    import TurmaCard from "$lib/components/TurmaCard.svelte";

    let turmas: TurmaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let deleteConfirmOpen = false;
    let turmaToDelete: TurmaModel | null = null;
    let openDropdownId: number | null = null;

    let currentPage = 1;
    let itemsPerPage = 5;
    let searchQuery = "";
    let pageHidden = false;

    async function fetchTurmas(forceRefresh = false) {
        try {
            loading = true;
            error = null;

            // Use the caching service instead of direct API call
            const allTurmas = await TurmasService.getAll(forceRefresh);

            // Filter turmas to only show those belonging to the current professor
            const user = $currentUser;
            if (user && isProfessor(user)) {
                turmas = allTurmas.filter(
                    (turma: TurmaModel) => turma.id_professor === user.id,
                );
            } else {
                turmas = [];
                error =
                    user === undefined
                        ? "Loading user information..."
                        : "Access denied: You must be a professor to view turmas";
            }
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch turmas";
            console.error("Error fetching turmas:", err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        // Wait for user to be loaded before fetching turmas
        let hasLoaded = false;
        const unsubscribe = currentUser.subscribe((user) => {
            if (user !== undefined && !hasLoaded) {
                hasLoaded = true;
                fetchTurmas();
            }
        });

        // Add click outside listener
        document.addEventListener("click", handleClickOutside);

        // Add page visibility listener to refresh data when page becomes visible
        const handleVisibilityChange = () => {
            if (document.hidden) {
                pageHidden = true;
            } else if (pageHidden) {
                // Page became visible again, refresh data
                pageHidden = false;
                if ($currentUser !== undefined) {
                    fetchTurmas(true);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            unsubscribe();
        };
    });

    // Refresh data when navigating to this page
    afterNavigate(({ type }) => {
        // Only refresh on regular navigation (not replace or popstate from same page)
        if (type === "enter" && $currentUser !== undefined) {
            fetchTurmas(true);
        }
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
            // Use the service instead of raw API call
            await TurmasService.delete(turmaToDelete.id_turma.toString());
            // Cache will be automatically invalidated by service
            await fetchTurmas(true); // Force refresh after deletion
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

    <CardList
        items={turmas}
        {loading}
        {error}
        loadingMessage="Carregando turmas..."
        emptyMessage="Nenhuma turma encontrada."
        showRetryButton={true}
        onRetry={() => fetchTurmas(true)}
    >
        <svelte:fragment slot="default">
            {#each turmas as turma}
                <TurmaCard
                    {turma}
                    {openDropdownId}
                    onToggleDropdown={toggleDropdown}
                    onOpenDeleteConfirm={openDeleteConfirm}
                />
            {/each}
        </svelte:fragment>
    </CardList>

    {#if !loading && !error && turmas.length > 0}
        <Pagination
            {currentPage}
            {totalPages}
            on:pageChange={(e) => (currentPage = e.detail.page)}
        />
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
        margin-top: 2.5rem;
        padding: 0 0.5rem;
        box-sizing: border-box;
    }

    .header {
        margin-bottom: 1.2rem;
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7rem;
    }

    .header h1 {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
        text-align: center;
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

    @media (max-width: 768px) {
        .turmas-container {
            margin-top: 3rem;
            padding: 0 0.1rem;
        }
        .header {
            margin-top: 0.2rem;
            margin-bottom: 0.7rem;
            gap: 0.4rem;
        }
        .header h1 {
            font-size: 1.05rem;
            margin-bottom: 0.1rem;
        }

        .header :global(button) {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
    }

    @media (max-width: 480px) {
        .turmas-container {
            margin-top: 1.2rem;
            padding: 0.5rem;
        }
        .header {
            margin-top: 0.1rem;
            margin-bottom: 0.3rem;
            gap: 0.2rem;
        }
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 2rem;
        }

        .header :global(button) {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
