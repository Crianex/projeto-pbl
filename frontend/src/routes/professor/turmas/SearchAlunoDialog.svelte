<script lang="ts">
    import Dialog from "$lib/components/Dialog.svelte";
    import Button from "$lib/components/Button.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import { debounce } from "lodash-es";
    import { onMount, afterUpdate } from "svelte";

    export let open = false;
    export let exclude_turma_id: string | null = null;
    export let exclude_aluno_ids: Array<string | number> = [];

    let searchQuery = "";
    let loading = false;
    let error: string | null = null;
    let results: AlunoModel[] = [];
    let hasMore = true;
    let pageSize = 20;
    let offset = 0;
    let loadingMore = false;
    let initialLoad = false;
    let selected = new Set<string>();
    let loadingAll = false;
    let searching = false;

    import { createEventDispatcher } from "svelte";
    import type { AlunoModel } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import { AlunosService } from "$lib/services/alunos_service";
    import Input from "$lib/components/Input.svelte";
    const dispatch = createEventDispatcher();

    // Fetch first page when dialog opens
    $: if (open && !initialLoad) {
        initialLoad = true;
        resetAndLoad();
    }

    // Reactive search - trigger search when searchQuery changes
    $: if (open && initialLoad && searchQuery !== undefined) {
        searchAlunos();
    }

    async function resetAndLoad() {
        results = [];
        offset = 0;
        hasMore = true;
        error = null;
        await loadMore();
    }

    async function loadMore() {
        if (loading || loadingMore || !hasMore) return;
        loadingMore = offset > 0;
        loading = offset === 0;
        error = null;
        try {
            const newAlunos = await AlunosService.searchPaginated({
                query: searchQuery.trim() || " ",
                limit: pageSize,
                offset,
                exclude_turma_id,
                exclude_aluno_ids: exclude_aluno_ids.map(String),
                order: "nome_completo.asc",
            });
            if (newAlunos.length < pageSize) {
                hasMore = false;
            }
            results = [...results, ...newAlunos];
            offset += newAlunos.length;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Erro ao carregar alunos";
            hasMore = false;
        } finally {
            loading = false;
            loadingMore = false;
        }
    }

    async function loadAllAlunos() {
        if (loadingAll) return;
        loadingAll = true;
        error = null;
        try {
            // Load all alunos without pagination limits
            const allAlunos = await AlunosService.searchPaginated({
                query: searchQuery.trim() || " ",
                limit: 1000, // Large limit to get all
                offset: 0,
                exclude_turma_id,
                exclude_aluno_ids: exclude_aluno_ids.map(String),
                order: "nome_completo.asc",
            });
            results = allAlunos;
            offset = allAlunos.length;
            hasMore = false;
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Erro ao carregar todos os alunos";
        } finally {
            loadingAll = false;
        }
    }

    // Debounced search
    const searchAlunos = debounce(async () => {
        searching = true;
        await resetAndLoad();
        searching = false;
    }, 300);

    function toggleSelect(aluno: AlunoModel) {
        if (selected.has(aluno.id.toString())) {
            selected.delete(aluno.id.toString());
        } else {
            selected.add(aluno.id.toString());
        }
        // Force reactivity
        selected = new Set(selected);
    }

    function selectAll() {
        if (results.length === 0) return;
        results.forEach((aluno) => {
            selected.add(aluno.id.toString());
        });
        // Force reactivity
        selected = new Set(selected);
    }

    async function handleSelectAll() {
        if (results.length === 0) {
            await loadAllAlunos();
        }
        selectAll();
    }

    function handleAddSelected() {
        const selectedAlunos = results
            .filter((a) => selected.has(a.id.toString()))
            .map((a) => ({
                ...a,
                id: a.id,
                id_aluno: a.id, // for compatibility
                nome_completo: a.nome_completo,
                email: a.email,
                link_avatar: a.link_avatar,
            }));
        dispatch("select", selectedAlunos);
        handleClose();
    }

    function handleClose() {
        searchQuery = "";
        error = null;
        hasMore = true;
        offset = 0;
        results = [];
        initialLoad = false;
        selected = new Set();
        dispatch("close");
    }

    // Infinite scroll handler
    function handleScroll(event: Event) {
        const el = event.target as HTMLElement;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            loadMore();
        }
    }
