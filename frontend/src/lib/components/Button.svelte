<script lang="ts">
    export let variant: "primary" | "secondary" | "danger" | "ghost" = "primary";
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
        {disabled}
        class:loading
        on:click
        {...filteredProps}
    >
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        <slot />
    </button>
{/if}

<style>
    .button {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-decoration: none;
        font-family: inherit;
        background: white;
        color: #374151;
        box-sizing: border-box;
    }

    .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .button:hover:not(:disabled) {
        border-color: #d1d5db;
        background: #f9fafb;
    }

    .button:active:not(:disabled) {
        background: #f3f4f6;
    }

    .primary {
        background: var(--color-nature-main);
        color: white;
        border-color: var(--color-nature-main);
    }

    .primary:hover:not(:disabled) {
        background: var(--color-nature-light);
        border-color: var(--color-nature-light);
    }

    .primary:active:not(:disabled) {
        background: var(--color-nature-dark);
    }

    .secondary {
        background: white;
        color: var(--color-nature-main);
        border-color: var(--color-nature-main);
    }

    .secondary:hover:not(:disabled) {
        background: var(--color-nature-background-light);
        border-color: var(--color-nature-light);
    }

    .secondary:active:not(:disabled) {
        background: var(--color-nature-background);
    }

    .danger {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
    }

    .danger:hover:not(:disabled) {
        background: #dc2626;
        border-color: #dc2626;
    }

    .danger:active:not(:disabled) {
        background: #b91c1c;
    }

    .ghost {
        background: transparent;
        color: white;
        border-color: transparent;
    }

    .ghost:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .ghost:active:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
    }

    /* Size variants */
    .sm {
        padding: 0.375rem 0.75rem;
        min-height: 2rem;
        font-size: 0.75rem;
    }

    .md {
        padding: 0.5rem 1rem;
        min-height: 2.5rem;
        font-size: 0.875rem;
    }

    .large {
        padding: 0.75rem 1.5rem;
        min-height: 3rem;
        font-size: 1rem;
    }

    .icon {
        padding: 0.5rem;
        min-height: 2.5rem;
        min-width: 2.5rem;
        font-size: 0.875rem;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: currentColor;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
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
            padding: 0.5rem 1rem;
            min-height: 2.5rem;
            font-size: 0.9rem;
        }

        .icon {
            padding: 0.375rem;
            min-height: 2.25rem;
            min-width: 2.25rem;
        }
    }

    @media (max-width: 480px) {
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
            padding: 0.5rem 1rem;
            min-height: 2.5rem;
            font-size: 0.9rem;
        }

        .icon {
            padding: 0.375rem;
            min-height: 2.25rem;
            min-width: 2.25rem;
        }
    }
</style>
