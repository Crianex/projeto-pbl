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
    import { DateUtils, Utils } from "$lib/utils/utils";
    import type { AlunoModel, ProblemaModel } from "$lib/interfaces/interfaces";
    import { currentUser } from "$lib/utils/auth";
    import { Parsers } from "$lib/interfaces/parsers";
    import { get } from "svelte/store";

    let problems: ProblemaModel[] = [];
    let loading = true;
    let error: string | null = null;
    let showToast = false;
    let toastMessage: string = "";
    let toastType: "success" | "error" | "info" = "error";

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
            render: (row: ProblemaModel) => {
                const tagStatusArr =
                    DateUtils.getDateStartStatusArrayFromProblemaModel(row);
                const html = tagStatusArr
                    .map(
                        ({ tag, date, isActive }) =>
                            `<span class=\"tag-status ${isActive ? "tag-green" : "tag-red"}\">${tag}: ${date}</span>`,
                    )
                    .join(Utils.isMobile() ? "<br>" : "<br><br>");
                return { component: "html", props: { html } };
            },
        },
        {
            key: "data_fim",
            label: "Data de Término",
            sortable: true,
            render: (row: ProblemaModel) => {
                const tagStatusArr =
                    DateUtils.getDateEndStatusArrayFromProblemaModel(row);
                const html = tagStatusArr
                    .map(
                        ({ tag, date, isActive }) =>
                            `<span class=\"tag-status ${isActive ? "tag-green" : "tag-red"}\">${tag}: ${date}</span>`,
                    )
                    .join(Utils.isMobile() ? "<br>" : "<br><br>");
                return { component: "html", props: { html } };
            },
        },
        {
            key: "media_geral",
            label: "Minha Média",
            sortable: true,
            render: (row: ProblemaModel) =>
                row.media_geral !== null && row.media_geral !== undefined
                    ? row.media_geral.toFixed(2)
                    : "Não avaliado",
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: ProblemaModel) => {
                return {
                    component: "a",
                    props: {
                        href: `/aluno/problemas/${row.id_problema}`,
                        class: "btn-action",
                        textContent: "Ver Problema",
                    },
                };
            },
        },
    ];

    async function fetchProblems() {
        try {
            loading = true;
            error = null;

            const currentUserData = get(currentUser) as AlunoModel;

            // First, try to refresh user data in case they were added to a turma
            if (currentUserData?.id) {
                try {
                    const updatedUserData = await api.get(
                        `/alunos/get?id_aluno=${currentUserData.id}`,
                    );
                    const parsedUser = Parsers.parseAluno(updatedUserData);
                    currentUser.set(parsedUser);
                    console.log("User data refreshed:", parsedUser);
                } catch (e) {
                    console.log("Could not refresh user data:", e);
                    // Continue with existing user data
                }
            }

            // Get the updated user data after refresh
            const updatedUserData = get(currentUser) as AlunoModel;

            if (!updatedUserData.id_turma) {
                loading = false;
                console.log("No id_turma after refresh");
                return;
            }

            problems = await api.get(
                "/problemas/list-by-turma?id_turma=" +
                    updatedUserData.id_turma +
                    "&id_aluno=" +
                    updatedUserData.id,
            );

            problems = Parsers.parseProblemas(problems);

            // Sort problems alphabetically by name
            problems.sort((a, b) =>
                (a.nome_problema || "").localeCompare(
                    b.nome_problema || "",
                    "pt-BR",
                    {
                        sensitivity: "base",
                    },
                ),
            );

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

    $: user = $currentUser as AlunoModel;

    // Reactive statement to track user changes for debugging
    $: console.log("User data updated:", {
        id: user?.id,
        id_turma: user?.id_turma,
        nome: user?.nome_completo,
    });

    onMount(fetchProblems);
</script>

<svelte:head>
    <title>Problemas - PBL</title>
    <meta name="description" content="Lista de problemas disponíveis" />
</svelte:head>

<div style="max-width:1280px;width:100%;margin:0 auto;">
    <div class="header" in:fade={{ duration: 300, delay: 50 }}>
        <h1>Meus Problemas</h1>
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
                    <Button variant="secondary" on:click={fetchProblems}>
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
                    <Button variant="secondary" on:click={fetchProblems}>
                        Atualizar
                    </Button>
                </div>
            </div>
        {:else}
            <Table rows={problems} {columns} {loading} />
        {/if}
    </div>
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
        background: var(--color-bg-gradient);
        min-height: 100dvh;
    }

    .page-wrapper {
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem 0.5rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.3rem;
        }

        .subtitle {
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .page-wrapper {
            padding: 0.5rem 0.25rem;
        }

        .header {
            margin-bottom: 1rem;
        }

        .header h1 {
            font-size: 1.1rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }
    }

    .header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .header h1 {
        color: var(--color-text-primary);
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.025em;
    }

    .subtitle {
        color: var(--color-text-secondary);
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
        background: var(--color-glass-white);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px var(--color-shadow-error);
        border: 1px solid var(--color-error-border);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .error-content h3 {
        color: var(--color-error-main);
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .error-content p {
        color: var(--color-text-muted);
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
        background: var(--color-glass-white);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 10px 25px var(--color-shadow-light);
        border: 1px solid var(--color-glass-border);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .empty-content h3 {
        color: var(--color-text-primary);
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .empty-content p {
        color: var(--color-text-muted);
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
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
        background: var(--color-primary-gradient);
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

    /* Large screens optimization */
    @media (min-width: 1200px) {
        .page-wrapper {
            padding: 3rem;
        }

        .header h1 {
            font-size: 3rem;
        }

        .subtitle {
            font-size: 1.2rem;
        }

        .error-content,
        .empty-content {
            max-width: 500px;
            padding: 3rem;
        }
    }

    @media (min-width: 1600px) {
        .page-wrapper {
            padding: 4rem;
        }

        .header {
            margin-bottom: 3rem;
        }
    }

    /* Medium to large screens */
    @media (min-width: 1024px) and (max-width: 1199px) {
        .page-wrapper {
            padding: 2.5rem;
        }

        .header h1 {
            font-size: 2.75rem;
        }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem;
            padding-top: 5rem; /* Account for mobile menu */
        }

        .header h1 {
            font-size: 2rem;
        }

        .subtitle {
            font-size: 1rem;
        }

        .error-content,
        .empty-content {
            padding: 1.5rem;
            margin: 0;
        }

        .error-content h3,
        .empty-content h3 {
            font-size: 1.25rem;
        }
    }

    @media (max-width: 640px) {
        .page-wrapper {
            padding: 0.75rem;
            padding-top: 5rem;
        }

        .header h1 {
            font-size: 1.75rem;
        }

        .error-icon,
        .empty-icon {
            font-size: 2.5rem;
        }

        .error-content,
        .empty-content {
            padding: 1.25rem;
        }

        /* Improve table readability on mobile */
        :global(.content table) {
            font-size: 0.875rem;
        }

        :global(.btn-action) {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .page-wrapper {
            padding: 0.5rem;
            padding-top: 4.5rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.5rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }

        .error-content,
        .empty-content {
            padding: 1rem;
        }

        .error-icon,
        .empty-icon {
            font-size: 2rem;
        }

        .error-content h3,
        .empty-content h3 {
            font-size: 1.125rem;
        }

        .error-content p,
        .empty-content p {
            font-size: 0.875rem;
        }
    }

    @media (max-width: 360px) {
        .page-wrapper {
            padding: 0.375rem;
            padding-top: 4rem;
        }

        .header h1 {
            font-size: 1.25rem;
        }

        .subtitle {
            font-size: 0.8rem;
        }

        .error-content,
        .empty-content {
            padding: 0.75rem;
        }
    }
</style>
