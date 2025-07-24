<script lang="ts">
    export let placeholder: string = "";
    export let value: string = "";
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let readonly: boolean = false;
    export let id: string = "";
    export let name: string = "";
    export let rows: number = 3;
    export let cols: number | undefined = undefined;
    export let maxlength: number | undefined = undefined;
    export let label: string = "";
    export let helperText: string = "";
    export let error: string = "";
    export let size: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "outlined" = "default";
    export let resize: "none" | "vertical" | "horizontal" | "both" = "vertical";

    // Event handlers
    export let onChange: ((e: Event) => void) | undefined = undefined;
    export let onBlur: ((e: Event) => void) | undefined = undefined;
    export let onFocus: ((e: Event) => void) | undefined = undefined;
    export let onKeydown: ((e: KeyboardEvent) => void) | undefined = undefined;

    let textareaElement: HTMLTextAreaElement;

    // Size classes
    const sizeClasses = {
        sm: "textarea-sm",
        md: "textarea-md",
        lg: "textarea-lg",
    };

    // Variant classes
    const variantClasses = {
        default: "textarea-default",
        outlined: "textarea-outlined",
    };

    // Resize classes
    const resizeClasses = {
        none: "resize-none",
        vertical: "resize-vertical",
        horizontal: "resize-horizontal",
        both: "resize-both",
    };

    function handleChange(e: Event) {
        if (onChange) onChange(e);
    }

    function handleBlur(e: Event) {
        if (onBlur) onBlur(e);
    }

    function handleFocus(e: Event) {
        if (onFocus) onFocus(e);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (onKeydown) onKeydown(e);
    }

    // Export focus method for parent components
    export function focus() {
        if (textareaElement) textareaElement.focus();
    }

    export function blur() {
        if (textareaElement) textareaElement.blur();
    }
</script>

<div class="textarea-wrapper">
    {#if label}
        <label for={id} class="textarea-label" class:required>
            {label}
        </label>
    {/if}

    <textarea
        bind:this={textareaElement}
        bind:value
        {id}
        {name}
        {placeholder}
        {required}
        {disabled}
        {readonly}
        {rows}
        {cols}
        {maxlength}
        class="textarea {sizeClasses[size]} {variantClasses[
            variant
        ]} {resizeClasses[resize]}"
        class:error
        class:disabled
        on:change={handleChange}
        on:blur={handleBlur}
        on:focus={handleFocus}
        on:keydown={handleKeydown}
        on:input
    ></textarea>

    {#if error}
        <span class="error-text">{error}</span>
    {:else if helperText}
        <span class="helper-text">{helperText}</span>
    {/if}
</div>

<style>
    .textarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .textarea-label {
        display: block;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.25rem;
    }

    .textarea-label.required::after {
        content: " *";
        color: #dc2626;
    }

    .textarea {
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        line-height: 1.5rem;
        transition: all 0.15s ease-in-out;
        background-color: #ffffff;
        color: #111827;
        width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        min-height: 2.5rem;
    }

    .textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .textarea.error {
        border-color: #dc2626;
    }

    .textarea.error:focus {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .textarea:disabled {
        background-color: #f3f4f6;
        color: #6b7280;
        cursor: not-allowed;
    }

    .textarea:readonly {
        background-color: #f9fafb;
        cursor: default;
    }

    /* Size variants */
    .textarea-sm {
        padding: 0.5rem;
        font-size: 0.875rem;
    }

    .textarea-md {
        padding: 0.75rem;
        font-size: 1rem;
    }

    .textarea-lg {
        padding: 1rem;
        font-size: 1.125rem;
    }

    /* Style variants */
    .textarea-default {
        border: 1px solid #d1d5db;
    }

    .textarea-outlined {
        border: 2px solid #e5e7eb;
        background-color: transparent;
    }

    .textarea-outlined:focus {
        border-color: #3b82f6;
    }

    /* Resize variants */
    .resize-none {
        resize: none;
    }

    .resize-vertical {
        resize: vertical;
    }

    .resize-horizontal {
        resize: horizontal;
    }

    .resize-both {
        resize: both;
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
    .textarea:hover:not(:disabled):not(:focus) {
        border-color: #9ca3af;
    }

    /* Placeholder styling */
    .textarea::placeholder {
        color: #9ca3af;
    }
</style>
