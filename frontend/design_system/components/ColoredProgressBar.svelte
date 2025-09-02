<script lang="ts">
    export let rightPercentage: number = 0;
    export let blankPercentage: number = 0;
    export let wrongPercentage: number = 0;
    export let height: number = 8;

    // Colors matching the Flutter theme
    const kSuccess = "#4ade80"; // green
    const kError = "#f87171"; // red
    const kOnSurface = "rgba(54, 54, 54, 0.3)"; // gray for blank

    // Ensure percentages add up to 100%
    $: total = rightPercentage + blankPercentage + wrongPercentage;
    $: adjustedRight = total > 0 ? (rightPercentage / total) * 100 : 0;
    $: adjustedBlank = total > 0 ? (blankPercentage / total) * 100 : 0;
    $: adjustedWrong = total > 0 ? (wrongPercentage / total) * 100 : 0;
</script>

<div class="progress-container" style="height: {height}px;">
    {#if total > 0}
        <!-- Correct answers segment -->
        {#if adjustedRight > 0}
            <div
                class="progress-segment correct"
                style="width: {adjustedRight}%;"
            ></div>
        {/if}

        <!-- Blank answers segment -->
        {#if adjustedBlank > 0}
            <div
                class="progress-segment blank"
                style="width: {adjustedBlank}%;"
            ></div>
        {/if}

        <!-- Wrong answers segment -->
        {#if adjustedWrong > 0}
            <div
                class="progress-segment wrong"
                style="width: {adjustedWrong}%;"
            ></div>
        {/if}
    {/if}
</div>

<style>
    .progress-container {
        width: 100%;
        display: flex;
        border-radius: 4px;
        overflow: hidden;
        background-color: rgba(54, 54, 54, 0.1);
    }

    .progress-segment {
        height: 100%;
        transition: width 0.3s ease;
    }

    .correct {
        background-color: #4ade80;
    }

    .blank {
        background-color: rgba(54, 54, 54, 0.3);
    }

    .wrong {
        background-color: #f87171;
    }
</style>
