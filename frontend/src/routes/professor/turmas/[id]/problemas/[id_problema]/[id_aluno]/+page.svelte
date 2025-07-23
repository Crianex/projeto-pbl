<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import { goto } from "$app/navigation";
    import { currentUser } from "$lib/utils/auth";
    import type {
        ProblemaModel,
        AlunoModel,
        TurmaModel,
    } from "$lib/interfaces/interfaces";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import { MediaCalculator } from "$lib/utils/utils";
    import Button from "$lib/components/Button.svelte";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { AlunosService } from "$lib/services/alunos_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import Pagination from "$lib/components/Pagination.svelte";

    let problema: ProblemaModel | null = null;
    let aluno: AlunoModel | null = null;
    let turma: TurmaModel | null = null;
    let avaliacoesEnviadas: any[] = [];
    let avaliacoesRecebidas: any[] = [];
    let loading = true;
    let error: string | null = null;

    // Paginação para avaliações enviadas
    let currentPageEnviadas = 1;
    let itemsPerPage = 10;

    // Paginação para avaliações recebidas
    let currentPageRecebidas = 1;

    let criteriosList: { nome_criterio: string; descricao_criterio: string }[] =
        [];

    $: if (problema && problema.criterios) {
        const criteriosMap = new Map<string, string>();
        Object.values(problema.criterios).forEach((criteriosArr) => {
            criteriosArr.forEach((criterio) => {
                if (!criteriosMap.has(criterio.nome_criterio)) {
                    criteriosMap.set(
                        criterio.nome_criterio,
                        criterio.descricao_criterio,
                    );
                }
            });
        });
        criteriosList = Array.from(criteriosMap.entries()).map(
            ([nome_criterio, descricao_criterio]) => ({
                nome_criterio,
                descricao_criterio,
            }),
        );
    }

    // Configuração da tabela para avaliações enviadas
    $: columnsEnviadas = [
        {
            key: "aluno",
            label: "Aluno",
            width: "30%",
        },
        {
            key: "notas",
            label: "Notas (C/H/A)",
            width: "50%",
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
        },
    ];

    // Configuração da tabela para avaliações recebidas
    $: columnsRecebidas = [
        {
            key: "aluno",
            label: "Aluno",
            width: "30%",
        },
        {
            key: "notas",
            label: "Notas (C/H/A)",
            width: "50%",
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
        },
    ];

    onMount(async () => {
        try {
            const { id_problema, id_aluno, id } = $page.params;
            logger.info(
                `Loading aluno details for id_aluno: ${id_aluno}, problema: ${id_problema}, turma: ${id}`,
            );

            const [problemaData, alunoData, turmaData, avaliacoesData] =
                await Promise.all([
                    ProblemasService.getById(id_problema),
                    AlunosService.getById(id_aluno),
                    TurmasService.getById(id),
                    AvaliacoesService.getByProblema(id_problema),
                ]);

            problema = problemaData;
            aluno = alunoData;
            turma = turmaData;

            // Processar avaliações enviadas pelo aluno
            const currentAlunoId = Number($page.params.id_aluno);
            avaliacoesEnviadas = avaliacoesData
                .filter((av: any) => av.id_aluno_avaliador === currentAlunoId)
                .map((av: any) => {
                    const alunoAvaliado = turma?.alunos?.find(
                        (a: any) => a.id === av.id_aluno_avaliado,
                    );
                    return {
                        id: av.id,
                        aluno: aluno?.nome_completo || "Aluno",
                        notas: formatNotas(av.notas),
                        enviada_para:
                            alunoAvaliado?.nome_completo ||
                            "Aluno não encontrado",
                    };
                });

            // Processar avaliações recebidas pelo aluno
            avaliacoesRecebidas = avaliacoesData
                .filter((av: any) => av.id_aluno_avaliado === currentAlunoId)
                .map((av: any) => {
                    const alunoAvaliador = turma?.alunos?.find(
                        (a: any) => a.id === av.id_aluno_avaliador,
                    );
                    return {
                        id: av.id,
                        aluno: alunoAvaliador?.nome_completo || "Aluno",
                        notas: formatNotas(av.notas),
                        enviada_para: aluno?.nome_completo || "Aluno",
                    };
                });
        } catch (e: any) {
            logger.error("Error loading aluno details:", e);
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
        }
    });

    function formatNotas(notas: string | null) {
        if (!notas) return "Não avaliado";

        const criteriosHardcoded = [
            { nome_criterio: "conhecimento" },
            { nome_criterio: "habilidades" },
            { nome_criterio: "atitudes" },
        ];

        const medias = MediaCalculator.calcularMediaPorCriterioSingle(
            notas,
            criteriosHardcoded,
        );

        if (!medias) return "Erro ao processar notas";

        const competencia = medias.conhecimento || 0;
        const habilidade = medias.habilidades || 0;
        const atitude = medias.atitudes || 0;

        return `(${competencia.toFixed(2)}, ${habilidade.toFixed(2)}, ${atitude.toFixed(2)})`;
    }

    function handleAvaliarAluno() {
        const { id_problema, id_aluno, id } = $page.params;
        goto(
            `/professor/turmas/${id}/problemas/${id_problema}/avaliar/${id_aluno}`,
        );
    }

    // Paginação para avaliações enviadas
    $: totalPagesEnviadas = Math.ceil(avaliacoesEnviadas.length / itemsPerPage);
    $: paginatedAvaliacoesEnviadas = avaliacoesEnviadas.slice(
        (currentPageEnviadas - 1) * itemsPerPage,
        currentPageEnviadas * itemsPerPage,
    );

    // Paginação para avaliações recebidas
    $: totalPagesRecebidas = Math.ceil(
        avaliacoesRecebidas.length / itemsPerPage,
    );
    $: paginatedAvaliacoesRecebidas = avaliacoesRecebidas.slice(
        (currentPageRecebidas - 1) * itemsPerPage,
        currentPageRecebidas * itemsPerPage,
    );
