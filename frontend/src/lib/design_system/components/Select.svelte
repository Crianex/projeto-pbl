<script lang="ts">
    import { createEventDispatcher } from "svelte";

    type SelectOption = {
        value: string | number;
        label: string;
        disabled?: boolean;
    };

    export let id: string = "";
    export let name: string = "";
    export let label: string = "";
    export let helperText: string = "";
    export let error: string = "";
    export let value: string | number | undefined = "";
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let placeholder: string = "";
    export let options: SelectOption[] = [];
    export let loading: boolean = false;
    export let loadingText: string = "Carregando...";
    export let size: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "outlined" = "default";

    const dispatch = createEventDispatcher();

    const sizeClasses = {
        sm: "input-sm",
        md: "input-md",
        lg: "input-lg",
    } as const;

    const variantClasses = {
        default: "input-default",
        outlined: "input-outlined",
    } as const;

    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement | null;
        if (!target) return;
        value = target.value;
        dispatch("change", value);
        dispatch("input", value);
    }
</script>

<div class="input-wrapper">
    {#if label}
        <label for={id} class="input-label" class:required>
            {label}
        </label>
    {/if}

    <div class="select-container">
        <select
            {id}
            {name}
            class="input {sizeClasses[size]} {variantClasses[variant]}"
            class:error
            class:disabled
            bind:value
            on:change={handleChange}
            {required}
            {disabled}
            aria-invalid={!!error}
            aria-busy={loading}
            {...$$restProps}
        >
            {#if placeholder}
                <option value="" disabled selected>{placeholder}</option>
            {/if}

            {#if loading}
                <option value="" disabled selected>{loadingText}</option>
            {:else}
                {#each options as opt}
                    <option value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                    </option>
                {/each}
            {/if}
        </select>
        <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    </div>

    {#if error}
        <span class="error-text">{error}</span>
    {:else if helperText}
        <span class="helper-text">{helperText}</span>
    {/if}
</div>

<style>
    .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .input-label {
        display: block;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.25rem;
    }

    .input-label.required::after {
        content: " *";
        color: #dc2626;
    }

    .input {
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        line-height: 1.5rem;
        transition: all 0.15s ease-in-out;
        background-color: #ffffff;
        color: #111827;
        width: 100%;
        box-sizing: border-box;
    }

    /* Remove native arrows and match Input look */
    select.input {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-color: #ffffff;
        padding-right: 2.5rem; /* space for chevron */
        cursor: pointer;
    }

    .select-container {
        position: relative;
        width: 100%;
    }

    .chevron {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1rem;
        height: 1rem;
        color: #6b7280; /* gray-500 */
        pointer-events: none;
        transition: color 0.15s ease-in-out;
    }

    .select-container:focus-within .chevron {
        color: #3b82f6; /* blue-500 */
    }

    .input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input.error {
        border-color: #dc2626;
    }

    .input.error:focus {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .input:disabled {
        background-color: #f3f4f6;
        color: #6b7280;
        cursor: not-allowed;
    }

    select.input:disabled + .chevron {
        color: #9ca3af; /* gray-400 */
    }

    /* Size variants */
    .input-sm {
        padding: 0.5rem;
        font-size: 0.875rem;
    }

    .input-md {
        padding: 0.75rem;
        font-size: 1rem;
    }

    .input-lg {
        padding: 1rem;
        font-size: 1.125rem;
    }

    /* Style variants */
    .input-default {
        border: 1px solid #d1d5db;
    }

    .input-outlined {
        border: 2px solid #e5e7eb;
        background-color: transparent;
    }

    .input-outlined:focus {
        border-color: #3b82f6;
    }

    .error-text {
        color: #dc2626;
        font-size: 0.875rem;
        line-height: 1.25rem;
    }

    .helper-text {
        color: #6b7280;
        font-size: 0.875rem;
        line-height: 1.25rem;
    }

    /* Hover effects */
    .input:hover:not(:disabled):not(:focus) {
        border-color: #9ca3af;
    }
</style>
