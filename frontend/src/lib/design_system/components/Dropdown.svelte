<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { activeDropdowns } from "./DropdownPortal";

    export let options: Array<{ value: any; label: string }> = [];
    export let value: any = null;
    export let placeholder = "Selecione...";
    export let disabled = false;
    export let variant: "primary" | "secondary" | "outline" | "neutral" =
        "neutral";
    export let size: "sm" | "md" | "large" = "md";
    export let className = "";
    export let id: string | undefined;
    export let label: string | undefined;
    export let error: string | null = null;

    const dispatch = createEventDispatcher<{
        change: { value: any; label: string };
    }>();

    let isOpen = false;
    let triggerElement: HTMLButtonElement;
    let selectedOption: { value: any; label: string } | null = null;

    // Generate unique ID for this dropdown instance
    const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;

    let dropdownPosition = { top: 0, left: 0, width: 0 };

    // Find selected option when value changes
    $: {
        if (value !== null && options.length > 0) {
            selectedOption = options.find((opt) => opt.value === value) || null;
        } else {
            selectedOption = null;
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
            top: rect.bottom + scrollTop + 2, // 2px gap
            left: rect.left + scrollLeft,
            width: rect.width,
        };
    }

    function openDropdown() {
        if (disabled) return;

        calculatePosition();

        activeDropdowns.update((dropdowns) => {
            const newDropdowns = new Map(dropdowns);
            newDropdowns.set(dropdownId, {
                id: dropdownId,
                options,
                value,
                position: dropdownPosition,
                onSelect: (option: { value: any; label: string }) =>
                    selectOption(option),
                onClose: () => closeDropdown(),
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

    function selectOption(option: { value: any; label: string }) {
        value = option.value;
        selectedOption = option;
        closeDropdown();
        dispatch("change", { value: option.value, label: option.label });
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

<div class={`ds-dropdown ${error ? "has-error" : ""} ${className}`}>
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
            bind:this={triggerElement}
            {disabled}
            on:click={toggleDropdown}
            on:keydown={handleKeydown}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${id}-label` : undefined}
        >
            <span class="dropdown-value">
                {selectedOption ? selectedOption.label : placeholder}
            </span>
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

        <!-- Dropdown menu is now rendered by the portal system -->
    </div>

    {#if error}
        <div class="error-text">{error}</div>
    {/if}
</div>

<style>
    .ds-dropdown {
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

    .dropdown-value {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    /* Dropdown menu is now rendered by the portal system */

    .ds-dropdown.has-error .dropdown-trigger {
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
    }
</style>