</script>

<Container maxWidth="xl" glass={true} shadow={true}>
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner" />
        </div>
    {:else if error}
        <div class="error-alert" role="alert">
            <strong>Erro!</strong>
            <span>{error}</span>
        </div>
    {:else}
        <div class="content-wrapper">
            <div class="back-button-container">
                <BackButton text="Voltar" on:click={() => history.back()} />
            </div>

            <div class="page-title">
                <h1>Avaliações do Aluno</h1>
            </div>

            <div class="header">
                <div class="problema-info">
                    <span class="problema-title"
                        >{problema?.nome_problema || ""}</span
                    >
                    <div class="aluno-profile">
                        <Avatar 
                            src={aluno?.link_avatar || "/avatars/default.png"} 
                            alt={`Avatar de ${aluno?.nome_completo || "Aluno"}`}
                            size="md"
                        />
                        <span class="aluno-name">{aluno?.nome_completo || ""}</span>
                    </div>
                </div>
            </div>

            <!-- Seção de Avaliações Enviadas -->
            <div class="avaliacoes-section">
                <h2>Avaliações Enviadas</h2>

                {#if paginatedAvaliacoesEnviadas.length === 0}
                    <div class="empty-state">
                        <div class="empty-icon">📤</div>
                        <h3>Nenhuma avaliação enviada</h3>
                        <p>Este aluno ainda não enviou nenhuma avaliação.</p>
                    </div>
                {:else}
                    <div class="table-wrapper">
                        <Table
                            columns={columnsEnviadas}
                            rows={paginatedAvaliacoesEnviadas}
                            enableSelection={false}
                        />
                    </div>

                    {#if totalPagesEnviadas > 1}
                        <div class="pagination-wrapper">
                            <Pagination
                                currentPage={currentPageEnviadas}
                                totalPages={totalPagesEnviadas}
                                on:pageChange={(e) =>
                                    (currentPageEnviadas = e.detail.page)}
                            />
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Seção de Avaliações Recebidas -->
            <div class="avaliacoes-section">
                <h2>Avaliações Recebidas</h2>

                {#if paginatedAvaliacoesRecebidas.length === 0}
                    <div class="empty-state">
                        <div class="empty-icon">📥</div>
                        <h3>Nenhuma avaliação recebida</h3>
                        <p>Este aluno ainda não recebeu nenhuma avaliação.</p>
                    </div>
                {:else}
                    <div class="table-wrapper">
                        <Table
                            columns={columnsRecebidas}
                            rows={paginatedAvaliacoesRecebidas}
                            enableSelection={false}
                        />
                    </div>

                    {#if totalPagesRecebidas > 1}
                        <div class="pagination-wrapper">
                            <Pagination
                                currentPage={currentPageRecebidas}
                                totalPages={totalPagesRecebidas}
                                on:pageChange={(e) =>
                                    (currentPageRecebidas = e.detail.page)}
                            />
                        </div>
                    {/if}
                {/if}
            </div>

            <!-- Botão de Avaliar Aluno -->
            <div class="actions-section">
                <Button
                    variant="primary"
                    on:click={handleAvaliarAluno}
                    class="avaliar-button"
                >
                    Avaliar Aluno
                </Button>
            </div>
        </div>
    {/if}
</Container>

<style>
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .back-button-container {
        padding: 0.5rem 0;
        padding-top: 2rem;
        margin-bottom: 1rem;
    }

    .back-button-container :global(.back-btn) {
        padding-top: 2.5rem;
        padding-bottom: 2.5rem;
    }

    .page-title {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .page-title h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        color: #2d3748;
        letter-spacing: -0.025em;
    }

    .header {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .problema-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        text-align: left;
    }

    .problema-title {
        font-size: 1rem;
        color: #6c757d;
        font-weight: 500;
    }

    .aluno-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .aluno-name {
        font-size: 1.125rem;
        color: #4a5568;
        font-weight: 600;
    }

    .avaliacoes-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
    }

    .avaliacoes-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: #2d3748;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    .table-wrapper {
        margin-bottom: 1rem;
    }

    .pagination-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6c757d;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #4a5568;
    }

    .empty-state p {
        margin: 0;
        font-size: 0.875rem;
    }

    .actions-section {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    .avaliar-button {
        min-width: 200px;
        height: 48px;
        font-size: 1rem;
        font-weight: 600;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 16rem;
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

    .error-alert {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    .error-alert strong {
        font-weight: 700;
        margin-right: 0.5rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .back-button-container {
            padding: 0.75rem 0;
            margin-bottom: 0.75rem;
        }

        .page-title h1 {
            font-size: 1.75rem;
        }

        .avaliacoes-section {
            padding: 1rem;
        }

        .avaliacoes-section h2 {
            font-size: 1.125rem;
        }

        .empty-state {
            padding: 2rem 1rem;
        }

        .avaliar-button {
            min-width: 100%;
        }
    }

    @media (max-width: 480px) {
        .back-button-container {
            padding: 0.5rem 0;
            margin-bottom: 0.5rem;
        }

        .page-title h1 {
            font-size: 1.5rem;
        }

        .avaliacoes-section {
            padding: 0.75rem;
        }

        .empty-state {
            padding: 1.5rem 0.5rem;
        }
    }
</style>
