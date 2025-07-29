<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Button from "$lib/components/Button.svelte";
    import CriteriosForm from "$lib/components/CriteriosForm.svelte";
    import Input from "$lib/components/Input.svelte";
    import TextArea from "$lib/components/TextArea.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import DateRangeInput from "$lib/components/DateRangeInput.svelte";
    import ArquivosForm from "$lib/components/ArquivosForm.svelte";
    import { api } from "$lib/utils/api";
    import { problemaStore } from "$lib/utils/stores";
    import { Parsers } from "$lib/interfaces/parsers";
    import type {
        CriteriosGroup,
        ProblemaModel,
        DefinicaoArquivoDeAvaliacao,
    } from "$lib/interfaces/interfaces";
    import { ProblemasService } from "$lib/services/problemas_service";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

    const turmaId = $page.params.id;
    const problemaId = $page.params.id_problema;

    let loading = true;
    let saving = false;
    let error: string | null = null;
    let problema: ProblemaModel | null = null;

    let formData: {
        nome_problema: string;
        criterios: CriteriosGroup;
        definicao_arquivos_de_avaliacao: DefinicaoArquivoDeAvaliacao[];
        data_e_hora_criterios_e_arquivos: {
            [tag: string]: {
                data_e_hora_inicio: Date;
                data_e_hora_fim: Date;
            };
        };
    } = {
        nome_problema: "",
        criterios: {} as CriteriosGroup,
        definicao_arquivos_de_avaliacao: [],
        data_e_hora_criterios_e_arquivos: {},
    };

    // Add date validation
    $: {
        // Remove date validation for data_inicio and data_fim
    }

    onMount(async () => {
        try {
            loading = true;
            error = null;
            // Load existing problema data
            const loadedProblema = await ProblemasService.getById(problemaId);
            if (!loadedProblema) throw new Error("Problema não encontrado");
            problema = loadedProblema;
            // Populate form with existing data
            const criteriosTags = Object.keys(problema!.criterios || {});
            const arquivoTags = (
                problema!.definicao_arquivos_de_avaliacao || []
            ).map((a) => a.nome_tipo);
            const allTags = [...criteriosTags, ...arquivoTags];
            formData = {
                nome_problema: problema!.nome_problema || "",
                criterios: problema!.criterios || {},
                definicao_arquivos_de_avaliacao:
                    problema!.definicao_arquivos_de_avaliacao || [],
                data_e_hora_criterios_e_arquivos: Object.fromEntries(
                    allTags.map((tag) => [
                        tag,
                        problema!.data_e_hora_criterios_e_arquivos &&
                        problema!.data_e_hora_criterios_e_arquivos[tag!]
                            ? {
                                  data_e_hora_inicio:
                                      problema!
                                          .data_e_hora_criterios_e_arquivos[
                                          tag!
                                      ].data_e_hora_inicio ?? new Date(),
                                  data_e_hora_fim:
                                      problema!
                                          .data_e_hora_criterios_e_arquivos[
                                          tag!
                                      ].data_e_hora_fim ?? new Date(),
                              }
                            : {
                                  data_e_hora_inicio: new Date(
                                      new Date().getTime() + 60 * 60 * 1000,
                                  ),
                                  data_e_hora_fim: new Date(
                                      new Date().getTime() + 2 * 60 * 60 * 1000,
                                  ),
                              },
                    ]),
                ),
            };
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to load problema";
            console.error("Error loading problema:", err);
        } finally {
            loading = false;
        }
    });

    async function handleSubmit() {
        try {
            saving = true;
            error = null;

            console.log(
                "Salvando data_e_hora_criterios_e_arquivos:",
                formData.data_e_hora_criterios_e_arquivos,
            );
            const payload = {
                ...formData,
                id_problema: parseInt(problemaId),
                id_turma: parseInt(turmaId),
                criterios: JSON.stringify(formData.criterios),
                definicao_arquivos_de_avaliacao: JSON.stringify(
                    formData.definicao_arquivos_de_avaliacao,
                ),
                data_e_hora_criterios_e_arquivos: JSON.stringify(
                    formData.data_e_hora_criterios_e_arquivos,
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
    <LoadingSpinner message="Carregando problema..." />
{:else}
    <PageHeader
        backUrl="/professor/turmas/{turmaId}/problemas"
        backText="Voltar para problemas"
        title="Editar Problema"
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

        <!-- Remove DateRangeInput for data_inicio and data_fim -->

        <CriteriosForm
            bind:criterios={formData.criterios}
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

        <ArquivosForm
            bind:definicoes={formData.definicao_arquivos_de_avaliacao}
            bind:dataEHoraCriteriosEArquivos={
                formData.data_e_hora_criterios_e_arquivos
            }
            on:changeDataEHoraCriteriosEArquivos={(e) => {
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
            <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
        </div>
    </form>
{/if}

<style>
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .form {
        background: white;
        padding: 0.2rem;
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
