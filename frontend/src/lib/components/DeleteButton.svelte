<script lang="ts">
    import Button from "$lib/design_system/components/Button.svelte";
    import Dialog from "$lib/design_system/components/Dialog.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let size: "sm" | "md" | "large" | "icon" = "sm";
    export let disabled = false;
    export let loading = false;
    export let confirmMessage = "Tem certeza que deseja excluir este item?";
    export let title = "Confirmar Exclusão";

    let showDialog = false;

    function handleClick() {
        showDialog = true;
    }

    function handleConfirm() {
        showDialog = false;
        dispatch("delete");
    }

    function handleCancel() {
        showDialog = false;
    }
</script>

<Button
    variant="danger"
    {size}
    {disabled}
    {loading}
    on:click={handleClick}
    title="Excluir"
>
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
    </svg>
</Button>

<Dialog bind:open={showDialog} on:close={handleCancel}>
    <svelte:fragment slot="header">
        <div class="dialog-header-content">
            <div class="dialog-icon">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>
            <h3>{title}</h3>
        </div>
    </svelte:fragment>

    <div class="dialog-body">
        <p>{confirmMessage}</p>

        <div class="dialog-actions">
            <Button variant="secondary" on:click={handleCancel}>
                Cancelar
            </Button>
            <Button variant="danger" on:click={handleConfirm}>Excluir</Button>
        </div>
    </div>
</Dialog>

<style>
    .dialog-header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .dialog-icon {
        color: #ef4444;
        flex-shrink: 0;
    }

    .dialog-header-content h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
    }

    .dialog-body {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .dialog-body p {
        margin: 0;
        color: #6b7280;
        line-height: 1.6;
        font-size: 1rem;
    }

    .dialog-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }

    @media (max-width: 480px) {
        .dialog-actions {
            flex-direction: column;
        }

        .dialog-actions :global(.button) {
            width: 100%;
        }
    }
</style>
