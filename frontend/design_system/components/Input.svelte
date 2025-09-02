<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { formatToPhone, isPhone } from "brazilian-values";

    export let value: string = "";
    export let placeholder = "";
    export let type:
        | "text"
        | "email"
        | "password"
        | "number"
        | "phone"
        | "date" = "text";
    export let disabled = false;
    export let error: string | null = null;
    export let className = "";
    export let name = "";
    export let id: string | undefined;
    export let label: string | undefined;
    export let required = false;
    export let autocomplete: any = null;

    const dispatch = createEventDispatcher();

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;

        // Auto-format phone numbers
        if (type === "phone") {
            const rawValue = target.value.replace(/\D/g, ""); // Remove non-digits
            const formattedValue = rawValue ? formatToPhone(rawValue) : "";

            // Update the input value with formatted phone
            target.value = formattedValue;

            // Dispatch the formatted value
            dispatch("input", {
                detail: formattedValue,
                originalEvent: event,
            });
        } else {
            dispatch("input", {
                detail: target.value,
                originalEvent: event,
            });
        }
    }

    // Phone validation function
    function validatePhone(phone: string): string | null {
        if (!phone) return null;

        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length === 0) return null;

        // For phone validation, check if it has the minimum required digits
        if (digitsOnly.length < 10 || digitsOnly.length > 11) {
            return "Telefone deve ter 10 ou 11 dígitos";
        }

        if (!isPhone(phone)) {
            return "Telefone inválido";
        }

        return null;
    }

    // Reactive phone validation
    $: phoneError = type === "phone" && value ? validatePhone(value) : null;
</script>

<div class={`ds-input ${error || phoneError ? "has-error" : ""} ${className}`}>
    {#if label}
        <label for={id} class="input-label">{label}</label>
    {/if}
    <input
        {type}
        {name}
        {id}
        {placeholder}
        {disabled}
        {required}
        {...autocomplete ? { autocomplete } : {}}
        bind:value
        on:input={handleInput}
    />
    {#if error || phoneError}
        <div class="error-text">{error || phoneError}</div>
    {/if}
</div>

<style>
    .ds-input {
        display: flex;
        flex-direction: column;
    }

    .input-label {
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--color-text-primary);
        font-size: 0.9rem;
    }

    .ds-input input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.65rem 0.8rem;
        border-radius: 10px;
        border: 1px solid var(--color-border-light);
        background: var(--color-input-background);
        outline: none;
        transition: border-color 0.15s ease;
        font-family: inherit;
    }

    /* Date input specific styling */
    .ds-input input[type="date"] {
        position: relative;
    }

    /* Webkit browsers (Chrome, Safari, Edge) date input styling */
    .ds-input input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        padding: 0.25rem;
        margin-left: 0.25rem;
    }

    .ds-input input[type="date"]::-webkit-inner-spin-button,
    .ds-input input[type="date"]::-webkit-outer-spin-button {
        display: none;
    }

    /* Firefox date input styling */
    .ds-input input[type="date"]::-moz-focus-inner {
        border: 0;
    }

    .ds-input input:focus {
        border-color: var(--color-input-focus);
    }

    .ds-input.has-error input {
        border-color: var(--color-input-error);
    }

    .ds-input .error-text {
        margin-top: 0.35rem;
        color: var(--color-error-dark);
        font-size: 0.85rem;
    }
</style>
