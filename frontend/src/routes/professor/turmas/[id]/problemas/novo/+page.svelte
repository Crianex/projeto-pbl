<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { problemaStore } from "$lib/utils/stores";
    import { Parsers } from "$lib/interfaces/parsers";
    import type { CriteriosGroup } from "$lib/interfaces/interfaces";
    import { currentUser } from "$lib/utils/auth";
    import { ProblemasService } from "$lib/services/problemas_service";

    const turmaId = $page.params.id;

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

            // Invalidate cache for this turma's problemas
            ProblemasService.invalidateCache(undefined, turmaId);

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

<Container class="responsive-container" maxWidth="xl" glass={true} shadow={true}>
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
</Container>

<style>
    /* Remover estilos de responsividade duplicados já cobertos pelo global */
    /* Manter apenas estilos específicos que não estão no global */
</style>
