<script lang="ts">
    export let padding: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "elevated" | "bordered" = "default";
    export let clickable: boolean = false;
    export let fullWidth: boolean = false;
    export let className = "";
    export let borderColor: string | undefined = undefined;
</script>

{#if clickable}
    <button
        class={`ds-card ${variant} ${padding} ${className}`}
        class:clickable={true}
        class:full-width={fullWidth}
        style={borderColor ? `--custom-border-color: ${borderColor}` : ""}
        type="button"
        on:click
        on:keydown
    >
        <slot />
    </button>
{:else}
    <div
        class={`ds-card ${variant} ${padding} ${className}`}
        class:full-width={fullWidth}
        style={borderColor ? `--custom-border-color: ${borderColor}` : ""}
    >
        <slot />
    </div>
{/if}

<style>
    .ds-card {
        background: var(--color-bg-white);
        border-radius: 12px;
        box-sizing: border-box;
        transition: all 0.2s ease;
        width: 100%;
        border: 0;
        -webkit-appearance: none;
        appearance: none;
        color: inherit;
        font: inherit;
        border: 1px solid var(--color-border-light);
        box-shadow: 0 6px 20px var(--color-shadow-light);
    }

    /* Padding sizes */
    .ds-card.sm {
        padding: 1rem;
    }
    .ds-card.md {
        padding: 1.5rem;
    }
    .ds-card.lg {
        padding: 2rem;
    }

    @media (max-width: 768px) {
        .ds-card.sm {
            padding: 0.75rem;
        }
        .ds-card.md {
            padding: 1rem;
        }
        .ds-card.lg {
            padding: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .ds-card.sm {
            padding: 0.5rem;
        }
        .ds-card.md {
            padding: 0.75rem;
        }
        .ds-card.lg {
            padding: 1rem;
        }
    }

    /* Variants */
    .ds-card.default {
        border: 1px solid var(--custom-border-color, var(--color-border-light));
        box-shadow: 0 6px 20px var(--color-shadow-light);
    }

    .ds-card.elevated {
        border: 1px solid var(--custom-border-color, var(--color-border-light));
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .ds-card.bordered {
        border: 2px solid var(--custom-border-color, var(--color-border-light));
        box-shadow: none;
    }

    /* Clickable interactions */
    .ds-card.clickable {
        cursor: pointer;
    }
    .ds-card.clickable:hover {
        border-color: var(--color-nature-main);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
    .ds-card.clickable:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .ds-card.clickable:focus {
        outline: none;
        border-color: var(--color-nature-main);
    }

    /* Full-width */
    .ds-card.full-width {
        max-width: none;
    }
</style>
