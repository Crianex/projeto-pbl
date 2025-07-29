<script lang="ts">
    import Button from "./Button.svelte";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher();

    let windowWidth = 0;

    onMount(() => {
        // Set initial value
        windowWidth = window.innerWidth;

        // Add resize listener
        const handleResize = () => {
            windowWidth = window.innerWidth;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    });

    function setPage(page: number) {
        if (page < 1 || page > totalPages || page === currentPage) return;
        dispatch("pageChange", { page });
    }

    // Calculate which page numbers to show
    $: isMobile = windowWidth <= 768;
    $: visiblePages = (() => {
        const maxVisiblePages = isMobile ? 3 : 5;

        if (totalPages < maxVisiblePages) {
            // If fewer than the limit, show all
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];

        // Always show first page
        pages.push(1);

        // Calculate start and end of middle section
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        // Adjust if we're near the beginning
        if (currentPage <= 3) {
            end = Math.min(totalPages - 1, 4);
        }

        // Adjust if we're near the end
        if (currentPage >= totalPages - 2) {
            start = Math.max(2, totalPages - 3);
        }

        // Add ellipsis and middle pages
        if (start > 2) {
            pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push("...");
        }

        // Always show last page if more than 1 page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    })();
</script>

<div class="pagination">
    <div class="page-numbers">
        {#each visiblePages as page}
            {#if page === "..."}
                <span class="ellipsis">...</span>
            {:else}
                <Button
                    variant={currentPage === page ? "primary" : "secondary"}
                    class="page-number"
                    on:click={() => setPage(page as number)}
                    {disabled}
                >
                    {page}
                </Button>
            {/if}
        {/each}
    </div>

    <div class="page-navigation">
        <Button
            variant="secondary"
            class="page-nav"
            disabled={currentPage === 1 || disabled}
            on:click={() => setPage(currentPage - 1)}
        >
            ←
        </Button>

        <Button
            variant="secondary"
            class="page-nav"
            disabled={currentPage === totalPages || disabled}
            on:click={() => setPage(currentPage + 1)}
        >
            →
        </Button>
    </div>
</div>

<style>
    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
        align-items: center;
    }

    .page-numbers {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .page-navigation {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    .page-nav,
    .page-number {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        background: white;
        cursor: pointer;
        border-radius: 4px;
    }

    .page-nav {
        min-width: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    .page-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .page-number.active {
        background: #0d6efd;
        color: white;
        border-color: #0d6efd;
    }
    .page-nav:hover:not(:disabled),
    .page-number:hover:not(.active) {
        background: #f8f9fa;
    }
    .ellipsis {
        padding: 0.5rem 0.75rem;
        color: #6c757d;
        font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .pagination {
            gap: 0.375rem;
            margin-top: 1.5rem;
            flex-direction: column;
            align-items: center;
        }

        .page-numbers {
            display: flex;
            gap: 0.375rem;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .page-navigation {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .page-nav {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
        }

        .page-number {
            padding: 0.625rem 0.875rem;
            font-size: 0.9rem;
        }
    }

    @media (max-width: 480px) {
        .pagination {
            gap: 0.25rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }

        .page-nav,
        .page-number {
            padding: 0.75rem 1rem;
            font-size: 1rem;
            min-width: 44px;
        }
    }
</style>
