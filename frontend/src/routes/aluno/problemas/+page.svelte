<script lang="ts">
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import Table from "$lib/components/Table.svelte";
    import Container from "$lib/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Button from "$lib/components/Button.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import type { Column } from "$lib/interfaces/column";
    import { api } from "$lib/utils/api";
    import { Utils } from "$lib/utils/utils";
    import type { AlunoModel, ProblemaModel } from "$lib/interfaces/interfaces";
    import { currentUser } from "$lib/utils/auth";
    import { Parsers } from "$lib/interfaces/parsers";
    import { get } from "svelte/store";
    import { goto } from "$app/navigation";

    let problems: ProblemaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let showToast = false;
    let toastMessage: string = "";
    let toastType: "success" | "error" | "info" = "error";
    let isMobile = false;

    const columns: Column[] = [
        {
            key: "nome_problema",
            label: "Nome do Problema",
            sortable: true,
        },
        {
            key: "data_inicio",
            label: "Data de Início",
            sortable: true,
            render: (row: ProblemaModel) => Utils.formatDate(row.data_inicio),
        },
        {
            key: "data_fim",
            label: "Data de Término",
            sortable: true,
            render: (row: ProblemaModel) => Utils.formatDate(row.data_fim),
        },
        {
            key: "media_geral",
            label: "Média Geral",
            sortable: true,
            render: (row: ProblemaModel) =>
                row.media_geral ? row.media_geral.toFixed(2) : "0.00",
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: ProblemaModel) => ({
                component: "a",
                props: {
                    href: `/aluno/problemas/${row.id_problema}`,
                    class: "btn-action",
                    textContent: "Ver Problema",
                },
            }),
        },
    ];

    async function fetchProblems() {
        try {
            loading = true;
            error = null;

            if (!($currentUser as AlunoModel).id_turma) {
                loading = false;
                return;
            }

            problems = await api.get(
                "/problemas/list-by-turma?id_turma=" +
                    ($currentUser as AlunoModel).id_turma,
            );

            problems = Parsers.parseProblemas(problems);

            if (problems.length === 0) {
                toastType = "info";
                toastMessage = "Nenhum problema foi encontrado no momento.";
                showToast = true;
            }
        } catch (e: any) {
            error = e.message || "Erro ao carregar problemas";
            toastType = "error";
            toastMessage = error || "Erro ao carregar problemas";
            showToast = true;
        } finally {
            loading = false;
        }
    }

    $: user = get(currentUser) as AlunoModel;

    onMount(() => {
        const checkMobile = () => {
            isMobile = window.innerWidth <= 640;
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
    });

    onMount(fetchProblems);
</script>

<svelte:head>
    <title>Problemas - PBL</title>
    <meta name="description" content="Lista de problemas disponíveis" />
</svelte:head>

<div class="page-wrapper">
    <Container class="responsive-container no-padding-mobile full-width-mobile" maxWidth="full" glass={true} shadow={true}>
        <div class="header" in:fade={{ duration: 300, delay: 50 }}>
            <h1 class="responsive-title">Meus Problemas</h1>
            <p class="subtitle">Explore e resolva os problemas disponíveis</p>
        </div>

        <div class="content" in:fade={{ duration: 400, delay: 200 }}>
            {#if !loading && !user.id_turma}
                <div class="empty-section">
                    <div class="empty-content">
                        <div class="empty-icon">🎓</div>
                        <h3>Você ainda não está em uma turma</h3>
                        <p>
                            Para visualizar problemas, você precisa estar
                            matriculado em uma turma. Entre em contato com seu
                            professor para ser adicionado.
                        </p>
                        <Button variant="secondary" on:click={fetchProblems} class="responsive-btn">
                            Atualizar
                        </Button>
                    </div>
                </div>
            {:else if !loading && error}
                <div class="error-section">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h3>Ops! Algo deu errado</h3>
                        <p>Não foi possível carregar os problemas.</p>
                        <Button
                            variant="primary"
                            on:click={fetchProblems}
                            {loading}
                            class="responsive-btn"
                        >
                            Tentar Novamente
                        </Button>
                    </div>
                </div>
            {:else if !loading && problems.length === 0}
                <div class="empty-section">
                    <div class="empty-content">
                        <div class="empty-icon">📚</div>
                        <h3>Nenhum problema disponível</h3>
                        <p>
                            Não há problemas cadastrados no momento. Volte mais
                            tarde ou entre em contato com seu professor.
                        </p>
                        <Button variant="secondary" on:click={fetchProblems} class="responsive-btn">
                            Atualizar
                        </Button>
                    </div>
                </div>
            {:else}
                {#if isMobile}
                    <div class="problems-list-mobile">
                        {#each problems as problema}
                            <div class="problem-card">
                                <div class="problem-title">{problema.nome_problema}</div>
                                <div class="problem-dates">
                                    <span>Início: {Utils.formatDate(problema.data_inicio)}</span>
                                    <span>Fim: {Utils.formatDate(problema.data_fim)}</span>
                                </div>
                                <div class="problem-actions">
                                    <Button
                                        variant="primary"
                                        class="responsive-btn"
                                        on:click={() => goto(`/aluno/problemas/${problema.id_problema}`)}
                                    >
                                        Ver Problema
                                    </Button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <Table rows={problems} {columns} {loading} />
                {/if}
            {/if}
        </div>
    </Container>
</div>

{#if showToast}
    <Toast
        type={toastType}
        title={toastType === "error" ? "Erro!" : "Informação"}
        message={toastMessage}
        on:dismiss={() => (showToast = false)}
    />
{/if}

<style>
    :global(body) {
        background: linear-gradient(
            135deg,
            #ffffff 0%,
            #f8f9fa 50%,
            #e9ecef 100%
        );
        min-height: 100vh;
    }

    .page-wrapper {
        min-height: 100vh;
        padding: 2rem;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        box-sizing: border-box;
    }

    .header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .header h1 {
        color: #2d3748;
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.025em;
    }

    .subtitle {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0;
        opacity: 0.9;
    }

    .content {
        width: 100%;
        max-width: 100%;
    }

    /* Loading Section */
    .loading-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
    }

    /* Error Section */
    .error-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 1rem;
    }

    .error-content {
        text-align: center;
        max-width: 400px;
        width: 100%;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(220, 53, 69, 0.1);
        border: 1px solid rgba(220, 53, 69, 0.1);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .error-content h3 {
        color: #dc3545;
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .error-content p {
        color: #6c757d;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
    }

    /* Empty Section */
    .empty-section {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 1rem;
    }

    .empty-content {
        text-align: center;
        max-width: 400px;
        width: 100%;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .empty-content h3 {
        color: #2d3748;
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .empty-content p {
        color: #4a5568;
        margin: 0 0 1.5rem 0;
        line-height: 1.6;
    }

    /* Table styling */
    :global(.content > table) {
        width: 100%;
        max-width: 100%;
    }

    /* Action Button Styling */
    :global(.btn-action) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        white-space: nowrap;
    }

    :global(.btn-action:hover) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        text-decoration: none;
    }

    :global(.btn-action:active) {
        transform: translateY(0);
    }

    .problems-list-mobile {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
    }
    .problem-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .problem-title {
        font-weight: 600;
        font-size: 1.1rem;
    }
    .problem-dates {
        font-size: 0.95rem;
        color: #555;
        display: flex;
        gap: 1.5rem;
    }
    .problem-actions {
        margin-top: 0.75rem;
        display: flex;
        justify-content: center;
    }
    .problem-actions .responsive-btn {
        width: 100%;
        max-width: 220px;
        font-size: 1.05rem;
        padding: 0.85rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(80, 80, 200, 0.10);
        font-weight: 600;
        transition: background 0.2s, box-shadow 0.2s;
        display: block;
    }
    .problem-actions .responsive-btn:hover {
        background: #5a67d8;
        color: #fff;
        box-shadow: 0 4px 16px rgba(80, 80, 200, 0.18);
    }
</style>
