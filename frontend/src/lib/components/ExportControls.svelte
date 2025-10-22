<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "$lib/design_system/components/Button.svelte";

    const dispatch = createEventDispatcher();

    function handleCSVExport() {
        dispatch("exportCSV");
    }

    function handlePDFExport() {
        dispatch("exportPDF");
    }
</script>

<div class="controls-section">
    <div class="export-buttons">
        <Button variant="secondary" on:click={handleCSVExport}>
            Exportar CSV
        </Button>
        <Button variant="secondary" on:click={handlePDFExport}>
            Exportar PDF
        </Button>
    </div>
</div>

<style>
    .controls-section {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .export-buttons {
        display: flex;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .controls-section {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }

        .export-buttons {
            justify-content: center;
        }
    }
</style>
