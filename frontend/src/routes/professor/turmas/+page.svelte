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

    {#if loading}
        <div class="loading">Carregando turmas...</div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={() => fetchTurmas(true)}
                >Tentar novamente</Button
            >
        </div>
    {:else if turmas.length === 0}
        <div class="empty-state">
            <p>Nenhuma turma encontrada.</p>
        </div>
    {:else}
        <div class="turmas-list">
            {#each turmas as turma}
                <div
                    class="turma-item"
                    on:click={() =>
                        goto(`/professor/turmas/${turma.id_turma}/problemas`)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            goto(
                                `/professor/turmas/${turma.id_turma}/problemas`,
                            );
                        }
                    }}
                >
                    <div class="turma-main-info">
                        <span class="turma-nome">{turma.nome_turma}</span>
                        <div class="turma-alunos-mobile">
                            <span class="alunos-label">Alunos:</span>
                            {#if turma.alunos && turma.alunos.length > 0}
                                <ul class="alunos-list">
                                    {#each turma.alunos as aluno}
                                        <li class="aluno-nome">
                                            {aluno.nome_completo}
                                        </li>
                                    {/each}
                                </ul>
                            {:else}
                                <span class="alunos-empty"
                                    >Nenhum aluno cadastrado</span
                                >
                            {/if}
                        </div>
                    </div>
                    <div class="actions">
                        <div class="dropdown">
                            <Button
                                variant="secondary"
                                size="icon"
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
                            </Button>
                            <div
                                class="dropdown-content"
                                class:show={openDropdownId === turma.id_turma}
                            >
                                <Button
                                    variant="secondary"
                                    class="dropdown-item"
                                    on:click={(e) => {
                                        e.stopPropagation();
                                        goto(
                                            `/professor/turmas/${turma.id_turma}`,
                                        );
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    class="dropdown-item delete"
                                    on:click={(e) => {
                                        e.stopPropagation();
                                        openDeleteConfirm(turma);
                                    }}
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
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

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

    .turmas-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        overflow: visible;
        margin-bottom: 1.2rem;
        padding: 0.2rem 0.2rem;
    }

    .turma-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.7rem 0.5rem;
        border-bottom: 1px solid #e9ecef;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-radius: 6px;
        margin: 0.1rem 0;
    }

    .turma-item:hover {
        background-color: #f8f9fa;
    }

    .turma-item:last-child {
        border-bottom: none;
    }

    .actions {
        display: flex;
        gap: 0.3rem;
        align-items: center;
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
        min-width: max-content;
        width: max-content;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        z-index: 1;
        margin-top: 0.25rem;
    }

    .dropdown-content.show {
        display: block;
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

    .turma-main-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex: 1;
    }
    .turma-nome {
        font-weight: 600;
        font-size: 1.08rem;
    }
    .turma-alunos-mobile {
        display: none;
        font-size: 0.98rem;
        margin-top: 0.2rem;
        color: #444;
    }
    .alunos-label {
        font-weight: 500;
        margin-right: 0.3rem;
    }
    .alunos-list {
        margin: 0.2rem 0 0 0.7rem;
        padding: 0;
        list-style: disc inside;
    }
    .aluno-nome {
        font-size: 0.97rem;
        margin-bottom: 0.1rem;
    }
    .alunos-empty {
        color: #888;
        font-size: 0.97rem;
        margin-left: 0.5rem;
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
        .turmas-list {
            border-radius: 8px;
            margin-bottom: 0.7rem;
            padding: 0.1rem 0.05rem;
        }
        .turma-item {
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            border-radius: 4px;
        }
        .actions {
            gap: 0.1rem;
        }

        .header :global(button) {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
        .turma-alunos-mobile {
            display: block;
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
        .turmas-list {
            gap: 0.1rem;
            border-radius: 6px;
            margin-bottom: 0.3rem;
            padding: 0.05rem 0.01rem;
        }
        .turma-item {
            padding: 0.3rem 0.05rem;
            font-size: 0.91rem;
            border-radius: 3px;
        }
        .actions {
            gap: 0.05rem;
        }

        .header :global(button) {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
