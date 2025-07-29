<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import CriteriosForm from "$lib/components/CriteriosForm.svelte";
    import Input from "$lib/components/Input.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import ArquivosForm from "$lib/components/ArquivosForm.svelte";
    import { problemaStore } from "$lib/utils/stores";
    import type { CriteriosGroup } from "$lib/interfaces/interfaces";
    import { ProblemasService } from "$lib/services/problemas_service";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

    const turmaId = $page.params.id;

    let loading = false;
    let error: string | null = null;
    let formData = {
        nome_problema: "",
        criterios: getDefaultCriterios(),
        definicao_arquivos_de_avaliacao: getDefaultDefinicaoArquivos(),
        data_e_hora_criterios_e_arquivos: getDefaultDataEHoraCriterios(),
    };

    function getDefaultDataEHoraCriterios() {
        const defaultCriterios = getDefaultCriterios();
        const result: {
            [tag: string]: {
                data_e_hora_inicio: Date;
                data_e_hora_fim: Date;
            };
        } = {};
        Object.keys(defaultCriterios).forEach((tag) => {
            result[tag] = {
                data_e_hora_inicio: new Date(
                    new Date().getTime() + 60 * 60 * 1000,
                ),
                data_e_hora_fim: new Date(
                    new Date().getTime() + 2 * 60 * 60 * 1000,
                ),
            };
        });
        return result;
    }

    // Remove date validation for data_inicio and data_fim

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

    function getDefaultDefinicaoArquivos() {
        return [
            {
                nome_tipo: "Mapa Mental",
                descricao_tipo:
                    "Arquivo visual representando o raciocínio do grupo sobre o problema. Pode ser feito à mão ou digitalmente.",
                tipos_de_arquivos_aceitos: ["pdf", "png", "jpg", "jpeg"],
            },
        ];
    }

    async function handleSubmit() {
        try {
            loading = true;
            error = null;

            console.log(
                "Salvando data_e_hora_criterios_e_arquivos:",
                formData.data_e_hora_criterios_e_arquivos,
            );
            const payload = {
                ...formData,
                id_turma: parseInt(turmaId),
                criterios: JSON.stringify(formData.criterios),
                definicao_arquivos_de_avaliacao: JSON.stringify(
                    formData.definicao_arquivos_de_avaliacao,
                ),
                data_e_hora_criterios_e_arquivos: JSON.stringify(
                    formData.data_e_hora_criterios_e_arquivos,
                ),
            };

            const newProblema = await ProblemasService.create(payload);

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

{#if loading}
    <LoadingSpinner message="Carregando..." />
{:else}
    <PageHeader
        backUrl="/professor/turmas/{turmaId}/problemas"
        backText="Voltar para problemas"
        title="Novo Problema"
    />
    <form on:submit|preventDefault={handleSubmit} class="form">
        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        <div class="form-group">
            <Input
                type="text"
                id="nome_problema"
                label="Nome do Problema"
                bind:value={formData.nome_problema}
                required
            />
        </div>

        <!-- Removed DateRangeInput for data_inicio and data_fim -->

        <CriteriosForm
            bind:criterios={formData.criterios}
            bind:dataEHoraCriteriosEArquivos={
                formData.data_e_hora_criterios_e_arquivos
            }
        />

        <ArquivosForm
            bind:definicoes={formData.definicao_arquivos_de_avaliacao}
            dataEHoraCriteriosEArquivos={formData.data_e_hora_criterios_e_arquivos}
            on:changeDataEHoraCriteriosEArquivos={(e) => {
                console.log(
                    `Changing data_e_hora_criterios_e_arquivos to: ${JSON.stringify(
                        e.detail,
                    )}`,
                );
                formData.data_e_hora_criterios_e_arquivos = e.detail;
            }}
        />

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
{/if}

<style>
    .container {
        margin: 2rem auto;
        padding: 1rem 2rem;
        height: 100%;
        width: 100%;
    }

    .form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .error-message {
        background: #f8d7da;
        color: #842029;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
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

    @media (max-width: 768px) {
        .container {
            margin: 1rem auto;
            padding: 0.5rem 1rem;
        }

        .form {
            padding: 1.5rem;
            margin: 0 0.5rem;
        }

        .form-actions {
            flex-direction: column;
            gap: 0.8rem;
        }

        .form-actions :global(button) {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .container {
            margin: 0.5rem auto;
            padding: 0.25rem 0.5rem;
        }

        .form {
            padding: 1rem;
            margin: 0 0.25rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }
    }

    /* Global styles for form components on mobile */
    @media (max-width: 768px) {
        :global(.date-range-container) {
            flex-direction: column !important;
            gap: 1rem !important;
        }

        :global(.date-range-container > div) {
            width: 100% !important;
        }

        :global(.criterio-item) {
            flex-direction: column !important;
            gap: 0.8rem !important;
        }

        :global(.criterio-item > div) {
            width: 100% !important;
        }

        :global(.arquivo-item) {
            flex-direction: column !important;
            gap: 0.8rem !important;
        }

        :global(.arquivo-item > div) {
            width: 100% !important;
        }

        :global(.form-row) {
            flex-direction: column !important;
            gap: 1rem !important;
        }

        :global(.form-row > div) {
            width: 100% !important;
        }
    }
</style>
