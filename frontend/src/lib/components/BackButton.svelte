<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch("click");
    }
</script>

<button class="back-btn" on:click={handleClick}>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
    >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
</button>

<style>
    .back-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .back-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        transform: scale(1.1);
    }
</style>
