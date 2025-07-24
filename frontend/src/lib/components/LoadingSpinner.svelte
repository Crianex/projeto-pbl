<script lang="ts">
    export let message: string = "";
    export let size: "sm" | "md" | "lg" = "md";
    export let color: "primary" | "secondary" | "gray" = "primary";
    export let overlay: boolean = false;

    // Map size prop to rem values
    const sizeMap = {
        sm: "1.25rem",
        md: "2rem",
        lg: "3rem",
    };
    $: spinnerSize = sizeMap[size] || sizeMap.md;

    // Map color prop to border-top-color
    const colorMap = {
        primary: "#3b82f6", // blue-500
        secondary: "#38b2ac", // teal-400
        gray: "#a0aec0", // gray-400
    };
    $: spinnerColor = colorMap[color] || colorMap.primary;
</script>

{#if overlay}
    <div class="spinner-overlay">
        <div class="loading-container">
            <div
                class="loading-spinner"
                style="width: {spinnerSize}; height: {spinnerSize}; border-top-color: {spinnerColor};"
            ></div>
            {#if message}
                <p>{message}</p>
            {/if}
            <slot />
        </div>
    </div>
{:else}
    <div class="loading-container">
        <div
            class="loading-spinner"
            style="width: {spinnerSize}; height: {spinnerSize}; border-top-color: {spinnerColor};"
        ></div>
        {#if message}
            <p>{message}</p>
        {/if}
        <slot />
    </div>
{/if}

<style>
    .spinner-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 255, 255, 0.7);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 50vh;
        gap: 1rem;
    }

    .loading-spinner {
        border: 2px solid #e2e8f0;
        /* border-top-color is set inline */
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
