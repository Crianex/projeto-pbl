<script lang="ts">
    import Input from "./Input.svelte";

    export let startDate: string = "";
    export let endDate: string = "";
    export let startLabel: string = "Data de Início";
    export let endLabel: string = "Data de Fim";
    export let required: boolean = true;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Add date validation
    $: {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                endDate = startDate;
            }
        }
    }
</script>

<div class="date-range">
    <div class="form-group">
        <Input
            type="date"
            label={startLabel}
            bind:value={startDate}
            min={today}
            {required}
        />
    </div>

    <div class="form-group">
        <Input
            type="date"
            label={endLabel}
            bind:value={endDate}
            min={startDate || today}
            disabled={!startDate}
            {required}
            helperText={!startDate
                ? "Selecione uma data de início primeiro"
                : ""}
        />
    </div>
</div>

<style>
    .date-range {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    @media (min-width: 768px) {
        .date-range {
            flex-direction: row;
            gap: 2rem;
        }

        .form-group {
            flex: 1;
            margin-bottom: 0;
        }
    }
</style>
