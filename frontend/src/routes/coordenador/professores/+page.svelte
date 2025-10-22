<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/design_system/utils/api";
    import { logger } from "$lib/design_system/utils/logger";
    import type { ProfessorModel } from "$lib/interfaces/interfaces";
    import { ProfessoresService } from "$lib/services/professores_service";
    import { currentUser } from "$lib/utils/auth";
    import CardList from "$lib/components/CardList.svelte";
    import ProfessorCard from "$lib/components/ProfessorCard.svelte";
    import SearchBar from "$lib/design_system/components/SearchBar.svelte";
    import Pagination from "$lib/design_system/components/Pagination.svelte";
    import Dialog from "$lib/design_system/components/Dialog.svelte";
    import Button from "$lib/design_system/components/Button.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import Input from "$lib/design_system/components/Input.svelte";
    import TextArea from "$lib/design_system/components/TextArea.svelte";

    let professores: ProfessorModel[] = [];
    let loading = true;
    let error: string | null = null;
    let currentPage = 1;
    let itemsPerPage = 10;
    let searchQuery = "";
    let openDropdownId: number | null = null;
    let deleteConfirmOpen = false;
    let professorToDelete: ProfessorModel | null = null;

    // Form state for creating new professor
    let createFormOpen = false;
    let createLoading = false;
    let createError: string | null = null;
    let newProfessor = {
        nome_completo: "",
        email: "",
    };

    async function fetchProfessores() {
        try {
            loading = true;
            error = null;

            // Get current user to verify coordenador access
            const user = $currentUser;
            console.log("Current user in coordenador professores:", user);

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

            const fetchPromise = ProfessoresService.list();
            const fetchedProfessores = await Promise.race([
                fetchPromise,
                timeoutPromise,
            ]);

            professores = fetchedProfessores as ProfessorModel[];
            logger.info(
                `Fetched ${professores.length} professores for coordenador ${user.id}`,
            );
        } catch (err: any) {
            error = err.message || "Failed to fetch professores";
            logger.error("Error fetching professores:", err);
            // Ensure loading is set to false on error
            loading = false;
        } finally {
            loading = false;
        }
    }

    function handleCreateProfessor() {
        createFormOpen = true;
        newProfessor = { nome_completo: "", email: "" };
        createError = null;
    }

    function toggleDropdown(event: MouseEvent, professorId: number) {
        event.stopPropagation();
        openDropdownId = openDropdownId === professorId ? null : professorId;
    }

    function openDeleteConfirm(professor: ProfessorModel) {
        professorToDelete = professor;
        deleteConfirmOpen = true;
    }

    function closeDeleteConfirm() {
        deleteConfirmOpen = false;
        professorToDelete = null;
    }

    async function handleDeleteProfessor() {
        if (!professorToDelete) return;

        try {
            loading = true;
            await ProfessoresService.delete(professorToDelete.id.toString());
            await fetchProfessores();
            closeDeleteConfirm();
        } catch (err: any) {
            error = err.message || "Failed to delete professor";
            logger.error("Error deleting professor:", err);
        } finally {
            loading = false;
        }
    }

    async function handleCreateProfessorSubmit() {
        if (!newProfessor.nome_completo.trim() || !newProfessor.email.trim()) {
            createError = "Nome completo e email são obrigatórios";
            return;
        }

        try {
            createLoading = true;
            createError = null;

            const createdProfessor = await ProfessoresService.create({
                nome_completo: newProfessor.nome_completo.trim(),
                email: newProfessor.email.trim(),
            });

            // Add the new professor to the list
            professores = [...professores, createdProfessor];

            // Close form and reset
            createFormOpen = false;
            newProfessor = { nome_completo: "", email: "" };

            logger.info("Professor created successfully", {
                id: createdProfessor.id,
            });
        } catch (err: any) {
            createError = err.message || "Failed to create professor";
            logger.error("Error creating professor:", err);
        } finally {
            createLoading = false;
        }
    }

    function closeCreateForm() {
        createFormOpen = false;
        newProfessor = { nome_completo: "", email: "" };
        createError = null;
    }

    onMount(() => {
        fetchProfessores();
    });

    // Filter and sort professores
    $: filteredAndSortedProfessores = (() => {
        let filtered = searchQuery
            ? professores.filter(
                  (professor) =>
                      professor.nome_completo
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      professor.email
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
              )
            : professores;

        // Sort alphabetically by name
        return filtered.sort((a, b) =>
            (a.nome_completo || "").localeCompare(
                b.nome_completo || "",
                "pt-BR",
                {
                    sensitivity: "base",
                },
            ),
        );
    })();

    $: totalPages = Math.ceil(
        filteredAndSortedProfessores.length / itemsPerPage,
    );
    $: paginatedProfessores = filteredAndSortedProfessores.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );
