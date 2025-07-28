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
    import CardList from "$lib/components/CardList.svelte";
    import ProblemaCard from "$lib/components/ProblemaCard.svelte";
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

<CardList
    items={problemas}
    {loading}
    {error}
    loadingMessage="Carregando problemas..."
    emptyMessage="Nenhum problema encontrado para esta turma."
    showRetryButton={true}
    onRetry={fetchData}
>
    <svelte:fragment slot="default">
        {#each problemas as problema}
            <ProblemaCard
                {problema}
                {turmaId}
                onEditProblema={handleEditProblema}
                onOpenDeleteConfirm={openDeleteConfirm}
            />
        {/each}
    </svelte:fragment>
</CardList>

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
        .header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.2rem;
            margin-bottom: 1.2rem;
        }
        .header h1 {
            font-size: 1.05rem;
            text-align: center;
        }
        .title-section {
            align-items: center;
            gap: 0.8rem;
        }
        .header :global(button),
        .header Button {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
    }

    @media (max-width: 480px) {
        .header {
            gap: 0.7rem;
            margin-bottom: 0.7rem;
        }
        .header h1 {
            font-size: 0.93rem;
        }
        .title-section {
            gap: 0.5rem;
        }
        .header :global(button),
        .header Button {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
