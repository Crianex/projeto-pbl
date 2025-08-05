<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type { ProblemaModel, TurmaModel } from "$lib/interfaces/interfaces";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { problemaStore } from "$lib/utils/stores";
    import CardList from "$lib/components/CardList.svelte";
    import ProblemaCard from "$lib/components/ProblemaCard.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import Button from "$lib/components/Button.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import { currentUser } from "$lib/utils/auth";

    const turmaId = $page.params.id;

    let problemas: ProblemaModel[] = [];
    let turma: TurmaModel | null = null;
    let loading = true;
    let error: string | null = null;
    let deleteConfirmOpen = false;
    let problemaToDelete: ProblemaModel | null = null;

    async function fetchData() {
        try {
            loading = true;
            error = null;

            // Get both turma and problemas data
            const [turmaData, problemasData] = await Promise.all([
                TurmasService.getById(turmaId),
                ProblemasService.getByTurma(turmaId),
            ]);

            turma = turmaData;
            problemas = problemasData;

            logger.info(
                `Fetched ${problemas.length} problemas for turma ${turmaId}`,
            );
        } catch (err: any) {
            error = err.message || "Failed to fetch data";
            logger.error("Error fetching data:", err);
        } finally {
            loading = false;
        }
    }

    function handleCreateProblema() {
        goto(`/professor/turmas/${turmaId}/problemas/novo`);
    }

    function handleEditProblema(problema: ProblemaModel) {
        goto(
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
                    (p) => p.id_problema !== problemaToDelete?.id_problema,
                ),
            );
            await fetchData();
            closeDeleteConfirm();
        } catch (err: any) {
            error = err.message || "Failed to delete problema";
            logger.error("Error deleting problema:", err);
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

    // Sort problemas alphabetically by name
    $: sortedProblemas = problemas.sort((a, b) =>
        (a.nome_problema || "").localeCompare(b.nome_problema || "", "pt-BR", {
            sensitivity: "base",
        }),
    );
</script>

<PageHeader
    backUrl={$currentUser?.tipo == "coordenador"
        ? "/coordenador/turmas"
        : "/professor/turmas"}
    backText="Voltar para turmas"
    title="Problemas - {turma?.nome_turma || ''}"
/>

<div class="problemas-container">
    <div class="actions-section">
        <Button variant="primary" on:click={handleCreateProblema}>
            + Criar problema
        </Button>
    </div>

    <CardList
        items={sortedProblemas}
        {loading}
        {error}
        loadingMessage="Carregando problemas..."
        emptyMessage="Nenhum problema encontrado para esta turma."
        showRetryButton={true}
        onRetry={fetchData}
    >
        <svelte:fragment slot="default">
            {#each sortedProblemas as problema}
                <ProblemaCard
                    {problema}
                    {turmaId}
                    onEditProblema={handleEditProblema}
                    onOpenDeleteConfirm={openDeleteConfirm}
                />
            {/each}
        </svelte:fragment>
    </CardList>
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
    .problemas-container {
        width: 100%;
        height: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
        padding: 0 0.5rem;
        box-sizing: border-box;
    }

    .actions-section {
        margin-bottom: 1.2rem;
        margin-top: 0.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.7rem;
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
        .problemas-container {
            margin-top: 1rem;
            padding: 0 0.1rem;
        }
        .actions-section {
            margin-top: 0.2rem;
            margin-bottom: 0.7rem;
            gap: 0.4rem;
        }
        .actions-section :global(button) {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
    }

    @media (max-width: 480px) {
        .problemas-container {
            margin-top: 0.5rem;
            padding: 0.5rem;
        }
        .actions-section {
            margin-top: 0.1rem;
            margin-bottom: 0.3rem;
            gap: 0.2rem;
        }
        .actions-section :global(button) {
            padding: 0.3rem 0.1rem;
            font-size: 0.91rem;
        }
    }
</style>
