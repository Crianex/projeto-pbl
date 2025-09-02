<script lang="ts">
    export let variant:
        | "primary"
        | "secondary"
        | "danger"
        | "ghost"
        | "warning"
        | "outline"
        | "neutral" = "primary";
    export let size: "sm" | "md" | "large" | "icon" = "md";
    export let disabled = false;
    export let type: "button" | "submit" | "reset" = "button";
    export let loading = false;
    export let href: string | undefined = undefined;

    // Filter out props that could interfere with styling
    $: filteredProps = Object.fromEntries(
        Object.entries($$restProps).filter(
            ([key]) => !["class", "style"].includes(key),
        ),
    );
</script>

{#if href}
    <a
        {href}
        class="button {variant} {size} {$$props.class || ''}"
        aria-disabled={disabled}
        tabindex={disabled ? -1 : 0}
        {...filteredProps}
    >
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        <slot />
    </a>
{:else}
    <button
        {type}
        class="button {variant} {size} {$$props.class || ''}"
        class:loading
        on:click
        disabled={disabled || loading}
        {...filteredProps}
    >
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        <slot />
    </button>
{/if}

<style>
    /* Base button adjusted to follow download page visual style */
    .button {
        border: 2px solid var(--color-border-light);
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-decoration: none;
        font-family: inherit;
        background: var(--color-text-white);
        color: var(--color-text-primary);
        box-sizing: border-box;
        min-width: 200px; /* like download page */
        padding: 0.9rem 1.25rem;
        font-size: 1rem;
    }

    .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .button:not(:disabled):hover {
        transform: translateY(-2px);
    }

    .button:active:not(:disabled) {
        transform: translateY(0);
    }

    .primary {
        background: var(--color-nature-gradient, linear-gradient(135deg, #168F41 0%, #014619 100%));
        color: var(--color-text-white);
        border-color: var(--color-nature-main);
        box-shadow: 0 2px 4px var(--color-nature-shadow-light, rgba(22, 143, 65, 0.15));
    }

    .primary:hover:not(:disabled) {
        background: var(--color-nature-light-gradient, linear-gradient(135deg, #4ADE80 0%, #168F41 100%));
        transform: translateY(-2px);
        box-shadow: 0 4px 8px var(--color-nature-shadow, rgba(22, 143, 65, 0.3));
    }

    .secondary {
        background: var(--color-text-white);
        color: var(--color-secondary-main);
        border-color: var(--color-secondary-main);
        box-shadow: 0 2px 4px rgba(118, 75, 162, 0.15);
    }

    .secondary:hover:not(:disabled) {
        background: var(--color-secondary-light);
        color: var(--color-text-white);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(118, 75, 162, 0.3);
    }

    .danger {
        background: var(--color-error-main);
        color: var(--color-text-white);
        border-color: var(--color-error-main);
    }

    .ghost {
        background: transparent;
        color: var(--color-text-primary);
        border-color: transparent;
    }

    .warning {
        background: var(--color-warning-main);
        color: var(--color-text-white);
        border-color: var(--color-warning-main);
    }

    .outline {
        background: transparent;
        color: var(--color-nature-main);
        border-color: var(--color-nature-main);
        box-shadow: 0 1px 3px rgba(22, 143, 65, 0.1);
    }

    .outline:hover:not(:disabled) {
        background: var(--color-nature-background-light);
        color: var(--color-nature-dark);
        transform: translateY(-1px);
        box-shadow: 0 3px 6px var(--color-nature-shadow-light, rgba(22, 143, 65, 0.15));
    }

    .neutral {
        background: var(--color-text-white);
        color: var(--color-font-body-dark);
        border-color: var(--color-border-light);
    }

    .neutral:hover:not(:disabled) {
        background: var(--color-bg-light);
    }

    /* Size variants (kept for compatibility) */
    .sm {
        padding: 0.375rem 0.75rem;
        min-height: 2rem;
        font-size: 0.75rem;
        min-width: auto;
    }

    .md {
        padding: 0.5rem 1rem;
        min-height: 2.5rem;
        font-size: 0.875rem;
        min-width: 140px;
    }

    .large {
        padding: 0.9rem 1.25rem;
        min-height: 3rem;
        font-size: 1rem;
        min-width: 200px;
    }

    .icon {
        padding: 0.5rem;
        min-height: 2.5rem;
        min-width: 2.5rem;
        font-size: 0.875rem;
    }

    /* Icon sizing inside buttons
       Projects often provide svg icons inside the slot; this helps them size correctly. */
    .button :global(svg) {
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-radius: 50%;
        border-top: 2px solid currentColor;
        border-right: 2px solid rgba(255, 255, 255, 0.3);
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .button {
            min-width: 140px;
            padding: 0.75rem 1rem;
        }

        .sm {
            padding: 0.25rem 0.5rem;
            min-height: 1.75rem;
            font-size: 0.7rem;
        }

        .md {
            padding: 0.375rem 0.75rem;
            min-height: 2.25rem;
            font-size: 0.8rem;
        }

        .large {
            padding: 0.6rem 1rem;
            min-height: 2.5rem;
            font-size: 0.95rem;
            min-width: 160px;
        }
    }
</style>
