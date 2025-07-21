<script lang="ts">
    export let variant: "primary" | "secondary" | "danger" = "primary";
    export let disabled = false;
    export let type: "button" | "submit" | "reset" = "button";
    export let loading = false;
    export let href: string | undefined = undefined;
</script>

{#if href}
    <a
        {href}
        class="button {variant} {$$props.class || ''}"
        aria-disabled={disabled}
        tabindex={disabled ? -1 : 0}
        {...$$restProps}
    >
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        <slot />
    </a>
{:else}
    <button
        {type}
        class="button {variant} {$$props.class || ''}"
        {disabled}
        class:loading
        on:click
        {...$$restProps}
    >
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        <slot />
    </button>
{/if}

<style>
    .button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        letter-spacing: 0.025em;
        position: relative;
        overflow: hidden;
    }

    .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
    }

    .button:active:not(:disabled) {
        transform: translateY(1px);
    }

    .primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow:
            0 10px 25px rgba(102, 126, 234, 0.3),
            0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow:
            0 15px 35px rgba(102, 126, 234, 0.4),
            0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .secondary {
        background: rgba(255, 255, 255, 0.9);
        color: #667eea;
        border: 2px solid #667eea;
        backdrop-filter: blur(10px);
        box-shadow:
            0 8px 20px rgba(102, 126, 234, 0.15),
            0 3px 8px rgba(102, 126, 234, 0.1);
    }

    .secondary:hover:not(:disabled) {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-2px);
        box-shadow:
            0 12px 25px rgba(102, 126, 234, 0.2),
            0 5px 12px rgba(102, 126, 234, 0.15);
    }

    .danger {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        color: white;
        box-shadow:
            0 10px 25px rgba(238, 90, 82, 0.3),
            0 4px 12px rgba(238, 90, 82, 0.2);
    }

    .danger:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow:
            0 15px 35px rgba(238, 90, 82, 0.4),
            0 8px 20px rgba(238, 90, 82, 0.3);
    }

    .loading-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
