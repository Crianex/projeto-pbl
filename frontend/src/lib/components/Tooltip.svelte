<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let title: string = "";
    export let position: "top" | "bottom" | "left" | "right" = "top";
    export let offset: number = 10;

    let visible = false;
    let x = 0;
    let y = 0;

    const dispatch = createEventDispatcher();

    function showTooltip(event: MouseEvent | FocusEvent) {
        if (title) {
            if (event instanceof MouseEvent) {
                x = event.clientX;
                y = event.clientY;
            } else {
                // For focus events, use the target element position
                const target = event.target as HTMLElement;
                const rect = target.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top;
            }
            visible = true;
        }
    }

    function hideTooltip() {
        visible = false;
    }
</script>

<div
    class="tooltip-trigger"
    on:mouseenter={showTooltip}
    on:mouseleave={hideTooltip}
    on:focus={showTooltip}
    on:blur={hideTooltip}
>
    <slot />
</div>

{#if visible}
    <div class="tooltip {position}" style="left: {x}px; top: {y}px;">
        {@html title}
    </div>
{/if}

<style>
    .tooltip-trigger {
        display: inline-block;
    }

    .tooltip {
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: normal;
        white-space: pre-wrap;
        max-width: 300px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        line-height: 1.4;
        pointer-events: none;
        transform: translate(10px, -100%);
    }

    /* Hide tooltip on mobile */
    @media (max-width: 768px) {
        .tooltip {
            display: none;
        }
    }
</style>
