<script lang="ts">
    import Button from "./Button.svelte";
    import { createEventDispatcher } from "svelte";

    export let value = "";
    export let placeholder = "Search...";
    export let buttonText = "";
    export let showButton = true;
    export let buttonVariant: "primary" | "secondary" | "danger" = "primary";
    export let debounceMs = 300;

    const dispatch = createEventDispatcher<{
        search: string;
        change: string;
        buttonClick: void;
    }>();

    let timeoutId: NodeJS.Timeout;

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        clearTimeout(timeoutId);

        // Dispatch change event immediately
        dispatch("change", target.value);

        // Debounce search event
        timeoutId = setTimeout(() => {
            dispatch("search", target.value);
        }, debounceMs);
    }

    function handleButtonClick() {
        dispatch("buttonClick");
    }
</script>

<div class="search-bar">
    <input type="text" bind:value {placeholder} on:input={handleInput} />
    {#if showButton && buttonText}
        <Button
            variant={buttonVariant}
            class="action-button"
            on:click={handleButtonClick}
        >
            {buttonText}
        </Button>
    {/if}
</div>

<style>
    .search-bar {
        display: flex;
        gap: 1rem;
        align-items: center;
        width: 100%;
        max-width: 500px;
    }

    input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
    }

    input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    :global(.action-button) {
        flex: 1;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .search-bar {
            gap: 0.75rem;
            max-width: 400px;
        }

        input {
            padding: 0.875rem;
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .search-bar {
            flex-direction: row;
            gap: 0.75rem;
            max-width: 350px;
        }

        input {
            flex: 1;
            min-width: 0;
        }

        :global(.action-button) {
            flex: 1;
            min-width: 0;
        }
    }
</style>
