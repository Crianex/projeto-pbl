<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let open = false;
    export let size: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "primary" | "secondary" = "default";
    export let className = "";

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch("toggle");
    }

    // Size configurations
    const sizes = {
        sm: "16px",
        md: "20px",
        lg: "24px",
    };

    $: iconSize = sizes[size];
</script>

<!-- HamburgerMenu -->

<button
    class="hamburger-menu {className}"
    class:open
    class:primary={variant === "primary"}
    class:secondary={variant === "secondary"}
    on:click={handleClick}
    aria-label={open ? "Fechar menu" : "Abrir menu"}
    aria-expanded={open}
    type="button"
>
    <span class="hamburger-line" style="width: {iconSize}"></span>
    <span class="hamburger-line" style="width: {iconSize}"></span>
    <span class="hamburger-line" style="width: {iconSize}"></span>
</button>

<style>
    .hamburger-menu {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;
        width: 44px;
        height: 44px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        position: relative;
    }

    .hamburger-menu:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    .hamburger-menu.primary:hover {
        background: rgba(49, 184, 125, 0.1);
    }

    .hamburger-menu.secondary:hover {
        background: rgba(0, 123, 255, 0.1);
    }

    .hamburger-line {
        height: 2px;
        background: #363636;
        transition: all 0.3s ease;
        transform-origin: center;
        border-radius: 1px;
    }

    .hamburger-menu.primary .hamburger-line {
        background: #31b87d;
    }

    .hamburger-menu.secondary .hamburger-line {
        background: #007bff;
    }

    /* Animated hamburger icon */
    .hamburger-menu.open .hamburger-line:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger-menu.open .hamburger-line:nth-child(2) {
        opacity: 0;
    }

    .hamburger-menu.open .hamburger-line:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Focus styles for accessibility */
    .hamburger-menu:focus {
        outline: 2px solid #31b87d;
        outline-offset: 2px;
    }

    .hamburger-menu.primary:focus {
        outline-color: #31b87d;
    }

    .hamburger-menu.secondary:focus {
        outline-color: #007bff;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .hamburger-menu:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .hamburger-menu.primary:hover {
            background: rgba(49, 184, 125, 0.2);
        }

        .hamburger-menu.secondary:hover {
            background: rgba(0, 123, 255, 0.2);
        }

        .hamburger-line {
            background: #ffffff;
        }

        .hamburger-menu.primary .hamburger-line {
            background: #31b87d;
        }

        .hamburger-menu.secondary .hamburger-line {
            background: #007bff;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .hamburger-menu,
        .hamburger-line {
            transition: none;
        }
    }
</style>
