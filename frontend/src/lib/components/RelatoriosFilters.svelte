<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { TurmaModel, ProblemaModel } from "$lib/interfaces/interfaces";

    export let turmas: TurmaModel[] = [];
    export let selectedTurma: TurmaModel | null = null;
    export let problemas: ProblemaModel[] = [];
    export let selectedProblema: ProblemaModel | null = null;

    const dispatch = createEventDispatcher();

    function handleTurmaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const turmaId = parseInt(target.value);
        dispatch("turmaSelect", turmaId);
    }

    function handleProblemaSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const problemaId = parseInt(target.value);
        dispatch("problemaSelect", problemaId);
    }
</script>

<div class="filters-section">
    <div class="filter-group">
        <label for="turma-select">Turma:</label>
        <select
            id="turma-select"
            value={selectedTurma?.id_turma || ""}
            on:change={handleTurmaSelect}
            class="filter-select"
        >
            {#each turmas as turma}
                <option value={turma.id_turma}>
                    {turma.nome_turma} ({turma.alunos?.length || 0} alunos)
                </option>
            {/each}
        </select>
    </div>

    <div class="filter-group">
        <label for="problema-select">Problema:</label>
        <select
            id="problema-select"
            value={selectedProblema?.id_problema || ""}
            on:change={handleProblemaSelect}
            class="filter-select"
            disabled={!selectedTurma || problemas.length === 0}
        >
            {#each problemas as problema}
                <option value={problema.id_problema}>
                    {problema.nome_problema}
                </option>
            {/each}
        </select>
    </div>
</div>

<style>
    .filters-section {
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 8px;
        padding: 0.7rem 0.7rem;
        display: flex;
        gap: 0.7rem;
        align-items: end;
        box-shadow: none;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 120px;
    }

    .filter-group label {
        font-weight: 600;
        color: #22223b;
        font-size: 0.92rem;
    }

    .filter-select {
        padding: 0.4rem 0.6rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #f8fafc;
        font-size: 0.97rem;
        cursor: pointer;
        transition: border-color 0.2s;
    }

    .filter-select:hover:not(:disabled),
    .filter-select:focus {
        border-color: #6c63ff;
        outline: none;
        box-shadow: 0 0 0 2px #e0e7ff;
    }

    .filter-select:disabled {
        background: #f1f1f1;
        color: #b0b0b0;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .filters-section {
            flex-direction: column;
            gap: 0.2rem;
            align-items: stretch;
            padding: 0.3rem 0.1rem;
        }

        .filter-group {
            min-width: 100%;
            gap: 0.1rem;
        }

        .filter-select {
            font-size: 0.93rem;
            padding: 0.2rem 0.3rem;
        }
    }

    @media (max-width: 480px) {
        .filters-section {
            padding: 0.1rem 0.02rem;
        }
    }
</style>
