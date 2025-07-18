<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import type { ProblemaModel } from "$lib/interfaces/interfaces";
    import type { Column } from "$lib/interfaces/column";
    import Button from "$lib/components/Button.svelte";
    import Container from "$lib/components/Container.svelte";
    import CardSection from "$lib/components/CardSection.svelte";
    import Table from "$lib/components/Table.svelte";
    import MetricsRow from "$lib/components/MetricsRow.svelte";
    import { goto } from "$app/navigation";

    let problema: ProblemaModel | null = null;
    let avaliacoes: any[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            const id_problema = $page.params.id_problema;
            const [problemaData, avaliacoesData] = await Promise.all([
                api.get(`/problemas/get/${id_problema}`),
                api.get(`/problemas/get-avaliacoes/${id_problema}`),
            ]);
            problema = problemaData;
            avaliacoes = avaliacoesData;
        } catch (e: any) {
            error = e.message || "Erro ao carregar o problema";
        } finally {
            loading = false;
        }
    });

    const formatDate = (date: Date | null) => {
        if (!date) return "Não definido";
        return new Date(date).toLocaleDateString("pt-BR");
    };

    const avaliacoesColumns: Column[] = [
        { key: "avaliador.nome_completo", label: "Avaliador" },
        { key: "avaliado.nome_completo", label: "Avaliado" },
        {
            key: "notas",
            label: "Média",
            render: (row: any) => {
                try {
                    const notasObj = JSON.parse(row.notas);
                    const values = Object.values(notasObj) as number[];
                    if (values.length === 0) return "0.0";
                    const avg =
                        values.reduce((a, b) => a + b, 0) / values.length;
                    return avg.toFixed(1);
                } catch {
                    return "0.0";
                }
            },
        },
    ];

    function handleBack() {
        const turmaId = $page.params.id;
        goto(`/professor/turmas/${turmaId}/problemas`);
    }
</script>

<Container>
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div
                class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
            ></div>
        </div>
    {:else if error}
        <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
        >
            <strong class="font-bold">Erro!</strong>
            <span class="block sm:inline">{error}</span>
        </div>
    {:else if problema}
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">{problema.nome_problema}</h1>
                <Button variant="secondary" on:click={handleBack}>Voltar</Button
                >
            </div>

            <CardSection title="Informações Gerais">
                <MetricsRow
                    metrics={[
                        {
                            label: "Data de Início",
                            value: formatDate(problema.data_inicio),
                        },
                        {
                            label: "Data de Fim",
                            value: formatDate(problema.data_fim),
                        },
                        {
                            label: "Média Geral",
                            value: problema.media_geral?.toFixed(1) || "0.0",
                        },
                    ]}
                />
            </CardSection>

            <CardSection title="Avaliações">
                {#if avaliacoes.length > 0}
                    <Table columns={avaliacoesColumns} rows={avaliacoes} />
                {:else}
                    <div class="text-center py-8 text-gray-500">
                        Nenhuma avaliação registrada
                    </div>
                {/if}
            </CardSection>
        </div>
    {/if}
</Container>
