<script lang="ts">
    import Button from "./Button.svelte";
    import { createEventDispatcher } from "svelte";

    export let currentPage: number = 1;
    export let totalPages: number = 1;
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher();

    function setPage(page: number) {
        if (page < 1 || page > totalPages || page === currentPage) return;
        dispatch("pageChange", { page });
    }
</script>

<div class="pagination">
    <Button
        variant="secondary"
        class="page-nav"
        disabled={currentPage === 1 || disabled}
        on:click={() => setPage(currentPage - 1)}
    >
        Previous
    </Button>

    {#each Array(totalPages) as _, i}
        <Button
            variant={currentPage === i + 1 ? "primary" : "secondary"}
            class="page-number"
            on:click={() => setPage(i + 1)}
            {disabled}
        >
            {i + 1}
        </Button>
    {/each}

    <Button
        variant="secondary"
        class="page-nav"
        disabled={currentPage === totalPages || disabled}
        on:click={() => setPage(currentPage + 1)}
    >
        Next
    </Button>
</div>

<style>
    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
    }
    .page-nav,
    .page-number {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        background: white;
        cursor: pointer;
        border-radius: 4px;
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
</style>
