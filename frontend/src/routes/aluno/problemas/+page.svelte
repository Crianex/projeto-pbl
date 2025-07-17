<script lang="ts">
    import { onMount } from "svelte";
    import Table from "$lib/components/Table.svelte";
    import type { Column } from "$lib/interfaces/column";
    import { api } from "$lib/utils/api";

    let problems: any[] = [];
    let loading = true;
    let error: string | null = null;

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
            render: (row: any) =>
                new Date(row.data_inicio).toLocaleDateString(),
        },
        {
            key: "data_fim",
            label: "Data de Término",
            sortable: true,
            render: (row: any) => new Date(row.data_fim).toLocaleDateString(),
        },
        {
            key: "media_geral",
            label: "Média Geral",
            sortable: true,
            render: (row: any) => row.media_geral.toFixed(2),
        },
        {
            key: "actions",
            label: "Ações",
            render: (row: any) => ({
                component: "a",
                props: {
                    href: `/aluno/problemas/${row.id_problema}`,
                    class: "btn-primary",
                    textContent: "Ver Detalhes",
                },
            }),
        },
    ];

    async function fetchProblems() {
        try {
            loading = true;
            problems = await api.get("/problemas/list");
        } catch (e: any) {
            error = e.message || "Erro ao carregar problemas";
        } finally {
            loading = false;
        }
    }

    onMount(fetchProblems);
</script>

<div class="container">
    <div class="header">
        <h1>Problemas</h1>
    </div>

    {#if loading}
        <div class="loading">Carregando problemas...</div>
    {:else if error}
        <div class="error">
            {error}
            <button on:click={fetchProblems}>Tentar novamente</button>
        </div>
    {:else if problems.length === 0}
        <div class="empty">Nenhum problema encontrado.</div>
    {:else}
        <Table rows={problems} {columns} />
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h1 {
        margin: 0;
        color: #1a1a1a;
    }

    .loading,
    .error,
    .empty {
        text-align: center;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
        color: #6c757d;
    }

    .error {
        color: #dc3545;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }

    .error button {
        padding: 0.5rem 1rem;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .error button:hover {
        background: #c82333;
    }

    :global(.btn-primary) {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        background: #0d6efd;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    :global(.btn-primary:hover) {
        background: #0b5ed7;
    }
</style>
