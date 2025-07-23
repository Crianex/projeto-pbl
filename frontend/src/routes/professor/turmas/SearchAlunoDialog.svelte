<script lang="ts">
    import Dialog from "$lib/components/Dialog.svelte";
    import Button from "$lib/components/Button.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import { api } from "$lib/utils/api";
    import { debounce } from "lodash-es";
    import { onMount } from "svelte";

    export let open = false;
    export let exclude_turma_id: string | null = null;

    let searchQuery = "";
    let loading = false;
    let error: string | null = null;
    let results: AlunoModel[] = [];
    let hasInitialLoad = false;

    $: if (open && !hasInitialLoad) {
        hasInitialLoad = true;
        loadAllAlunos();
    }

    async function loadAllAlunos() {
        try {
            loading = true;
            error = null;
            const data = await api.get(
                `/alunos/search?query=%20&exclude_turma_id=${exclude_turma_id || ""}`,
            );
            results =  Parsers.parseAlunos(data.sort((a: any, b: any) =>
                a.nome_completo.localeCompare(b.nome_completo),
            ));

            
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Erro ao carregar alunos";
            console.error("Error loading alunos:", err);
        } finally {
            loading = false;
        }
    }

    const searchAlunos = debounce(async (query: string) => {
        if (!query.trim()) {
            loadAllAlunos();
            return;
        }

        try {
            loading = true;
            error = null;
            const data = await api.get(
                `/alunos/search?query=${encodeURIComponent(query)}&exclude_turma_id=${exclude_turma_id || ""}`,
            );
            results = Parsers.parseAlunos(data);
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Erro ao buscar alunos";
            console.error("Error searching alunos:", err);
        } finally {
            loading = false;
        }
    }, 300);

    function handleSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        searchAlunos(input.value);
    }

    function handleSelectAluno(aluno: (typeof results)[0]) {
        dispatch("select", aluno);
        handleClose();
    }

    function handleClose() {
        searchQuery = "";
        error = null;
        hasInitialLoad = false;
        dispatch("close");
    }

    import { createEventDispatcher } from "svelte";
    import type { AlunoModel } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    const dispatch = createEventDispatcher();
</script>

<Dialog {open} on:close={handleClose}>
    <div class="dialog-content">
        <h2>Adicionar Aluno</h2>

        <div class="search-container">
            <input
                type="text"
                bind:value={searchQuery}
                on:input={handleSearch}
                placeholder="Buscar aluno por nome..."
                class="search-input"
            />
        </div>

        {#if loading}
            <div class="status-message">Carregando alunos...</div>
        {:else if error}
            <div class="status-message error">{error}</div>
        {:else if results.length === 0}
            <div class="status-message">Nenhum aluno encontrado</div>
        {:else}
            <div class="results-list">
                {#each results as aluno (aluno.id)}
                    <button
                        class="result-item"
                        on:click={() => handleSelectAluno(aluno)}
                    >
                        <div class="aluno-info">
                            <Avatar 
                                src={aluno.link_avatar || "/avatars/default.png"} 
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
            </div>
        {/if}

        <div class="actions">
            <Button variant="secondary" type="button" on:click={handleClose}>
                Cancelar
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .dialog-content {
        min-width: 500px;
    }

    h2 {
        margin: 0 0 1.5rem;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .search-container {
        margin-bottom: 1rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 1rem;
    }

    .search-input:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .status-message {
        text-align: center;
        padding: 1rem;
        color: #6c757d;
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
        display: block;
        width: 100%;
        padding: 0.75rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-bottom: 1px solid #dee2e6;
    }

    .result-item:last-child {
        border-bottom: none;
    }

    .result-item:hover {
        background-color: #f8f9fa;
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
        justify-content: flex-end;
        margin-top: 1rem;
    }
</style>
