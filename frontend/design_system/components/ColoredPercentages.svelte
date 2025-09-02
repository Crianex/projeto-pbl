<script lang="ts">
    import { Typography } from "$lib/design_system";

    export let rightPercentage: number = 0;
    export let blankPercentage: number = 0;
    export let wrongPercentage: number = 0;
    export let questionCount: number | undefined = undefined;
    export let fontSize: number = 11;

    // Colors matching the Flutter theme
    const kSuccess = "#4ade80"; // green
    const kError = "#f87171"; // red
    const kOnSurface = "rgba(54, 54, 54, 0.3)"; // gray for blank
</script>

<div class="colored-percentages">
    <!-- Correct answers -->
    <div class="percentage-item">
        <span class="percentage-text correct" style="font-size: {fontSize}px;">
            {rightPercentage.toFixed(1)}%
        </span>
    </div>

    <!-- Blank answers -->
    <div class="percentage-item">
        <span class="percentage-text blank" style="font-size: {fontSize}px;">
            {blankPercentage.toFixed(1)}%
        </span>
    </div>

    <!-- Wrong answers -->
    <div class="percentage-item">
        <span class="percentage-text wrong" style="font-size: {fontSize}px;">
            {wrongPercentage.toFixed(1)}%
        </span>
    </div>

    {#if questionCount !== undefined}
        <div class="question-count">
            <span
                class="question-count-text"
                style="font-size: {fontSize - 1}px;"
            >
                ({questionCount})
            </span>
        </div>
    {/if}
</div>

<style>
    .colored-percentages {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .percentage-item {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
    }

    .percentage-text {
        font-weight: 600;
    }

    .correct {
        color: #4ade80;
    }

    .blank {
        color: rgba(54, 54, 54, 0.3);
    }

    .wrong {
        color: #f87171;
    }

    .question-count {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
    }

    .question-count-text {
        color: rgba(54, 54, 54, 0.6);
        font-weight: 500;
    }
</style>
