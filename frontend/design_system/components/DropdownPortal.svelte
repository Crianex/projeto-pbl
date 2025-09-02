<script lang="ts">
    import { onMount } from "svelte";
    import { activeDropdowns } from "./DropdownPortal";

    let portalElement: HTMLElement;

    onMount(() => {
        // Create portal container
        portalElement = document.createElement("div");
        portalElement.id = "dropdown-portal";
        portalElement.setAttribute("data-dropdown-portal", "true");
        portalElement.style.position = "fixed";
        portalElement.style.top = "0";
        portalElement.style.left = "0";
        portalElement.style.zIndex = "10000";
        portalElement.style.pointerEvents = "none";
        document.body.appendChild(portalElement);

        return () => {
            if (portalElement && document.body.contains(portalElement)) {
                document.body.removeChild(portalElement);
            }
        };
    });
</script>

<!-- Portal renders dropdowns at document body level -->
{#if portalElement}
    <div bind:this={portalElement}>
        {#each Array.from($activeDropdowns.values()) as dropdown (dropdown.id)}
            <div
                class="dropdown-portal-menu"
                data-dropdown-portal="menu"
                on:click|stopPropagation
                style="position: fixed; top: {dropdown.position
                    .top}px; left: {dropdown.position.left}px; width: {dropdown
                    .position.width}px; pointer-events: auto;"
                role="listbox"
            >
                <div class="dropdown-menu">
                    {#each dropdown.options as option}
                        <button
                            type="button"
                            class="dropdown-option"
                            class:selected={option.value === dropdown.value}
                            on:click|stopPropagation={() =>
                                dropdown.onSelect(option)}
                            role="option"
                            aria-selected={option.value === dropdown.value}
                            tabindex="-1"
                        >
                            {option.label}
                        </button>
                    {/each}
                    {#if dropdown.options.length === 0}
                        <div class="dropdown-empty">
                            Nenhuma opção disponível
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}

<style>
    .dropdown-portal-menu {
        z-index: 10000;
    }

    .dropdown-menu {
        background: var(--color-text-white);
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        max-height: 200px;
        overflow-y: auto;
        /* Ensure dropdown appears above all content */
        transform: translateZ(0);
        will-change: transform;
        /* Prevent clipping by parent containers */
        contain: none;
        /* Force highest stacking context */
        isolation: isolate;
    }

    .dropdown-option {
        width: 100%;
        padding: 0.65rem 0.8rem;
        border: none;
        background: transparent;
        color: var(--color-text-primary);
        cursor: pointer;
        text-align: left;
        font-size: 0.875rem;
        font-family: inherit;
        transition: background-color 0.15s ease;
        border-radius: 0;
    }

    .dropdown-option:first-child {
        border-radius: 10px 10px 0 0;
    }

    .dropdown-option:last-child {
        border-radius: 0 0 10px 10px;
    }

    .dropdown-option:only-child {
        border-radius: 10px;
    }

    .dropdown-option:hover {
        background: var(--color-bg-light);
    }

    .dropdown-option.selected {
        background: rgba(73, 184, 125, 0.1);
        color: var(--color-nature-main);
        font-weight: 600;
    }

    .dropdown-empty {
        padding: 0.65rem 0.8rem;
        color: var(--color-text-secondary);
        font-size: 0.875rem;
        text-align: center;
        font-style: italic;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .dropdown-menu {
            max-height: 150px;
        }
    }
</style>
