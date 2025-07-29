<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let text: string = "Voltar";

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch("click");
    }
</script>

<button class="back-btn" on:click={handleClick}>
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
    <span class="back-text">{text}</span>
</button>

<style>
    .back-btn {
        width: fit-content;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .back-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
    }

    .back-text {
        display: inline;
    }

    @media (max-width: 768px) {
        .back-text {
            display: none;
        }

        .back-btn {
            padding: 0.5rem;
        }
    }
</style>
