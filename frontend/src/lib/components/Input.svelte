<script lang="ts">
    import { formatToDateTime } from "brazilian-values";
    import { onMount } from "svelte";
    import type { FullAutoFill } from "svelte/elements";

    export let type: string = "text";
    export let placeholder: string = "";
    export let value: string | number = "";
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let readonly: boolean = false;
    export let id: string = "";
    export let name: string = "";
    export let min: string | number | undefined = undefined;
    export let max: string | number | undefined = undefined;
    export let step: string | number | undefined = undefined;
    export let autocomplete: FullAutoFill | undefined = undefined;
    export let label: string = "";
    export let helperText: string = "";
    export let error: string = "";
    export let size: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "outlined" = "default";

    let inputElement: HTMLInputElement;

    // Size classes
    const sizeClasses = {
        sm: "input-sm",
        md: "input-md",
        lg: "input-lg",
    };

    // Variant classes
    const variantClasses = {
        default: "input-default",
        outlined: "input-outlined",
    };

    // Export focus/blur methods for parent components
    export function focus() {
        if (inputElement) inputElement.focus();
    }

    export function blur() {
        if (inputElement) inputElement.blur();
    }
    onMount(() => {
        if (inputElement && type === "datetime-local") {
            console.log(`value: ${value}`);
        }
    });
</script>

<div class="input-wrapper">
    {#if label}
        <label for={id} class="input-label" class:required>
            {label}
        </label>
    {/if}

    {#if type === "text"}
        <input
            type="text"
            bind:this={inputElement}
            bind:value
            {id}
            {name}
            {placeholder}
            {required}
            {disabled}
            {readonly}
            {min}
            {max}
            {step}
            {autocomplete}
            class="input {sizeClasses[size]} {variantClasses[variant]}"
            class:error
            class:disabled
            {...$$restProps}
        />
    {:else if type === "number"}
        <input
            type="number"
            bind:this={inputElement}
            bind:value
            {id}
            {name}
            {placeholder}
            {required}
            {disabled}
            {readonly}
            {min}
            {max}
            {step}
            {autocomplete}
            class="input {sizeClasses[size]} {variantClasses[variant]}"
            class:error
            class:disabled
            {...$$restProps}
        />
    {:else if type === "datetime-local"}
        <input
            type="datetime-local"
            bind:this={inputElement}
            bind:value
            {id}
            {name}
            {placeholder}
            {required}
            {disabled}
            {readonly}
            {min}
            {max}
            {step}
            {autocomplete}
            class="input {sizeClasses[size]} {variantClasses[variant]}"
            class:error
            class:disabled
            {...$$restProps}
        />
    {:else}
        <input
            {type}
            bind:this={inputElement}
            {value}
            {id}
            {name}
            {placeholder}
            {required}
            {disabled}
            {readonly}
            {min}
            {max}
            {step}
            {autocomplete}
            class="input {sizeClasses[size]} {variantClasses[variant]}"
            class:error
            class:disabled
            {...$$restProps}
        />
    {/if}

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

    .input:readonly {
        background-color: #f9fafb;
        cursor: default;
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
