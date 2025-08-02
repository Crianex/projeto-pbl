<script lang="ts">
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";
    import DeleteButton from "./DeleteButton.svelte";
    import TextArea from "./TextArea.svelte";
    import type { CriteriosGroup } from "$lib/interfaces/interfaces";
    import { formatToDateTime, parseToDate } from "brazilian-values";
    import { createEventDispatcher } from "svelte";

    export let criterios: CriteriosGroup = {};
    export let dataEHoraCriteriosEArquivos: {
        [tag: string]: {
            data_e_hora_inicio: Date;
            data_e_hora_fim: Date;
        };
    } = {};

    const dispatch = createEventDispatcher();

    function addCriterioGroup() {
        const newGroupName = prompt("Nome do novo grupo de critérios:");
        if (newGroupName && !criterios[newGroupName]) {
            criterios = {
                ...criterios,
                [newGroupName]: [],
            };
            dataEHoraCriteriosEArquivos = {
                ...dataEHoraCriteriosEArquivos,
                [newGroupName]: {
                    data_e_hora_inicio: new Date(),
                    data_e_hora_fim: new Date(
                        new Date().getTime() + 60 * 60 * 1000,
                    ),
                },
            };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        }
    }

    function addCriterio(groupName: string) {
        criterios = {
            ...criterios,
            [groupName]: [
                ...criterios[groupName],
                {
                    nome_criterio: "",
                    descricao_criterio: "",
                    nota_maxima_aluno: 1.0,
                    nota_maxima_professor: 1.0,
                },
            ],
        };
    }

    function removeCriterio(groupName: string, index: number) {
        criterios[groupName].splice(index, 1);
        if (criterios[groupName].length === 0) {
            const { [groupName]: removed, ...rest } = criterios;
            criterios = rest;
            const { [groupName]: removedTime, ...restTimes } =
                dataEHoraCriteriosEArquivos;
            dataEHoraCriteriosEArquivos = restTimes;
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        } else {
            criterios = { ...criterios };
        }
    }

    function handleTagNameChange(oldName: string, newName: string) {
        if (newName && newName !== oldName && !criterios[newName]) {
            // Update criterios object
            const criteriosList = criterios[oldName];
            const { [oldName]: removed, ...rest } = criterios;
            criterios = { ...rest, [newName]: criteriosList };

            // Update data_e_hora_criterios_e_arquivos object
            const dateTime = dataEHoraCriteriosEArquivos[oldName];
            const { [oldName]: removedTime, ...restTimes } =
                dataEHoraCriteriosEArquivos;
            dataEHoraCriteriosEArquivos = { ...restTimes, [newName]: dateTime };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        }
    }

    function handleTagNameBlur(groupName: string) {
        return (e: Event) => {
            handleTagNameChange(
                groupName,
                (e.target as HTMLInputElement).value,
            );
        };
    }

    function handleTagNameKeydown(e: CustomEvent<KeyboardEvent>) {
        if (e.detail.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    }

    function handleRemoveGroup(groupName: string) {
        const { [groupName]: removed, ...rest } = criterios;
        criterios = rest;
        const { [groupName]: removedTime, ...restTimes } =
            dataEHoraCriteriosEArquivos;
        dataEHoraCriteriosEArquivos = restTimes;
        dispatch(
            "changeDataEHoraCriteriosEArquivos",
            dataEHoraCriteriosEArquivos,
        );
    }

    function handleChangeInicio(groupName: string) {
        return (e: CustomEvent<string>) => {
            const value = e.detail;
            console.log(
                `Changing data_e_hora_inicio to: ${value} for group ${groupName}`,
            );
            dataEHoraCriteriosEArquivos[groupName].data_e_hora_inicio =
                new Date(value);
            // Auto-update end if it's before start
            if (
                dataEHoraCriteriosEArquivos[groupName].data_e_hora_fim &&
                new Date(value) >
                    dataEHoraCriteriosEArquivos[groupName].data_e_hora_fim
            ) {
                dataEHoraCriteriosEArquivos[groupName].data_e_hora_fim =
                    new Date(value);
            }
            // Trigger reactivity
            dataEHoraCriteriosEArquivos = { ...dataEHoraCriteriosEArquivos };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        };
    }

    function handleChangeFim(groupName: string) {
        return (e: CustomEvent<string>) => {
            const value = e.detail;
            console.log(
                `Changing data_e_hora_fim to: ${value} for group ${groupName}`,
            );
            dataEHoraCriteriosEArquivos[groupName].data_e_hora_fim = new Date(
                value,
            );
            // Auto-update start if it's after end
            if (
                dataEHoraCriteriosEArquivos[groupName].data_e_hora_inicio &&
                new Date(value) <
                    dataEHoraCriteriosEArquivos[groupName].data_e_hora_inicio
            ) {
                dataEHoraCriteriosEArquivos[groupName].data_e_hora_inicio =
                    new Date(value);
            }
            // Trigger reactivity
            dataEHoraCriteriosEArquivos = { ...dataEHoraCriteriosEArquivos };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        };
    }

    function toLocalISOString(date: Date) {
        const pad = (n: number) => n.toString().padStart(2, "0");
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
</script>

<div class="criterios-section">
    <div class="criterios-header">
        <h2>Critérios de Avaliação</h2>
        <Button type="button" variant="secondary" on:click={addCriterioGroup}>
            + Adicionar Grupo
        </Button>
    </div>

    {#each Object.entries(criterios) as [groupName, criteriosList]}
        <div class="criterio-group">
            <div class="criterio-group-header">
                <Input
                    bind:value={groupName}
                    placeholder="Nome do grupo"
                    size="md"
                    on:blur={handleTagNameBlur(groupName)}
                    on:keydown={handleTagNameKeydown}
                />
                <DeleteButton
                    size="sm"
                    title="Confirmar Exclusão"
                    confirmMessage="Tem certeza que deseja remover este grupo de critérios?"
                    on:delete={() => handleRemoveGroup(groupName)}
                />
            </div>
            <div class="criterio-datetime">
                <label>Data e hora de abertura:</label>
                <Input
                    type="datetime-local"
                    value={toLocalISOString(
                        dataEHoraCriteriosEArquivos[groupName]
                            .data_e_hora_inicio,
                    )}
                    size="sm"
                    on:input={handleChangeInicio(groupName)}
                />
                <label>Data e hora de fechamento:</label>
                <Input
                    type="datetime-local"
                    value={toLocalISOString(
                        dataEHoraCriteriosEArquivos[groupName].data_e_hora_fim,
                    )}
                    size="sm"
                    on:input={handleChangeFim(groupName)}
                />
            </div>
            <div class="criterios-list">
                {#each criteriosList as criterio, index}
                    <div class="criterio-item">
                        <div class="criterio-header">
                            <div class="criterio-name-container">
                                <Input
                                    bind:value={criterio.nome_criterio}
                                    placeholder="Nome do critério"
                                    required
                                />
                                <DeleteButton
                                    size="sm"
                                    title="Confirmar Exclusão"
                                    confirmMessage="Tem certeza que deseja remover este critério?"
                                    on:delete={() => removeCriterio(groupName, index)}
                                />
                            </div>
                            <div class="nota-maxima">
                                <div class="nota-field">
                                    <label>Nota Máxima Aluno:</label>
                                    <Input
                                        type="number"
                                        bind:value={criterio.nota_maxima_aluno}
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        size="sm"
                                        required
                                    />
                                </div>
                                <div class="nota-field">
                                    <label>Nota Máxima Professor:</label>
                                    <Input
                                        type="number"
                                        bind:value={
                                            criterio.nota_maxima_professor
                                        }
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        size="sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <TextArea
                            bind:value={criterio.descricao_criterio}
                            placeholder="Descrição do critério"
                            rows={3}
                            required
                        />
                    </div>
                {/each}
                <Button
                    type="button"
                    variant="secondary"
                    on:click={() => addCriterio(groupName)}
                >
                    + Adicionar Critério
                </Button>
            </div>
        </div>
    {/each}
</div>

<style>
    .criterios-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .criterios-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .criterios-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }

    .criterio-group {
        margin-bottom: 2rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
    }

    .criterio-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
    }

    .criterio-datetime {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .criterio-datetime label {
        color: #495057;
        font-weight: 500;
        font-size: 0.875rem;
    }

    .criterios-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }

    .criterio-item {
        background: white;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .criterio-item:last-child {
        border-bottom: none;
    }

    .criterio-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
    }

    .criterio-name-container {
        display: flex;
        width: 100%;
        gap: 1rem;
        align-items: center;
    }

    .nota-maxima {
        width: 100%;
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .nota-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        flex: 1;
    }

    .nota-field label {
        color: #495057;
        font-size: 0.875rem;
    }



    :global(.criterios-list .button) {
        margin: 1rem;
    }

    @media (max-width: 768px) {
        .criterios-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .criterios-header :global(button) {
            width: 100%;
        }

        .criterio-group-header {
            flex-direction: column;
            gap: 0.8rem;
            align-items: stretch;
        }



        .criterio-datetime {
            grid-template-columns: 1fr;
            gap: 0.8rem;
        }

        .criterio-datetime label {
            font-size: 0.9rem;
            margin-bottom: 0.2rem;
        }

        .criterio-header {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }

        .criterio-name-container {
            display: flex;
            width: 100%;
            align-items: center;
        }

        .criterio-name-container :global(input) {
            flex: 1;
        }

        .nota-maxima {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 0.8rem;
        }

        .nota-field {
            width: 100%;
        }

        .nota-field label {
            font-size: 0.9rem;
        }

        .nota-maxima :global(input),
        .criterio-header :global(input) {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .criterios-section {
            margin-top: 1.5rem;
        }

        .criterios-header h2 {
            font-size: 1.1rem;
        }

        .criterio-group {
            margin-bottom: 1.5rem;
        }

        .criterio-item {
            padding: 0.8rem;
        }

        .criterio-datetime {
            padding: 0.8rem;
        }
    }
</style>
