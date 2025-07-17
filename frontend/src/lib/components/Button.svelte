<script lang="ts">
    export let variant: "primary" | "secondary" | "danger" = "primary";
    export let disabled: boolean = false;
</script>

<button class="button {variant}" {disabled} aria-disabled={disabled}>
    <slot />
</button>

<style>
    .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-size: 1.1rem;
        font-weight: 600;
        padding: 0.75em 2em;
        border: 2px solid transparent;
        cursor: pointer;
        transition:
            background 0.2s,
            color 0.2s,
            border 0.2s;
    }
    .button.primary {
        background: #0f62fe;
        color: white;
        border-color: #0f62fe;
    }
    .button.secondary {
        background: white;
        color: #0f62fe;
        border-color: #0f62fe;
    }
    .button.danger {
        background: #da1e28;
        color: white;
        border-color: #da1e28;
    }
    .button:disabled {
        background: #c1c7cd;
        color: #fff;
        border-color: #c1c7cd;
        cursor: not-allowed;
        opacity: 0.7;
    }
</style>
