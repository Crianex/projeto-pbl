<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { activeDropdowns } from "./DropdownPortal";

    export let options: Array<{ value: any; label: string }> = [];
    export let value: any[] = [];
    export let placeholder = "Selecione...";
    export let disabled = false;
    export let variant: "primary" | "secondary" | "outline" | "neutral" =
        "neutral";
    export let size: "sm" | "md" | "large" = "md";
    export let className = "";
    export let id: string | undefined;
    export let label: string | undefined;
    export let error: string | null = null;
    export let maxSelections: number | null = null;
    export let showSelectAll = true;

    const dispatch = createEventDispatcher<{
        change: {
            value: any[];
            selectedOptions: Array<{ value: any; label: string }>;
        };
    }>();

    let isOpen = false;
    let triggerElement: HTMLButtonElement;
    let selectedOptions: Array<{ value: any; label: string }> = [];
    let lastSelectedIndex: number | null = null; // Track last selected item for shift-click

    // Generate unique ID for this dropdown instance
    const dropdownId = `multiselect-${Math.random().toString(36).substr(2, 9)}`;

    let dropdownPosition = { top: 0, left: 0, width: 0 };

    // Update selected options when value changes
    $: {
        if (Array.isArray(value) && options.length > 0) {
            selectedOptions = options.filter((opt) =>
                value.includes(opt.value),
            );
        } else {
            selectedOptions = [];
        }
    }

    // Computed properties
    $: displayText = getDisplayText();
    $: isAllSelected =
        options.length > 0 && selectedOptions.length === options.length;
    $: isPartiallySelected =
        selectedOptions.length > 0 && selectedOptions.length < options.length;

    function getDisplayText(): string {
        if (selectedOptions.length === 0) {
            return placeholder;
        } else if (selectedOptions.length === 1) {
            return selectedOptions[0].label;
        } else if (selectedOptions.length <= 3) {
            return selectedOptions.map((opt) => opt.label).join(", ");
        } else {
            return `${selectedOptions.length} itens selecionados`;
        }
    }

    function calculatePosition() {
        if (!triggerElement) return;

        const rect = triggerElement.getBoundingClientRect();
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;

        dropdownPosition = {
            top: rect.bottom + scrollTop + 2,
            left: rect.left + scrollLeft,
            width: rect.width,
        };
    }

    function openDropdown() {
        if (disabled) return;

        calculatePosition();

        const extendedOptions = showSelectAll
            ? [
                  { value: "__select_all__", label: "Selecionar Nenhum" },
                  ...options,
              ]
            : options;

        activeDropdowns.update((dropdowns) => {
            const newDropdowns = new Map(dropdowns);
            newDropdowns.set(dropdownId, {
                id: dropdownId,
                options: extendedOptions,
                value: value,
                position: dropdownPosition,
                onSelect: (
                    option: { value: any; label: string },
                    isShiftClick?: boolean,
                ) => selectOption(option, isShiftClick),
                onClose: () => closeDropdown(),
                isMultiSelect: true,
                selectedValues: value,
                isAllSelected,
                isPartiallySelected,
            });
            return newDropdowns;
        });

        isOpen = true;
    }

    function closeDropdown() {
        activeDropdowns.update((dropdowns) => {
            const newDropdowns = new Map(dropdowns);
            newDropdowns.delete(dropdownId);
            return newDropdowns;
        });

        isOpen = false;
    }

    function toggleDropdown() {
        if (disabled) return;
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function selectOption(
        option: { value: any; label: string },
        isShiftClick: boolean = false,
    ) {
        if (option.value === "__select_all__") {
            toggleSelectAll();
            return;
        }

        const currentIndex = options.findIndex(
            (opt) => opt.value === option.value,
        );
        let newValue: any[];

        // Handle shift-click range selection
        if (isShiftClick && lastSelectedIndex !== null && currentIndex !== -1) {
            const startIndex = Math.min(lastSelectedIndex, currentIndex);
            const endIndex = Math.max(lastSelectedIndex, currentIndex);

            // Get all options in the range
            const rangeOptions = options.slice(startIndex, endIndex + 1);
            const rangeValues = rangeOptions.map((opt) => opt.value);

            // Check if we should select or deselect the range
            const shouldSelect = !value.includes(option.value);

            if (shouldSelect) {
                // Add all items in range to selection (respect max limit)
                const newItems = rangeValues.filter(
                    (val) => !value.includes(val),
                );
                if (
                    maxSelections &&
                    value.length + newItems.length > maxSelections
                ) {
                    // Only add up to the limit
                    const availableSlots = maxSelections - value.length;
                    newValue = [...value, ...newItems.slice(0, availableSlots)];
                } else {
                    newValue = [...value, ...newItems];
                }
            } else {
                // Remove all items in range from selection
                newValue = value.filter((val) => !rangeValues.includes(val));
            }
        } else {
            // Normal single-click behavior
            if (value.includes(option.value)) {
                // Remove from selection
                newValue = value.filter((v) => v !== option.value);
            } else {
                // Add to selection (check max limit)
                if (maxSelections && value.length >= maxSelections) {
                    return; // Don't add if max reached
                }
                newValue = [...value, option.value];
            }
        }

        // Update last selected index for future shift-clicks
        if (currentIndex !== -1) {
            lastSelectedIndex = currentIndex;
        }

        value = newValue;

        // Update the dropdown options to reflect new selection state
        if (isOpen) {
            openDropdown(); // Refresh the dropdown state
        }

        dispatch("change", {
            value: newValue,
            selectedOptions: options.filter((opt) =>
                newValue.includes(opt.value),
            ),
        });
    }

    function toggleSelectAll() {
        let newValue: any[];

        if (isAllSelected) {
            // Deselect all
            newValue = [];
        } else {
            // Select all (respect max limit)
            newValue = maxSelections
                ? options.slice(0, maxSelections).map((opt) => opt.value)
                : options.map((opt) => opt.value);
        }

        value = newValue;

        // Reset last selected index when using select all
        lastSelectedIndex = null;

        // Update the dropdown options to reflect new selection state
        if (isOpen) {
            openDropdown(); // Refresh the dropdown state
        }

        dispatch("change", {
            value: newValue,
            selectedOptions: options.filter((opt) =>
                newValue.includes(opt.value),
            ),
        });
    }

    function handleKeydown(event: KeyboardEvent) {
        if (disabled) return;

        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                toggleDropdown();
                break;
            case "Escape":
                closeDropdown();
                break;
            case "ArrowDown":
                if (!isOpen) {
                    event.preventDefault();
                    openDropdown();
                }
                break;
        }
    }

    // Close dropdown when clicking outside
    onMount(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                triggerElement &&
                !triggerElement.contains(event.target as Node)
            ) {
                closeDropdown();
            }
        }

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });

    // Clean up dropdown when component is destroyed
    onDestroy(() => {
        closeDropdown();
    });