</script>

<PageHeader backText="Voltar" title="Professores" />

<div class="professores-container">
    <div class="search-section">
        <SearchBar
            bind:value={searchQuery}
            placeholder="Buscar professor por nome ou email..."
            buttonText="+ Adicionar professor"
            on:search={(e) => (searchQuery = e.detail)}
            on:buttonClick={handleCreateProfessor}
        />
    </div>

    <CardList
        items={paginatedProfessores}
        {loading}
        {error}
        loadingMessage="Carregando professores..."
        emptyMessage="Nenhum professor encontrado."
        showRetryButton={true}
        onRetry={() => fetchProfessores()}
    >
        <svelte:fragment slot="default">
            {#each paginatedProfessores as professor}
                <ProfessorCard
                    {professor}
                    {openDropdownId}
                    onToggleDropdown={toggleDropdown}
                    onOpenDeleteConfirm={openDeleteConfirm}
                />
            {/each}
        </svelte:fragment>
    </CardList>

    {#if !loading && !error && paginatedProfessores.length > 0}
        <Pagination
            {currentPage}
            {totalPages}
            on:pageChange={(e) => (currentPage = e.detail.page)}
        />
    {/if}
</div>

<!-- Create Professor Dialog -->
<Dialog open={createFormOpen} on:close={closeCreateForm}>
    <svelte:fragment slot="header">
        <h2>Adicionar Professor</h2>
    </svelte:fragment>
    <div class="create-form-content">
        {#if createError}
            <div class="error-message">
                <p>{createError}</p>
            </div>
        {/if}

        <form on:submit|preventDefault={handleCreateProfessorSubmit}>
            <div class="form-group">
                <Input
                    label="Nome Completo"
                    placeholder="Digite o nome completo do professor"
                    required
                    bind:value={newProfessor.nome_completo}
                    disabled={createLoading}
                />
            </div>

            <div class="form-group">
                <Input
                    label="Email"
                    type="email"
                    placeholder="Digite o email do professor"
                    required
                    bind:value={newProfessor.email}
                    disabled={createLoading}
                />
            </div>

            <div class="form-actions">
                <Button
                    variant="secondary"
                    on:click={closeCreateForm}
                    disabled={createLoading}
                >
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={createLoading}
                    loading={createLoading}
                >
                    {createLoading ? "Criando..." : "Adicionar Professor"}
                </Button>
            </div>
        </form>
    </div>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog open={deleteConfirmOpen} on:close={closeDeleteConfirm}>
    <svelte:fragment slot="header">
        <h2>Confirmar exclusão</h2>
    </svelte:fragment>
    <div class="delete-confirm-content">
        <p>
            Tem certeza que deseja excluir o professor "{professorToDelete?.nome_completo}"?
        </p>
        <p class="warning">
            Esta ação não pode ser desfeita e todos os dados do professor serão
            perdidos.
        </p>
        <div class="dialog-actions">
            <Button variant="secondary" on:click={closeDeleteConfirm}>
                Cancelar
            </Button>
            <Button variant="danger" disabled={true}>Excluir professor</Button>
        </div>
    </div>
</Dialog>

<style>
    .professores-container {
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

    .create-form-content {
        padding: 1rem;
        max-width: 500px;
    }

    .create-form-content form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }

    .error-message {
        background-color: var(--color-error-background);
        border: 1px solid var(--color-error-border);
        border-radius: 0.375rem;
        padding: 0.75rem;
        margin-bottom: 1rem;
    }

    .error-message p {
        color: var(--color-error-main);
        margin: 0;
        font-size: 0.875rem;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .delete-confirm-content {
        padding: 1rem;
    }

    .delete-confirm-content p {
        margin-bottom: 1rem;
    }

    .delete-confirm-content .warning {
        color: var(--color-error-main);
        font-size: 0.875rem;
    }

    .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .professores-container {
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
        .professores-container {
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
