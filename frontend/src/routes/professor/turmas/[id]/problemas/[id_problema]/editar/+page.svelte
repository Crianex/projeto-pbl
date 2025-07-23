<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { problemaStore } from "$lib/utils/stores";
    import { Parsers } from "$lib/interfaces/parsers";
    import type {
        CriteriosGroup,
        ProblemaModel,
        DefinicaoArquivoDeAvaliacao,
    } from "$lib/interfaces/interfaces";
    import { ProblemasService } from "$lib/services/problemas_service";

    const turmaId = $page.params.id;
    const problemaId = $page.params.id_problema;

    let loading = true;
    let saving = false;
    let error: string | null = null;
    let problema: ProblemaModel | null = null;

    let formData: {
        nome_problema: string;
        data_inicio: string;
        data_fim: string;
        criterios: CriteriosGroup;
        definicao_arquivos_de_avaliacao: DefinicaoArquivoDeAvaliacao[];
    } = {
        nome_problema: "",
        data_inicio: "",
        data_fim: "",
        criterios: {} as CriteriosGroup,
        definicao_arquivos_de_avaliacao: [],
    };

    // Add date validation
    $: {
        if (formData.data_inicio && formData.data_fim) {
            const startDate = new Date(formData.data_inicio);
            const endDate = new Date(formData.data_fim);
            if (startDate > endDate) {
                formData.data_fim = formData.data_inicio;
            }
        }
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    function validateStartDate(event: Event) {
        const target = event.target as HTMLInputElement;
        const selectedDate = new Date(target.value);
        const todayDate = new Date(today);

        if (selectedDate < todayDate) {
            target.value = today;
            formData.data_inicio = today;
            alert("A data de início não pode ser anterior a hoje.");
        }
    }

    function validateEndDate(event: Event) {
        const target = event.target as HTMLInputElement;
        const selectedDate = new Date(target.value);
        const startDate = new Date(formData.data_inicio);

        if (selectedDate < startDate) {
            target.value = formData.data_inicio;
            formData.data_fim = formData.data_inicio;
            alert("A data de fim não pode ser anterior à data de início.");
        }
    }

    onMount(async () => {
        try {
            loading = true;
            error = null;

            // Load existing problema data
            problema = await ProblemasService.getById(problemaId);

            // Populate form with existing data
            formData = {
                nome_problema: problema.nome_problema || "",
                data_inicio: problema.data_inicio
                    ? new Date(problema.data_inicio).toISOString().split("T")[0]
                    : "",
                data_fim: problema.data_fim
                    ? new Date(problema.data_fim).toISOString().split("T")[0]
                    : "",
                criterios: problema.criterios || {},
                definicao_arquivos_de_avaliacao:
                    problema.definicao_arquivos_de_avaliacao || [],
            };
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to load problema";
            console.error("Error loading problema:", err);
        } finally {
            loading = false;
        }
    });

    function addCriterioGroup() {
        const newGroupName = prompt("Nome do novo grupo de critérios:");
        if (newGroupName && !formData.criterios[newGroupName]) {
            formData.criterios = {
                ...formData.criterios,
                [newGroupName]: [],
            };
        }
    }

    function addCriterio(groupName: string) {
        formData.criterios = {
            ...formData.criterios,
            [groupName]: [
                ...formData.criterios[groupName],
                {
                    nome_criterio: "",
                    descricao_criterio: "",
                    nota_maxima: 1.0,
                },
            ],
        };
    }

    function removeCriterio(groupName: string, index: number) {
        formData.criterios[groupName].splice(index, 1);
        if (formData.criterios[groupName].length === 0) {
            const { [groupName]: removed, ...rest } = formData.criterios;
            formData.criterios = rest;
        } else {
            formData.criterios = { ...formData.criterios };
        }
    }

    function addDefinicaoArquivo() {
        formData.definicao_arquivos_de_avaliacao = [
            ...formData.definicao_arquivos_de_avaliacao,
            {
                nome_tipo: "",
                descricao_tipo: "",
                tipos_de_arquivos_aceitos: [],
            },
        ];
    }

    function removeDefinicaoArquivo(index: number) {
        formData.definicao_arquivos_de_avaliacao.splice(index, 1);
        formData.definicao_arquivos_de_avaliacao = [
            ...formData.definicao_arquivos_de_avaliacao,
        ];
    }

    function addTipoArquivo(index: number) {
        const tipo = prompt("Digite a extensão do arquivo (ex: pdf, png):");
        if (tipo) {
            formData.definicao_arquivos_de_avaliacao[
                index
            ].tipos_de_arquivos_aceitos.push(tipo);
            formData.definicao_arquivos_de_avaliacao = [
                ...formData.definicao_arquivos_de_avaliacao,
            ];
        }
    }

    function removeTipoArquivo(index: number, tipoIndex: number) {
        formData.definicao_arquivos_de_avaliacao[
            index
        ].tipos_de_arquivos_aceitos.splice(tipoIndex, 1);
        formData.definicao_arquivos_de_avaliacao = [
            ...formData.definicao_arquivos_de_avaliacao,
        ];
    }

    async function handleSubmit() {
        try {
            saving = true;
            error = null;

            const payload = {
                ...formData,
                id_problema: parseInt(problemaId),
                id_turma: parseInt(turmaId),
                criterios: JSON.stringify(formData.criterios),
                definicao_arquivos_de_avaliacao: JSON.stringify(
                    formData.definicao_arquivos_de_avaliacao,
                ),
            };

            // Use the service instead of raw API call
            const updatedProblema = await ProblemasService.update(
                problemaId,
                payload,
            );

            // Update store (cache will be automatically invalidated by service)
            problemaStore.update((problemas) =>
                problemas.map((p) =>
                    p.id_problema === updatedProblema.id_problema
                        ? updatedProblema
                        : p,
                ),
            );

            await goto(`/professor/turmas/${turmaId}/problemas`);
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to update problema";
            console.error("Error updating problema:", err);
        } finally {
            saving = false;
        }
    }
</script>

{#if loading}
    <div class="loading-container">
        <div class="loading-spinner" />
        <p>Carregando problema...</p>
    </div>
{:else}
    <div class="container">
        <div class="header">
            <div class="title-section">
                <a
                    href="/professor/turmas/{turmaId}/problemas"
                    class="back-link"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M19 12H5M12 19l-7-7 7-7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    Voltar para problemas
                </a>
                <h1>Editar Problema</h1>
            </div>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="form">
            {#if error}
                <div class="error-message">
                    {error}
                </div>
            {/if}

            <div class="form-group">
                <label for="nome_problema">Nome do Problema</label>
                <input
                    type="text"
                    id="nome_problema"
                    bind:value={formData.nome_problema}
                    required
                />
            </div>

            <div class="form-group">
                <label for="data_inicio">Data de Início</label>
                <input
                    type="date"
                    id="data_inicio"
                    bind:value={formData.data_inicio}
                    min={today}
                    required
                    on:change={validateStartDate}
                />
            </div>

            <div class="form-group">
                <label for="data_fim">Data de Fim</label>
                <input
                    type="date"
                    id="data_fim"
                    bind:value={formData.data_fim}
                    min={formData.data_inicio || today}
                    disabled={!formData.data_inicio}
                    required
                    on:change={validateEndDate}
                />
                {#if !formData.data_inicio}
                    <span class="helper-text"
                        >Selecione uma data de início primeiro</span
                    >
                {/if}
            </div>

            <div class="criterios-section">
                <div class="criterios-header">
                    <h2>Critérios de Avaliação</h2>
                    <Button
                        type="button"
                        variant="secondary"
                        on:click={addCriterioGroup}
                    >
                        + Adicionar Grupo
                    </Button>
                </div>

                {#each Object.entries(formData.criterios) as [groupName, criterios]}
                    <div class="criterio-group">
                        <h3>{groupName}</h3>
                        <div class="criterios-list">
                            {#each criterios as criterio, index}
                                <div class="criterio-item">
                                    <div class="criterio-header">
                                        <input
                                            type="text"
                                            placeholder="Nome do critério"
                                            bind:value={criterio.nome_criterio}
                                            required
                                        />
                                        <div class="nota-maxima">
                                            <label>Nota Máxima:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.5"
                                                bind:value={
                                                    criterio.nota_maxima
                                                }
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            class="remove-button"
                                            on:click={() =>
                                                removeCriterio(
                                                    groupName,
                                                    index,
                                                )}
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
                                    <textarea
                                        placeholder="Descrição do critério"
                                        bind:value={criterio.descricao_criterio}
                                        rows="3"
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
                    {#each formData.definicao_arquivos_de_avaliacao as definicao, index}
                        <div class="arquivo-item">
                            <div class="arquivo-header">
                                <input
                                    type="text"
                                    placeholder="Nome do tipo de arquivo"
                                    bind:value={definicao.nome_tipo}
                                    required
                                />
                                <button
                                    type="button"
                                    class="remove-button"
                                    on:click={() =>
                                        removeDefinicaoArquivo(index)}
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
                            <textarea
                                placeholder="Descrição do tipo de arquivo"
                                bind:value={definicao.descricao_tipo}
                                rows="2"
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
                                                    removeTipoArquivo(
                                                        index,
                                                        tipoIndex,
                                                    )}
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

            <div class="form-actions">
                <Button
                    type="button"
                    variant="secondary"
                    on:click={() =>
                        goto(`/professor/turmas/${turmaId}/problemas`)}
                >
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </div>
        </form>
    </div>
{/if}

<style>
    .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 50vh;
        gap: 1rem;
    }

    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .container {
        margin: 2rem auto;
        padding: 1rem 2rem;
        height: 100%;
        width: 100%;
    }

    .header {
        margin-bottom: 2rem;
    }

    .title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        text-decoration: none;
        font-size: 0.875rem;
    }

    .back-link:hover {
        color: #0d6efd;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
    }

    .form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .form-group input {
        padding: 0.75rem;
        width: 100%;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .error-message {
        background: #f8d7da;
        color: #842029;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

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
    }

    .criterio-group h3 {
        font-size: 1.1rem;
        font-weight: 500;
        color: #495057;
        margin: 0 0 1rem 0;
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
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
    }

    .criterio-header input {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .nota-maxima {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .nota-maxima label {
        color: #495057;
        font-size: 0.875rem;
    }

    .nota-maxima input {
        width: 80px;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .criterio-item textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        resize: vertical;
        min-height: 10rem;
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

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    :global(.criterios-list .button) {
        margin: 1rem;
    }

    .helper-text {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6c757d;
    }

    .form-group input:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
    }

    /* New styles for arquivos-section */
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

    .arquivo-header input {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        flex-grow: 1;
        margin-right: 0.5rem;
    }

    .arquivo-item textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        resize: vertical;
        min-height: 6rem;
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
