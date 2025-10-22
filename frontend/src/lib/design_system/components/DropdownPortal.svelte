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
                on:keydown|stopPropagation
                style="position: fixed; top: {dropdown.position
                    .top}px; left: {dropdown.position.left}px; width: {dropdown
                    .position.width}px; pointer-events: auto;"
                role="listbox"
                tabindex="-1"
            >
                <div class="dropdown-menu">
                    {#each dropdown.options as option}
                        <button
                            type="button"
                            class="dropdown-option"
                            class:selected={dropdown.isMultiSelect
                                ? dropdown.selectedValues?.includes(
                                      option.value,
                                  )
                                : option.value === dropdown.value}
                            class:select-all={option.value === "__select_all__"}
                            class:select-all-checked={option.value ===
                                "__select_all__" && dropdown.isAllSelected}
                            class:select-all-partial={option.value ===
                                "__select_all__" &&
                                dropdown.isPartiallySelected}
                            on:click|stopPropagation={(e) =>
                                dropdown.onSelect(option, e.shiftKey)}
                            role="option"
                            aria-selected={dropdown.isMultiSelect
                                ? dropdown.selectedValues?.includes(
                                      option.value,
                                  )
                                : option.value === dropdown.value}
                            tabindex="-1"
                        >
                            {#if dropdown.isMultiSelect}
                                <div class="checkbox-container">
                                    {#if option.value === "__select_all__"}
                                        <div
                                            class="checkbox"
                                            class:checked={dropdown.isAllSelected}
                                            class:partial={dropdown.isPartiallySelected}
                                        >
                                            {#if dropdown.isAllSelected}
                                                ✓
                                            {:else if dropdown.isPartiallySelected}
                                                −
                                            {/if}
                                        </div>
                                    {:else}
                                        <div
                                            class="checkbox"
                                            class:checked={dropdown.selectedValues?.includes(
                                                option.value,
                                            )}
                                        >
                                            {#if dropdown.selectedValues?.includes(option.value)}
                                                ✓
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                            <span class="option-label">{option.label}</span>
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
        max-height: 40vh;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
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

    /* Multiselect specific styles */
    .checkbox-container {
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .checkbox {
        width: 16px;
        height: 16px;
        border: 2px solid var(--color-border-light);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.15s ease;
        background: var(--color-text-white);
    }

    .checkbox.checked {
        background: var(--color-nature-main);
        border-color: var(--color-nature-main);
        color: var(--color-text-white);
    }

    .checkbox.partial {
        background: rgba(73, 184, 125, 0.3);
        border-color: var(--color-nature-main);
        color: var(--color-nature-main);
    }

    .option-label {
        flex: 1;
        text-align: left;
    }

    .select-all {
        border-bottom: 1px solid var(--color-border-light);
        margin-bottom: 0.25rem;
        font-weight: 600;
    }

    .select-all-checked {
        background: rgba(73, 184, 125, 0.05);
    }

    .select-all-partial {
        background: rgba(73, 184, 125, 0.02);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .dropdown-menu {
            max-height: 150px;
        }

        .checkbox {
            width: 14px;
            height: 14px;
            font-size: 10px;
        }

        .dropdown-option {
            gap: 0.375rem;
        }
    }
</style>