</script>

<Dialog {open} on:close={handleClose}>
    <div class="dialog-content">
        <h2>Adicionar Aluno</h2>

        <div class="search-container">
            <Input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar aluno por nome..."
            />
        </div>

        <div
            style="display: flex; justify-content: flex-end; margin-bottom: 0.5rem;"
        >
            <Button
                type="button"
                variant="secondary"
                on:click={handleSelectAll}
                disabled={loadingAll ||
                    results.length === 0 ||
                    results.every((a) => selected.has(a.id.toString()))}
            >
                {loadingAll ? "Carregando..." : "Nenhum Selecionado"}
            </Button>
        </div>

        <div class="results-container">
            {#if searching}
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <span>Buscando alunos...</span>
                </div>
            {:else if loading && results.length === 0}
                <div class="status-message">Carregando alunos...</div>
            {:else if error}
                <div class="status-message error">{error}</div>
            {:else if results.length === 0 && !searching}
                <div class="status-message">Nenhum aluno encontrado</div>
            {:else}
                <div class="results-list" on:scroll={handleScroll}>
                    {#each results as aluno (aluno.id)}
                        <button
                            class="result-item {selected.has(
                                aluno.id.toString(),
                            )
                                ? 'selected'
                                : ''}"
                            type="button"
                            on:click={() => toggleSelect(aluno)}
                        >
                            <input
                                type="checkbox"
                                class="select-checkbox"
                                checked={selected.has(aluno.id.toString())}
                                readonly
                                tabindex="-1"
                            />
                            <div class="aluno-info">
                                <Avatar
                                    src={aluno.link_avatar ||
                                        "/images/default_avatar.png"}
                                    alt={`Avatar de ${aluno.nome_completo}`}
                                    size="sm"
                                />
                                <div class="aluno-details">
                                    <strong>{aluno.nome_completo}</strong>
                                    <span>{aluno.email}</span>
                                </div>
                            </div>
                        </button>
                    {/each}
                    {#if loadingMore}
                        <div class="status-message">Carregando mais...</div>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="actions">
            <Button variant="secondary" type="button" on:click={handleClose}>
                Cancelar
            </Button>
            <Button
                variant="primary"
                type="button"
                disabled={selected.size === 0}
                on:click={handleAddSelected}
            >
                Adicionar
            </Button>
        </div>
    </div>
</Dialog>

<style>
    h2 {
        margin: 0 0 1.5rem;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .search-container {
        margin-bottom: 1rem;
    }

    .status-message {
        text-align: center;
        padding: 1rem;
        color: #6c757d;
        flex: 1;
        min-height: 200px;
        max-height: 300px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin: 1rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .status-message.error {
        color: #dc3545;
    }

    .results-list {
        max-height: 300px;
        overflow-y: auto;
        margin: 1rem 0;
        border: 1px solid #dee2e6;
        border-radius: 4px;
    }

    .result-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.75rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-bottom: 1px solid #dee2e6;
        transition: background 0.15s;
    }
    .result-item.selected {
        background-color: #e7f1ff;
    }
    .result-item:last-child {
        border-bottom: none;
    }
    .result-item:hover {
        background-color: #f8f9fa;
    }
    .select-checkbox {
        margin-right: 0.75rem;
        pointer-events: none;
    }

    .aluno-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .aluno-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
    }

    .aluno-details strong {
        color: #212529;
    }

    .aluno-details span {
        color: #6c757d;
        font-size: 0.875rem;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }

    .results-container {
        height: 20rem;
        width: 30rem;
        display: flex;
        flex-direction: column;
    }

    .search-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #6c757d;
        flex: 1;
        min-height: 200px;
        max-height: 300px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin: 1rem 0;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e9ecef;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    /* Fix dialog sizing */
    :global(.dialog-content) {
        min-height: 400px;
        max-height: 600px;
        display: flex;
        flex-direction: column;
    }

    .results-list {
        flex: 1;
        min-height: 200px;
    }
</style>
