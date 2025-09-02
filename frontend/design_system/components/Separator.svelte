<script lang="ts">
    export let variant: "default" | "thick" | "dashed" | "dotted" = "default";
    export let color: string = "var(--color-border-light)";
    export let margin: "sm" | "md" | "lg" = "md";
    export let orientation: "horizontal" | "vertical" = "horizontal";
</script>

<div
    class="separator {variant} {margin} {orientation}"
    style="--separator-color: {color}"
    role="separator"
    aria-hidden="true"
/>

<style>
    .separator {
        border: none;
    }

    /* Horizontal separator */
    .separator.horizontal {
        width: 100%;
        height: 1px;
        margin: 0;
    }

    /* Vertical separator */
    .separator.vertical {
        width: 1px;
        height: 100%;
        margin: 0;
    }

    /* Variants */
    .separator.default {
    }

    .separator.thick {
        height: 2px;
    }

    .separator.thick.vertical {
        width: 2px;
        height: 100%;
    }

    .separator.dashed {
        background: repeating-linear-gradient(
            to right,
            var(--separator-color) 0,
            var(--separator-color) 4px,
            transparent 4px,
            transparent 8px
        );
    }

    .separator.dashed.vertical {
        background: repeating-linear-gradient(
            to bottom,
            var(--separator-color) 0,
            var(--separator-color) 4px,
            transparent 4px,
            transparent 8px
        );
    }

    .separator.dotted {
        background: repeating-linear-gradient(
            to right,
            var(--separator-color) 0,
            var(--separator-color) 2px,
            transparent 2px,
            transparent 4px
        );
    }

    .separator.dotted.vertical {
        background: repeating-linear-gradient(
            to bottom,
            var(--separator-color) 0,
            var(--separator-color) 2px,
            transparent 2px,
            transparent 4px
        );
    }

    /* Margin variants */
    .separator.sm {
        margin: 0.5rem 0;
    }

    .separator.sm.vertical {
        margin: 0 0.5rem;
    }

    .separator.md {
        margin: 1rem 0;
    }

    .separator.md.vertical {
        margin: 0 1rem;
    }

    .separator.lg {
        margin: 1.5rem 0;
    }

    .separator.lg.vertical {
        margin: 0 1.5rem;
    }
</style>