</script>

<div class={`ds-multiselect-dropdown ${error ? "has-error" : ""} ${className}`}>
    {#if label}
        <label for={id} class="dropdown-label">{label}</label>
    {/if}

    <div class="dropdown-container">
        <button
            {id}
            type="button"
            class="dropdown-trigger {variant} {size}"
            class:open={isOpen}
            class:disabled
            class:has-selections={selectedOptions.length > 0}
            bind:this={triggerElement}
            {disabled}
            on:click={toggleDropdown}
            on:keydown={handleKeydown}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${id}-label` : undefined}
        >
            <div class="dropdown-value-container">
                <span
                    class="dropdown-value"
                    class:placeholder={selectedOptions.length === 0}
                >
                    {displayText}
                </span>

                {#if selectedOptions.length > 1}
                    <div
                        class="selected-count"
                        role="group"
                        aria-label="Selected items count"
                    >
                        <span class="count-badge">
                            {selectedOptions.length} selecionados
                        </span>
                    </div>
                {/if}
            </div>

            <span class="dropdown-arrow" class:open={isOpen}>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
        </button>
    </div>

    {#if error}
        <div class="error-text">{error}</div>
    {/if}
</div>

<style>
    .ds-multiselect-dropdown {
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .dropdown-label {
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--color-text-primary);
        font-size: 0.9rem;
    }

    .dropdown-container {
        position: relative;
    }

    .dropdown-trigger {
        width: 100%;
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        text-decoration: none;
        font-family: inherit;
        background: var(--color-input-background, var(--color-text-white));
        color: var(--color-text-primary);
        box-sizing: border-box;
        outline: none;
        min-height: 2.5rem;
    }

    .dropdown-trigger:focus {
        border-color: var(--color-input-focus);
        box-shadow: 0 0 0 3px rgba(73, 184, 125, 0.1);
    }

    .dropdown-trigger:hover:not(.disabled) {
        border-color: var(--color-input-focus);
    }

    .dropdown-trigger.open {
        border-color: var(--color-input-focus);
    }

    .dropdown-trigger.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--color-bg-light);
    }

    .dropdown-value-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        overflow: hidden;
    }

    .dropdown-value {
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .dropdown-value.placeholder {
        color: var(--color-text-secondary);
    }

    .selected-count {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .count-badge {
        display: inline-flex;
        align-items: center;
        background: rgba(73, 184, 125, 0.1);
        color: var(--color-nature-main);
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid rgba(73, 184, 125, 0.2);
    }

    .dropdown-arrow {
        transition: transform 0.2s ease;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .dropdown-arrow.open {
        transform: rotate(180deg);
    }

    /* Size variants */
    .sm {
        padding: 0.375rem 0.75rem;
        min-height: 2rem;
        font-size: 0.75rem;
    }

    .md {
        padding: 0.65rem 0.8rem;
        min-height: 2.5rem;
        font-size: 0.875rem;
    }

    .large {
        padding: 0.9rem 1.25rem;
        min-height: 3rem;
        font-size: 1rem;
    }

    .has-selections.md {
        min-height: auto;
        padding: 0.5rem 0.8rem;
    }

    .has-selections.sm {
        min-height: auto;
        padding: 0.25rem 0.75rem;
    }

    .has-selections.large {
        min-height: auto;
        padding: 0.75rem 1.25rem;
    }

    .ds-multiselect-dropdown.has-error .dropdown-trigger {
        border-color: var(--color-input-error);
    }

    .error-text {
        margin-top: 0.35rem;
        color: var(--color-error-dark);
        font-size: 0.85rem;
    }

    /* Button-like variants for the trigger */
    .primary.dropdown-trigger {
        background: var(--color-nature-main);
        color: var(--color-text-white);
        border-color: var(--color-nature-main);
    }

    .primary.dropdown-trigger:hover:not(.disabled) {
        filter: brightness(0.95);
    }

    .secondary.dropdown-trigger {
        background: var(--color-text-white);
        color: var(--color-secondary-main);
        border-color: var(--color-secondary-main);
    }

    .outline.dropdown-trigger {
        background: transparent;
        color: var(--color-nature-main);
        border-color: var(--color-nature-main);
    }

    .outline.dropdown-trigger:hover:not(.disabled) {
        background: var(--color-nature-background-light);
    }

    .neutral.dropdown-trigger {
        background: var(--color-text-white);
        color: var(--color-font-body-dark);
        border-color: var(--color-border-light);
    }

    .neutral.dropdown-trigger:hover:not(.disabled) {
        background: var(--color-bg-light);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .sm {
            padding: 0.25rem 0.5rem;
            min-height: 1.75rem;
            font-size: 0.7rem;
        }

        .md {
            padding: 0.5rem 0.7rem;
            min-height: 2.25rem;
            font-size: 0.8rem;
        }

        .large {
            padding: 0.6rem 1rem;
            min-height: 2.5rem;
            font-size: 0.95rem;
        }

        .count-badge {
            font-size: 0.7rem;
            padding: 0.1rem 0.4rem;
        }
    }
</style>
