<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { problemaStore } from "$lib/utils/stores";
    import { Parsers } from "$lib/interfaces/parsers";

    const turmaId = $page.params.id;

    interface Criterio {
        nome_criterio: string;
        descricao_criterio: string;
        nota_maxima: number;
    }

    interface CriteriosGroup {
        [tag: string]: Criterio[];
    }

    let loading = false;
    let error: string | null = null;
    let formData = {
        nome_problema: "",
        data_inicio: "",
        data_fim: "",
        criterios: getDefaultCriterios(),
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

    function getDefaultCriterios(): CriteriosGroup {
        return {
            "Análise do Problema": [
                {
                    nome_criterio: "Conhecimento",
                    descricao_criterio: `- Identificação do problema
- Elaboração das hipóteses Sistematização das hipóteses
- Formulação de bons objetivos de aprendizagem
- Coerência no raciocínio, argumentação e senso crítico
- Seleção de boas referências bibliográficas para o estudo individual
- Contribuição para responder os objetivos de aprendizagem e resolver o problema`,
                    nota_maxima: 1.0,
                },
                {
                    nome_criterio: "Habilidades",
                    descricao_criterio: `- Comunicação clara e eficaz
- Interlocução entre pares
- Colaboração mútua
- Negociação e construção de consenso
- Digitação
- Raciocínio coerente
- Capacidade de síntese
- Capacidade de exercer sua função no grupo tutorial`,
                    nota_maxima: 1.5,
                },
                {
                    nome_criterio: "Atitudes",
                    descricao_criterio: `- Pontualidade no início da sessão
- Respeito aos colegas e tutores
- Abertura à crítica
- Interesse e motivação nas discussões
- Ética e postura para o trabalho em equipe
- Autoavaliação
- Avaliação de pares
- Aparência e pontualidade na entrega do relatório
- Uso do celular durante a sessão
- Conversas paralelas durante a sessão`,
                    nota_maxima: 1.5,
                },
            ],
            "Resolução do Problema": [
                {
                    nome_criterio: "Conhecimento",
                    descricao_criterio: `- Identificação do problema
- Elaboração das hipóteses Sistematização das hipóteses
- Formulação de bons objetivos de aprendizagem
- Coerência no raciocínio, argumentação e senso crítico
- Seleção de boas referências bibliográficas para o estudo individual
- Contribuição para responder os objetivos de aprendizagem e resolver o problema`,
                    nota_maxima: 1.0,
                },
                {
                    nome_criterio: "Habilidades",
                    descricao_criterio: `- Comunicação clara e eficaz
- Interlocução entre pares
- Colaboração mútua
- Negociação e construção de consenso
- Digitação
- Raciocínio coerente
- Capacidade de síntese
- Capacidade de exercer sua função no grupo tutorial`,
                    nota_maxima: 1.5,
                },
                {
                    nome_criterio: "Atitudes",
                    descricao_criterio: `- Pontualidade no início da sessão
- Respeito aos colegas e tutores
- Abertura à crítica
- Interesse e motivação nas discussões
- Ética e postura para o trabalho em equipe
- Autoavaliação
- Avaliação de pares
- Aparência e pontualidade na entrega do relatório
- Uso do celular durante a sessão
- Conversas paralelas durante a sessão`,
                    nota_maxima: 1.5,
                },
            ],
        };
    }

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

    async function handleSubmit() {
        try {
            loading = true;
            error = null;

            const payload = {
                ...formData,
                id_turma: parseInt(turmaId),
                criterios: JSON.stringify(formData.criterios),
            };

            const response = await api.post("/problemas/create", payload);

            // Parse the response and add to store
            const newProblema = Parsers.parseProblema(response);
            problemaStore.update((problemas) => [...problemas, newProblema]);

            await goto(`/professor/turmas/${turmaId}/problemas`);
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to create problema";
            console.error("Error creating problema:", err);
        } finally {
            loading = false;
        }
    }
</script>

<div class="container">
    <div class="header">
        <div class="title-section">
            <a href="/professor/turmas/{turmaId}/problemas" class="back-link">
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
            <h1>Novo Problema</h1>
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
                                            bind:value={criterio.nota_maxima}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        class="remove-button"
                                        on:click={() =>
                                            removeCriterio(groupName, index)}
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

        <div class="form-actions">
            <Button
                type="button"
                variant="secondary"
                on:click={() => goto(`/professor/turmas/${turmaId}/problemas`)}
            >
                Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Criando..." : "Criar Problema"}
            </Button>
        </div>
    </form>
</div>

<style>
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
</style>
