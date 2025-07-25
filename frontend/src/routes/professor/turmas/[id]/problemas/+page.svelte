<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import Dialog from "$lib/components/Dialog.svelte";
    import { problemaStore } from "$lib/utils/stores";
    import { TurmasService } from "$lib/services/turmas_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { Parsers } from "$lib/interfaces/parsers";
    import type { ProblemaModel } from "$lib/interfaces/interfaces";
    import { DateUtils, Utils } from "$lib/utils/utils";
    import BackButton from "$lib/components/BackButton.svelte";
    import { formatToDateTime } from "brazilian-values";

    const turmaId = $page.params.id;

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let problemas: ProblemaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let deleteConfirmOpen = false;
    let problemaToDelete: any = null;

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Fetch turma details using cache service
            const turmaData = await TurmasService.getById(turmaId);
            turma = {
                nome_turma: turmaData.nome_turma || "",
                id_professor: turmaData.id_professor?.toString() || "",
            };

            // Fetch problemas for this turma using cache service
            const parsedProblemas = await ProblemasService.getByTurma(turmaId);
            problemas = parsedProblemas;
            problemaStore.set(parsedProblemas);
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

    async function handleEditProblema(problema: ProblemaModel) {
        await goto(
            `/professor/turmas/${turmaId}/problemas/${problema.id_problema}/editar`,
        );
    }

    async function handleDeleteProblema() {
        if (!problemaToDelete) return;

        try {
            loading = true;
            // Use the service instead of raw API call
            await ProblemasService.delete(
                problemaToDelete.id_problema.toString(),
                turmaId,
            );
            // Cache will be automatically invalidated by service
            problemaStore.update((ps) =>
                ps.filter(
                    (p) => p.id_problema !== problemaToDelete.id_problema,
                ),
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

    onMount(fetchData);

    // Subscribe to the store
    problemaStore.subscribe((value) => {
        if (value.length > 0) {
            problemas = value;
        }
    });
</script>

<div class="header">
    <div class="title-section">
        <BackButton
            on:click={() => goto(`/professor/turmas/`)}
            text="Voltar para turmas"
        />
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
        {#each problemas as problema}
            <div class="problema-item">
                <div class="problema-info">
                    <h3>{problema.nome_problema}</h3>
                    <div class="problema-tags-status">
                        <div class="problema-tag-status-group">
                            <span class="problema-tag-label">Período:</span>
                            {#each Object.entries(problema.data_e_hora_criterios_e_arquivos) as [tag, dateObj]}
                                {#if dateObj.data_e_hora_inicio && dateObj.data_e_hora_fim}
                                    <span
                                        class="tag-status {DateUtils.isNowWithinTagDateRange(
                                            problema,
                                            tag,
                                        )
                                            ? 'tag-green'
                                            : 'tag-red'}"
                                    >
                                        {tag}:<br />De {formatToDateTime(
                                            dateObj.data_e_hora_inicio,
                                        )} à {formatToDateTime(
                                            dateObj.data_e_hora_fim,
                                        )}
                                    </span>
                                {/if}
                            {/each}
                        </div>
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
                    <Button
                        variant="secondary"
                        size="icon"
                        class="edit-button"
                        on:click={() => handleEditProblema(problema)}
                        title="Editar problema"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </Button>
                    <Button
                        variant="danger"
                        size="icon"
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
                    </Button>
                </div>
            </div>
        {/each}
    </div>
{/if}

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
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.2rem;
        gap: 0.7rem;
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
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0;
        text-align: left;
    }

    .problemas-list {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
    }

    .problema-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        padding: 1rem 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.7rem;
    }

    .problema-info h3 {
        font-size: 1.08rem;
        font-weight: 600;
        margin: 0 0 0.3rem 0;
    }

    .problema-details {
        display: flex;
        gap: 1rem;
        color: #6c757d;
        font-size: 0.93rem;
    }

    .actions {
        display: flex;
        gap: 0.3rem;
        align-items: center;
    }

    .edit-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #6c757d;
        border-radius: 4px;
    }

    .edit-button:hover {
        background-color: #f8f9fa;
        color: #0d6efd;
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

    .problema-tags-status {
        margin: 0.2rem 0 0.5rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }
    .problema-tag-status-group {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: flex-start;
        margin-bottom: 0.1rem;
    }
    .problema-tag-label {
        font-weight: 500;
        margin-right: 0.3rem;
        color: #444;
        font-size: 0.97rem;
    }
    .tag-status {
        display: block;
        padding: 0.15rem 0.5rem;
        border-radius: 8px;
        font-size: 0.93rem;
        font-weight: 500;
        margin-right: 0.2rem;
        margin-bottom: 0.1rem;
        background: #f2f4f8;
        color: #697077;
    }
    .tag-green {
        background: #e6f9ed;
        color: #1a7f37;
    }
    .tag-red {
        background: #fbeaea;
        color: #b71c1c;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
            margin-top: 3rem;
        }
        .header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.2rem; /* increased gap */
            margin-bottom: 1.2rem; /* increased margin */
        }
        .header h1 {
            font-size: 1.05rem;
            text-align: center;
        }
        .title-section {
            align-items: center;
            gap: 0.8rem; /* increased gap */
        }
        .problemas-list {
            gap: 1rem; /* increased gap */
        }
        .problema-item {
            padding: 0.7rem 0.5rem; /* slightly increased padding */
            border-radius: 8px;
            font-size: 0.97rem;
            flex-direction: column;
            align-items: stretch;
            gap: 0.8rem; /* increased gap */
        }
        .problema-info h3 {
            font-size: 0.97rem;
            margin-bottom: 0.3rem;
        }
        .problema-details {
            gap: 0.7rem; /* increased gap */
            font-size: 0.9rem;
        }
        .actions {
            gap: 0.5rem; /* increased gap */
            flex-direction: row;
            justify-content: flex-end;
        }
        .header :global(button),
        .header Button {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
        .problema-tags-status {
            gap: 0.1rem;
        }
        .problema-tag-status-group {
            gap: 0.2rem;
        }
        .problema-tag-label {
            font-size: 0.91rem;
        }
        .tag-status {
            font-size: 0.88rem;
            padding: 0.1rem 0.3rem;
        }
    }

    @media (max-width: 480px) {
        .container {
            padding: 0.1rem;
            margin-top: 1.2rem;
        }
        .header {
            gap: 0.7rem; /* increased gap */
            margin-bottom: 0.7rem; /* increased margin */
        }
        .header h1 {
            font-size: 0.93rem;
        }
        .title-section {
            gap: 0.5rem; /* increased gap */
        }
        .problemas-list {
            gap: 0.6rem; /* increased gap */
        }
        .problema-item {
            padding: 0.4rem 0.2rem; /* slightly increased padding */
            border-radius: 6px;
            font-size: 0.91rem;
            gap: 0.5rem; /* increased gap */
        }
        .problema-info h3 {
            font-size: 0.91rem;
            margin-bottom: 0.2rem;
        }
        .problema-details {
            gap: 0.4rem; /* increased gap */
            font-size: 0.88rem;
        }
        .actions {
            gap: 0.3rem; /* increased gap */
        }
        .header :global(button),
        .header Button {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
