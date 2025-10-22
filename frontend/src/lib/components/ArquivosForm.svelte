<script lang="ts">
    import Button from "$lib/design_system/components/Button.svelte";
    import Input from "$lib/design_system/components/Input.svelte";
    import TextArea from "$lib/design_system/components/TextArea.svelte";
    import DeleteButton from "./DeleteButton.svelte";
    import { createEventDispatcher } from "svelte";
    import type { DefinicaoArquivoDeAvaliacao } from "$lib/interfaces/interfaces";
    import type { DataEHoraDefinition } from "$lib/interfaces/interfaces";

    export let definicoes: DefinicaoArquivoDeAvaliacao[] = [];
    export let dataEHoraCriteriosEArquivos: {
        [tag: string]: DataEHoraDefinition;
    } = {};
    const dispatch = createEventDispatcher();

    // Track old nome_tipo for each definicao
    let oldNomeTipos: string[] = definicoes.map((d) => d.nome_tipo || "");

    $: {
        // Keep oldNomeTipos in sync with definicoes
        if (oldNomeTipos.length !== definicoes.length) {
            oldNomeTipos = definicoes.map((d) => d.nome_tipo || "");
        }
    }

    $: {
        for (const definicao of definicoes) {
            const nome_tipo = definicao.nome_tipo || "";
            if (nome_tipo && !dataEHoraCriteriosEArquivos[nome_tipo]) {
                dataEHoraCriteriosEArquivos = {
                    ...dataEHoraCriteriosEArquivos,
                    [nome_tipo]: {
                        data_e_hora_inicio: new Date(
                            new Date().getTime() + 60 * 60 * 1000,
                        ),
                        data_e_hora_fim: new Date(
                            new Date().getTime() + 2 * 60 * 60 * 1000,
                        ),
                    },
                };
                dispatch(
                    "changeDataEHoraCriteriosEArquivos",
                    dataEHoraCriteriosEArquivos,
                );
            }
        }
    }

    function addDefinicaoArquivo() {
        const defaultName = "";
        definicoes = [
            ...definicoes,
            {
                nome_tipo: defaultName,
                descricao_tipo: "",
                tipos_de_arquivos_aceitos: [],
                nota_maxima: 10,
            },
        ];
        oldNomeTipos.push(defaultName);
        dataEHoraCriteriosEArquivos = {
            ...dataEHoraCriteriosEArquivos,
            [defaultName]: {
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

    function removeDefinicaoArquivo(index: number) {
        const removed = definicoes[index].nome_tipo || "";
        definicoes.splice(index, 1);
        definicoes = [...definicoes];
        oldNomeTipos.splice(index, 1);
        if (removed && removed in dataEHoraCriteriosEArquivos) {
            const { [removed]: _, ...rest } = dataEHoraCriteriosEArquivos;
            dataEHoraCriteriosEArquivos = rest;
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        }
    }

    function handleNomeTipoChange(index: number, newName: string) {
        const oldName = oldNomeTipos[index] || "";
        if (
            newName &&
            newName !== oldName &&
            !(newName in dataEHoraCriteriosEArquivos)
        ) {
            const dateTime = dataEHoraCriteriosEArquivos[oldName];
            const { [oldName]: _, ...rest } = dataEHoraCriteriosEArquivos;
            dataEHoraCriteriosEArquivos = { ...rest, [newName]: dateTime };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
            oldNomeTipos[index] = newName;
        }
    }

    function handleChangeInicio(nome_tipo: string) {
        return (e: CustomEvent<string>) => {
            if (!dataEHoraCriteriosEArquivos[nome_tipo]) return;
            const value = e.detail;
            dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_inicio =
                new Date(value);
            if (
                dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_fim &&
                new Date(value) >
                    dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_fim
            ) {
                dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_fim =
                    new Date(value);
            }
            dataEHoraCriteriosEArquivos = { ...dataEHoraCriteriosEArquivos };
            dispatch(
                "changeDataEHoraCriteriosEArquivos",
                dataEHoraCriteriosEArquivos,
            );
        };
    }

    function handleChangeFim(nome_tipo: string) {
        return (e: CustomEvent<string>) => {
            if (!dataEHoraCriteriosEArquivos[nome_tipo]) return;
            const value = e.detail;
            dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_fim = new Date(
                value,
            );
            if (
                dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_inicio &&
                new Date(value) <
                    dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_inicio
            ) {
                dataEHoraCriteriosEArquivos[nome_tipo].data_e_hora_inicio =
                    new Date(value);
            }
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

    function addTipoArquivo(index: number) {
        const tipo = prompt("Digite a extensão do arquivo (ex: pdf, png):");
        if (tipo) {
            definicoes[index].tipos_de_arquivos_aceitos.push(tipo);
            definicoes = [...definicoes];
        }
    }

    function removeTipoArquivo(index: number, tipoIndex: number) {
        definicoes[index].tipos_de_arquivos_aceitos.splice(tipoIndex, 1);
        definicoes = [...definicoes];
    }
</script>

<div class="arquivos-section">
    <div class="arquivos-header">
        <h2>Definições de Arquivos de Avaliação</h2>
        <Button
            type="button"
            variant="secondary"
            on:click={addDefinicaoArquivo}
        >
            + Adicionar Tipo de Arquivo
        </Button>
    </div>
    <div class="arquivos-list">
        {#each definicoes as definicao, index}
            <div class="arquivo-item">
                <div class="arquivo-header">
                    <Input
                        type="text"
                        placeholder="Nome do tipo de arquivo"
                        bind:value={definicao.nome_tipo}
                        required
                        on:blur={() =>
                            handleNomeTipoChange(
                                index,
                                definicao.nome_tipo || "",
                            )}
                    />
                    <DeleteButton
                        size="sm"
                        title="Confirmar Exclusão"
                        confirmMessage="Tem certeza que deseja remover este tipo de arquivo?"
                        on:delete={() => removeDefinicaoArquivo(index)}
                    />
                </div>
                <TextArea
                    placeholder="Descrição do tipo de arquivo"
                    bind:value={definicao.descricao_tipo}
                    rows={2}
                    required
                />
                <div class="arquivo-max-value">
                    <label>Nota máxima para este tipo de arquivo:</label>
                    <Input
                        type="number"
                        placeholder="10"
                        bind:value={definicao.nota_maxima}
                        min="0"
                        max="100"
                        step="0.1"
                        size="sm"
                        required
                    />
                </div>
                <div class="arquivo-datetime">
                    <label>Data e hora de abertura:</label>
                    <Input
                        type="datetime-local"
                        value={toLocalISOString(
                            dataEHoraCriteriosEArquivos[
                                definicao.nome_tipo || ""
                            ]?.data_e_hora_inicio || new Date(),
                        )}
                        size="sm"
                        on:input={handleChangeInicio(definicao.nome_tipo || "")}
                    />
                    <label>Data e hora de fechamento:</label>
                    <Input
                        type="datetime-local"
                        value={toLocalISOString(
                            dataEHoraCriteriosEArquivos[
                                definicao.nome_tipo || ""
                            ]?.data_e_hora_fim || new Date(),
                        )}
                        size="sm"
                        on:input={handleChangeFim(definicao.nome_tipo || "")}
                    />
                </div>
                <div class="tipos-arquivos">
                    <label>Extensões aceitas:</label>
                    <div class="extensoes-list">
                        {#each definicao.tipos_de_arquivos_aceitos as tipo, tipoIndex}
                            <span class="extensao-tag">
                                .{tipo}
                                <button
                                    type="button"
                                    class="extensao-remove"
                                    on:click={() =>
                                        removeTipoArquivo(index, tipoIndex)}
                                    title="Remover extensão"
                                >
                                    ×
                                </button>
                            </span>
                        {/each}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        on:click={() => addTipoArquivo(index)}
                    >
                        + Adicionar Extensão
                    </Button>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .arquivos-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .arquivos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .arquivos-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }

    .arquivos-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }

    .arquivo-item {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: white;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .arquivo-item:last-child {
        border-bottom: none;
    }

    .arquivo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
    }

    .arquivo-datetime {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .arquivo-max-value {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .arquivo-max-value label {
        font-weight: 500;
        color: #495057;
    }

    .tipos-arquivos {
        margin-top: 1rem;
    }

    .tipos-arquivos label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .extensoes-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .extensao-tag {
        background-color: #e9ecef;
        padding: 0.375rem 0.75rem;
        border-radius: 15px;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: #495057;
    }

    .extensao-remove {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        color: #dc3545;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .extensao-remove:hover {
        background-color: #f8d7da;
    }
</style>
