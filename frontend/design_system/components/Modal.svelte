<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { clickOutside } from "$lib/utils/clickOutside";

    export let open: boolean = false;
    export let title: string = "";
    export let size: "sm" | "md" | "lg" | "xl" = "md";
    export let closeOnEscape: boolean = true;
    export let closeOnClickOutside: boolean = true;

    const dispatch = createEventDispatcher();

    function close() {
        dispatch("close");
        open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && closeOnEscape) {
            close();
        }
    }

    function handleClickOutside(event?: MouseEvent) {
        if (!closeOnClickOutside) return;

        if (event) {
            const target = event.target as Element;

            // Don't close modal if click is inside a dropdown menu
            if (
                target.closest(".dropdown-portal-menu") ||
                target.closest(".dropdown-menu") ||
                target.closest("[data-dropdown-portal]") ||
                target.closest(".modal-container")
            ) {
                return;
            }
        }

        close();
    }

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };
</script>

{#if open}
    <div
        class="modal-overlay"
        transition:fade={{ duration: 200 }}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <div
            class="modal-container {sizeClasses[size]}"
            transition:scale={{ duration: 200, start: 0.95 }}
            use:clickOutside={handleClickOutside}
            on:click|stopPropagation
        >
            <div class="modal-header">
                {#if title}
                    <h2 id="modal-title" class="modal-title">{title}</h2>
                {/if}
                <button
                    class="modal-close-btn"
                    on:click={close}
                    aria-label="Close modal"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="modal-content">
                <slot />
            </div>

            {#if $$slots.footer}
                <div class="modal-footer">
                    <slot name="footer" />
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        box-sizing: border-box;
    }

    .modal-container {
        background: var(--color-bg-white);
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        width: 100%;
        padding: 2rem 1.5rem;
        box-sizing: border-box;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        /* Allow dropdowns to extend beyond modal bounds */
        overflow: visible;
        /* Ensure dropdowns can appear above modal */
        z-index: 100;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-border-light);
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
    }

    .modal-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-font-heading-dark);
        margin: 0;
    }

    .modal-close-btn {
        background: none;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 8px;
        transition: all 0.2s ease;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close-btn:hover {
        background: var(--color-bg-light);
        color: var(--color-text-primary);
    }

    .modal-close-btn svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .modal-content {
        max-height: calc(90vh - 140px);
        overflow-y: auto;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--color-border-light);
        margin-top: 1.5rem;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    .max-w-md {
        max-width: 28rem;
    }

    .max-w-lg {
        max-width: 32rem;
    }

    .max-w-2xl {
        max-width: 42rem;
    }

    .max-w-4xl {
        max-width: 56rem;
    }

    @media (max-width: 768px) {
        .modal-overlay {
            padding: 0.5rem;
        }

        .modal-container {
            max-height: 95vh;
        }

        .modal-header,
        .modal-content,
        .modal-footer {
            padding-left: 1rem;
            padding-right: 1rem;
        }

        .modal-title {
            font-size: 1.25rem;
        }
    }
</style>
