<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";

    export let open = false;
    export let placement: "left" | "right" = "left";
    export let size: "sm" | "md" | "lg" | "xl" = "md";
    export let closeOnOutsideClick = true;
    export let closeOnEscape = true;

    const dispatch = createEventDispatcher();

    // Size configurations
    const sizes = {
        sm: "280px",
        md: "320px",
        lg: "360px",
        xl: "400px",
    };

    let drawerElement: HTMLElement;
    let overlayElement: HTMLElement;

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && closeOnEscape && open) {
            dispatch("close");
        }
    }

    function handleOutsideClick(event: MouseEvent) {
        if (closeOnOutsideClick && event.target === overlayElement) {
            dispatch("close");
        }
    }

    onMount(() => {
        document.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        document.removeEventListener("keydown", handleKeydown);
    });

    $: if (open) {
        // Prevent body scroll when drawer is open
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
</script>

{#if open}
    <!-- Overlay -->
    <div
        bind:this={overlayElement}
        class="drawer-overlay"
        on:click={handleOutsideClick}
        transition:fade={{ duration: 200 }}
        role="presentation"
    ></div>

    <!-- Drawer -->
    <div
        bind:this={drawerElement}
        class="drawer"
        class:left={placement === "left"}
        class:right={placement === "right"}
        style="--drawer-width: {sizes[size]}"
        transition:fade={{ duration: 200 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
    >
        <div class="drawer-content">
            <slot />
        </div>
    </div>
{/if}

<style>
    .drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        backdrop-filter: blur(2px);
    }

    .drawer {
        position: fixed;
        top: 0;
        height: 100%;
        width: var(--drawer-width, 320px);
        background: #ffffff;
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 1000;
        overflow-y: auto;
        border-radius: 0 12px 12px 0;
    }

    .drawer.left {
        left: 0;
        transform: translateX(-100%);
        animation: slideInLeft 0.3s ease-out forwards;
    }

    .drawer.right {
        right: 0;
        transform: translateX(100%);
        animation: slideInRight 0.3s ease-out forwards;
    }

    .drawer-content {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
        }
        to {
            transform: translateX(0);
        }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
        .drawer {
            width: 280px;
            border-radius: 0 16px 16px 0;
        }

        .drawer-overlay {
            background: rgba(0, 0, 0, 0.6);
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .drawer {
            background: #1a1a1a;
            color: #ffffff;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .drawer-overlay,
        .drawer {
            transition: none;
        }

        .drawer.left,
        .drawer.right {
            animation: none;
        }
    }
</style>
