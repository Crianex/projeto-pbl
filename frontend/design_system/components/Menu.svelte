<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    export let open = false;
    export let placement:
        | "bottom-start"
        | "bottom-end"
        | "top-start"
        | "top-end" = "bottom-end";

    let rootEl: HTMLElement;

    function toggle(event?: MouseEvent) {
        event?.stopPropagation();
        open = !open;
    }

    function close() {
        open = false;
    }

    function handleDocumentClick(ev: MouseEvent) {
        const target = ev.target as Node | null;
        if (!target) return;
        if (!rootEl?.contains(target)) {
            close();
        }
    }

    function handleKeydown(ev: KeyboardEvent) {
        if (ev.key === "Escape") {
            close();
        }
    }

    onMount(() => {
        document.addEventListener("click", handleDocumentClick, true);
        document.addEventListener("keydown", handleKeydown, true);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleDocumentClick, true);
        document.removeEventListener("keydown", handleKeydown, true);
    });
</script>

<div class="menu-root" bind:this={rootEl}>
    <div class="menu-trigger" on:click|stopPropagation={toggle}>
        <slot name="trigger" />
    </div>

    {#if open}
        <div class="menu-content {placement}" role="menu" aria-hidden={!open}>
            <slot name="content" />
        </div>
    {/if}
    <!-- clicking inside content should not bubble to document -->
</div>

<svelte:window on:scroll={() => (open = false)} />

<style>
    .menu-root {
        position: relative;
        display: inline-block;
    }

    .menu-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .menu-content {
        position: absolute;
        z-index: 1000;
        background: var(--color-text-white);
        border: 2px solid var(--color-border-light);
        border-radius: 12px; /* match Button radius */
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        padding: 6px 0;
        min-width: 160px;
        box-sizing: border-box;
    }

    .menu-content.bottom-start {
        top: calc(100% + 8px);
        left: 0;
    }

    .menu-content.bottom-end {
        top: calc(100% + 8px);
        right: 0;
    }

    .menu-content.top-start {
        bottom: calc(100% + 8px);
        left: 0;
    }

    .menu-content.top-end {
        bottom: calc(100% + 8px);
        right: 0;
    }

    /* Recommended defaults for items placed inside the menu */
    :global(.menu-item) {
        width: 100%;
        padding: 12px 16px;
        background: transparent;
        border: none;
        text-align: left;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-font-body-dark);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.15s ease;
    }

    :global(.menu-item:hover) {
        background: var(--color-bg-light);
    }

    :global(.menu-item.danger) {
        color: var(--color-error-main);
    }

    :global(.menu-item.danger:hover) {
        background: rgba(239, 68, 68, 0.08);
    }

    @media (max-width: 768px) {
        .menu-content {
            min-width: 140px;
            border-radius: 10px;
        }
    }
</style>
