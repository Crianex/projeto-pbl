<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Dropdown from "$lib/design_system/components/Dropdown.svelte";
    import MultiSelectDropdown from "./MultiSelectDropdown.svelte";
    import DropdownPortal from "$lib/design_system/components/DropdownPortal.svelte";
    import type {
        TurmaModel,
        ProblemaModel,
        ProfessorModel,
    } from "$lib/interfaces/interfaces";

    export let turmas: TurmaModel[] = [];
    export let selectedTurma: TurmaModel | null = null;
    export let problemas: ProblemaModel[] = [];
    export let selectedProblemas: ProblemaModel[] = [];
    export let professores: ProfessorModel[] = [];
    export let selectedProfessorId: number | null = null;
    export let isCoordenador: boolean = false;

    const dispatch = createEventDispatcher();

    // Convert data to dropdown format
    $: turmaOptions = turmas.map((turma) => ({
        value: turma.id_turma,
        label: `${turma.nome_turma || "Turma sem nome"} (${turma.alunos?.length || 0} alunos)`,
    }));

    // Filter out the "Média de Todos os Problemas" option and convert to dropdown format
    $: problemaOptions = problemas
        .filter((problema) => problema.id_problema !== -1)
        .map((problema) => ({
            value: problema.id_problema,
            label: problema.nome_problema || "Problema sem nome",
        }));

    $: professorOptions = professores.map((professor) => ({
        value: professor.id,
        label: professor.nome_completo || "Professor sem nome",
    }));

    // Get selected problema IDs for the multiselect
    $: selectedProblemaIds = selectedProblemas.map((p) => p.id_problema);

    function handleProfessorSelect(event: CustomEvent) {
        const professorId = event.detail.value;
        dispatch("professorSelect", professorId);
    }

    function handleTurmaSelect(event: CustomEvent) {
        const turmaId = event.detail.value;
        dispatch("turmaSelect", turmaId);
    }

    function handleProblemaSelect(event: CustomEvent) {
        const selectedIds = event.detail.value;
        const selectedProblemasArray = problemas.filter((problema) =>
            selectedIds.includes(problema.id_problema),
        );
        dispatch("problemaSelect", selectedProblemasArray);
    }
</script>

<div class="filters-section">
    {#if isCoordenador}
        <div class="filter-group">
            <Dropdown
                id="professor-select"
                label="Professor:"
                options={professorOptions}
                value={selectedProfessorId}
                placeholder="Todos os professores"
                on:change={handleProfessorSelect}
                disabled={false}
                variant="neutral"
                size="md"
            />
        </div>
    {/if}

    <div class="filter-group">
        <Dropdown
            id="turma-select"
            label="Turma:"
            options={turmaOptions}
            value={selectedTurma?.id_turma || null}
            placeholder="Selecione uma turma"
            on:change={handleTurmaSelect}
            disabled={turmaOptions.length === 0}
            variant="neutral"
            size="md"
        />
    </div>

    <div class="filter-group">
        <MultiSelectDropdown
            id="problema-select"
            label="Problemas:"
            options={problemaOptions}
            value={selectedProblemaIds}
            placeholder="Selecione problemas..."
            on:change={handleProblemaSelect}
            disabled={!selectedTurma || problemaOptions.length === 0}
            variant="neutral"
            size="md"
            showSelectAll={true}
        />
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
        align-items: stretch;
        box-shadow: none;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 120px;
        flex: 1;
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
    }

    @media (max-width: 480px) {
        .filters-section {
            padding: 0.1rem 0.02rem;
        }
    }
</style>
