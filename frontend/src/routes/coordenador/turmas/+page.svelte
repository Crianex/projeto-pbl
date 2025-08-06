<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type { TurmaModel } from "$lib/interfaces/interfaces";
    import { TurmasService } from "$lib/services/turmas_service";
    import { currentUser } from "$lib/utils/auth";
    import CardList from "$lib/components/CardList.svelte";
    import TurmaCard from "$lib/components/TurmaCard.svelte";
    import SearchBar from "$lib/components/SearchBar.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import Button from "$lib/components/Button.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let turmas: TurmaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let searchQuery = "";
    let openDropdownId: number | null = null;
    let deleteConfirmOpen = false;
    let turmaToDelete: TurmaModel | null = null;

    async function fetchTurmas() {
        try {
            loading = true;
            error = null;

            // Get current user to verify coordenador access
            const user = $currentUser;
            console.log("Current user in coordenador turmas:", user);

            if (!user || user.tipo !== "coordenador") {
                console.error(
                    "User not authenticated or not a coordenador:",
                    user,
                );
                throw new Error("User not authenticated or not a coordenador");
            }

            // Add a timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timeout")), 10000);
            });

            // For coordenador, fetch all turmas (not just for a specific professor)
            const fetchPromise = TurmasService.getAll(null);
            const fetchedTurmas = await Promise.race([
                fetchPromise,
                timeoutPromise,
            ]);

            turmas = fetchedTurmas as TurmaModel[];
            logger.info(
                `Fetched ${turmas.length} turmas for coordenador ${user.id}`,
            );
        } catch (err: any) {
            error = err.message || "Failed to fetch turmas";
            logger.error("Error fetching turmas:", err);
            // Ensure loading is set to false on error
            loading = false;
        } finally {
            loading = false;
        }
    }

    function handleCreateTurma() {
        goto("/coordenador/turmas/nova");
    }

    function toggleDropdown(event: MouseEvent, turmaId: number) {
        event.stopPropagation();
        openDropdownId = openDropdownId === turmaId ? null : turmaId;
    }

    function openDeleteConfirm(turma: TurmaModel) {
        turmaToDelete = turma;
        deleteConfirmOpen = true;
    }

    function closeDeleteConfirm() {
        deleteConfirmOpen = false;
        turmaToDelete = null;
    }

    async function handleDeleteTurma() {
        if (!turmaToDelete) return;

        try {
            loading = true;
            await TurmasService.delete(turmaToDelete.id_turma.toString());
            await fetchTurmas();
            closeDeleteConfirm();
        } catch (err: any) {
            error = err.message || "Failed to delete turma";
            logger.error("Error deleting turma:", err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchTurmas();
    });

    // Filter and sort turmas
    $: filteredAndSortedTurmas = (() => {
        let filtered = searchQuery
            ? turmas.filter(
                  (turma) =>
                      turma.nome_turma
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      turma.professor?.nome_completo
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
              )
            : turmas;

        // Sort alphabetically by turma name
        return filtered.sort((a, b) =>
            (a.nome_turma || "").localeCompare(b.nome_turma || "", "pt-BR", {
                sensitivity: "base",
            }),
        );
    })();

    $: totalPages = Math.ceil(filteredAndSortedTurmas.length / itemsPerPage);
    $: paginatedTurmas = filteredAndSortedTurmas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
</script>

<PageHeader backText="Voltar" title="Turmas" />

<div class="turmas-container">
    <div class="search-section">
        <SearchBar
            bind:value={searchQuery}
            placeholder="Buscar turma ou professor..."
            buttonText="+ Criar turma"
            on:search={(e) => (searchQuery = e.detail)}
            on:buttonClick={handleCreateTurma}
        />
    </div>

    <CardList
        items={paginatedTurmas}
        {loading}
        {error}
        loadingMessage="Carregando turmas..."
        emptyMessage="Nenhuma turma encontrada."
        showRetryButton={true}
        onRetry={() => fetchTurmas()}
    >
        <svelte:fragment slot="default">
            {#each paginatedTurmas as turma}
                <TurmaCard
                    {turma}
                    {openDropdownId}
                    onToggleDropdown={toggleDropdown}
                    onOpenDeleteConfirm={openDeleteConfirm}
                    showProfessor={true}
                    userType="coordenador"
                />
            {/each}
        </svelte:fragment>
    </CardList>

    {#if !loading && !error && paginatedTurmas.length > 0}
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
        margin-top: 1rem;
        padding: 0 0.5rem;
        box-sizing: border-box;
    }

    .search-section {
        margin-bottom: 1.2rem;
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7rem;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
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
            margin-top: 1rem;
            padding: 0 0.1rem;
        }
        .search-section {
            margin-top: 0.2rem;
            margin-bottom: 0.7rem;
            gap: 0.4rem;
            max-width: 90%;
        }

        .search-section :global(.search-bar) {
            width: 100%;
            max-width: 400px;
        }

        .search-section :global(.search-bar input),
        .search-section :global(.search-bar .action-button) {
            flex: 1;
            min-width: 0;
        }

        .search-section :global(.action-button) {
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
    }

    @media (max-width: 480px) {
        .turmas-container {
            margin-top: 0.5rem;
            padding: 0.5rem;
        }
        .search-section {
            margin-top: 0.1rem;
            margin-bottom: 0.3rem;
            gap: 0.2rem;
            max-width: 95%;
        }

        .search-section :global(.search-bar) {
            max-width: 350px;
        }

        .search-section :global(.search-bar input),
        .search-section :global(.search-bar .action-button) {
            flex: 1;
            min-width: 0;
        }

        .search-section :global(.action-button) {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
