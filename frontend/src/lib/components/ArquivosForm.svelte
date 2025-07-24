<script lang="ts">
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";
    import TextArea from "./TextArea.svelte";
    import type { DefinicaoArquivoDeAvaliacao } from "$lib/interfaces/interfaces";

    export let definicoes: DefinicaoArquivoDeAvaliacao[] = [];

    function addDefinicaoArquivo() {
        definicoes = [
            ...definicoes,
            {
                nome_tipo: "",
                descricao_tipo: "",
                tipos_de_arquivos_aceitos: [],
            },
        ];
    }

    function removeDefinicaoArquivo(index: number) {
        definicoes.splice(index, 1);
        definicoes = [...definicoes];
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
                    />
                    <button
                        type="button"
                        class="remove-button"
                        on:click={() => removeDefinicaoArquivo(index)}
                        title="Remover tipo de arquivo"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <TextArea
                    placeholder="Descrição do tipo de arquivo"
                    bind:value={definicao.descricao_tipo}
                    rows={2}
                    required
                />
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

    .remove-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #dc3545;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-button:hover {
        background-color: #f8d7da;
    }
</style>
