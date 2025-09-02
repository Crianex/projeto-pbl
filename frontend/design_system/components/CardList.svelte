<script lang="ts">
    export let items: any[] = [];
    export let loading = false;
    export let error: string | null = null;
    export let emptyMessage = "Nenhum item encontrado.";
    export let loadingMessage = "Carregando...";
    export let showRetryButton = false;
    export let onRetry: (() => void) | null = null;
</script>

{#if loading}
    <div class="loading">{loadingMessage}</div>
{:else if error}
    <div class="error">
        <p>{error}</p>
        {#if showRetryButton && onRetry}
            <button class="retry-button" on:click={onRetry}
                >Tentar novamente</button
            >
        {/if}
    </div>
{:else if items.length === 0}
    <div class="empty-state">
        <p>{emptyMessage}</p>
    </div>
{:else}
    <div class="card-list">
        <slot {items} />
    </div>
{/if}

<style>
    .card-list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
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

    .retry-button {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .retry-button:hover {
        background: #5a6268;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .card-list {
            gap: 0.2rem;
        }

        .loading,
        .error,
        .empty-state {
            padding: 2rem;
        }
    }

    @media (max-width: 480px) {
        .card-list {
            gap: 0.15rem;
        }

        .loading,
        .error,
        .empty-state {
            padding: 2.5rem;
        }
    }
</style>
