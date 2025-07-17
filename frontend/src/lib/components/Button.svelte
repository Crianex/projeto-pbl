<script lang="ts">
    export let variant: "primary" | "secondary" | "danger" = "primary";
    export let disabled = false;
    export let type: "button" | "submit" | "reset" = "button";
    export let loading = false;
</script>

<button {type} class="button {variant}" {disabled} class:loading on:click>
    {#if loading}
        <div class="loading-spinner"></div>
    {/if}
    <slot />
</button>

<style>
    .button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            background-color 0.2s,
            transform 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
    }

    .button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .button:active:not(:disabled) {
        transform: scale(0.98);
    }

    .primary {
        background-color: #0f62fe;
        color: white;
    }

    .primary:hover:not(:disabled) {
        background-color: #0043ce;
    }

    .secondary {
        background-color: #ffffff;
        color: #0f62fe;
        border: 2px solid #0f62fe;
    }

    .secondary:hover:not(:disabled) {
        background-color: #f4f4f4;
    }

    .danger {
        background-color: #da1e28;
        color: white;
    }

    .danger:hover:not(:disabled) {
        background-color: #bc1a23;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
