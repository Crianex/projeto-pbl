<script lang="ts">
    import { page } from "$app/stores";
    import { fade } from "svelte/transition";
    import SiteHeader from "./SiteHeader.svelte";
    import { DropdownPortal } from "$lib/design_system";

    export let type: "default" | "card-sized" = "default";
    export let showNavigation = false;
    export let pageTitle = "";
    export let backUrl: string | null = null;
    export let backText: string = "Voltar";
    export let headerContext: "landing" | "protected" | "download" = "landing";

    // Use the pathname as key to trigger transitions on route changes
    $: key = $page.url.pathname;

    // Check if current page is home to avoid layout constraints
    $: isHomePage = $page.url.pathname === "/";

    // Show header for protected pages or when explicitly requested
    $: shouldShowHeader =
        showNavigation ||
        backUrl ||
        $page.url.pathname.startsWith("/alunos") ||
        $page.url.pathname.startsWith("/turmas") ||
        $page.url.pathname.startsWith("/download") ||
        $page.url.pathname.startsWith("/home");
</script>

<div class="app-layout" class:has-header={shouldShowHeader}>
    <!-- Dropdown Portal - renders dropdowns at the top level -->
    <DropdownPortal />

    <!-- Site Header (show for protected pages or when explicitly requested) -->
    {#if shouldShowHeader}
        <SiteHeader
            context={headerContext as "download" | "landing" | "protected"}
        />
    {/if}

    <main class:home={isHomePage} class:card-sized={type === "card-sized"}>
        <div class="page-container" class:home={isHomePage}>
            <slot />
        </div>
    </main>
</div>

<style>
    .app-layout {
        min-height: 100dvh;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    main {
        flex: 1;
        margin: 0;
        padding: 0;
        width: 100%;
        position: relative;
    }

    /* Default layout for non-home pages */
    .page-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        will-change: transform, opacity;
        padding-left: 2rem;
        padding-right: 2rem;
        box-sizing: border-box;
    }

    /* When header is present, adjust page container to not overflow */
    :global(.has-header) .page-container {
        height: calc(100vh - var(--header-height, 80px));
        top: var(--header-height, 80px);
    }

    /* Card-sized layout */
    :global(.card-sized) .page-container {
        max-width: 40rem;
        margin: 0 auto;
        background: #fff;
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.08),
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 3px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.3s ease;
        align-items: stretch;
    }

    :global(.card-sized) .page-container:hover {
        box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.12),
            0 15px 30px rgba(0, 0, 0, 0.08),
            0 8px 15px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
    }

    /* Remove layout constraints for home page and protected pages */
    .page-container.home,
    .page-container {
        position: static;
        height: auto;
        min-height: 100%;
        justify-content: flex-start;
    }

    /* Override: card-sized should not force full-height */
    :global(.card-sized) .page-container {
        min-height: auto;
    }

    /* Override for protected pages - they should have normal flow */
    :global(.protected-layout) .page-container {
        position: static;
        height: auto;
        min-height: auto;
        justify-content: center;
        align-items: center;
        padding: 1.5rem;
        max-width: 80rem;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
    }

    main.home {
        height: auto;
        min-height: 100dvh;
    }

    /* Center card-sized content */
    :global(.card-sized) {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100dvh;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }
        :global(.protected-layout) .page-container {
            padding: 1rem;
        }

        :global(.card-sized) .page-container {
            padding: 1rem;
            margin: 1rem;
            max-width: calc(100% - 2rem);
            border-radius: 16px;
        }

        /* Adjust header height on mobile */
        :global(.has-header) .page-container {
            --header-height: 60px;
        }
    }

    @media (max-width: 480px) {
        .page-container {
            padding: 0.75rem;
        }
        :global(.protected-layout) .page-container {
            padding: 0.75rem;
        }

        :global(.card-sized) .page-container {
            padding: 0.75rem;
            margin: 0.75rem;
            max-width: calc(100% - 1.5rem);
        }
    }
</style>
