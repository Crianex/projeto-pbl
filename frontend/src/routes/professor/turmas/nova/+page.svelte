<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import Input from "$lib/components/Input.svelte";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import type { AlunoModel } from "$lib/interfaces/interfaces";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let alunosMatriculados: AlunoModel[] = [];
    let loading = false;
    let error: string | null = null;
    let searchDialogOpen = false;
    let changesSummaryOpen = false;

    onMount(() => {
        // Initialize with current user as professor
        turma.id_professor = "1"; // This should be the current user's ID
    });

    async function handleSubmit() {
        if (!turma.nome_turma.trim()) {
            error = "Nome da turma é obrigatório";
            return;
        }

        try {
            loading = true;
            error = null;

            const payload = {
                nome_turma: turma.nome_turma,
                id_professor: turma.id_professor,
                alunos: alunosMatriculados.map((aluno) => aluno.id),
            };

            const response = await api.post("/turmas/create", payload);
            logger.info("Turma created successfully", response);

            // Show success message and redirect
            alert("Turma criada com sucesso!");
            goto("/professor/turmas");
        } catch (err: any) {
            error = err.message || "Erro ao criar turma";
            logger.error("Error creating turma:", err);
        } finally {
            loading = false;
        }
    }

    function handleAddAluno(aluno: AlunoModel) {
        if (!alunosMatriculados.find((a) => a.id === aluno.id)) {
            alunosMatriculados = [...alunosMatriculados, aluno];
        }
        searchDialogOpen = false;
    }

    function handleRemoveAluno(alunoId: number) {
        alunosMatriculados = alunosMatriculados.filter((a) => a.id !== alunoId);
    }

    function getChangesSummary() {
        return {
            nameChanged: turma.nome_turma !== "",
            alunosChanged: alunosMatriculados.length > 0,
        };
    }
</script>

<PageHeader
    backUrl="/professor/turmas"
    backText="Voltar para turmas"
    title="Nova Turma"
/>

<div class="container">
    <form on:submit|preventDefault={handleSubmit} class="form">
        {#if error}
            <div class="error-message">{error}</div>
        {/if}

        <div class="form-group">
            <label for="nome_turma">Nome da Turma</label>
            <input
                type="text"
                id="nome_turma"
                bind:value={turma.nome_turma}
                required
                placeholder="Digite o nome da turma"
            />
        </div>

        <div class="alunos-section">
            <h2>Alunos matriculados</h2>

            {#if alunosMatriculados.length > 0}
                <div class="alunos-list">
                    {#each alunosMatriculados as aluno}
                        <div class="aluno-item">
                            <div class="aluno-info">
                                <img
                                    src={aluno.link_avatar ||
                                        "/avatars/default.png"}
                                    alt={aluno.nome_completo}
                                    class="avatar"
                                />
                                <div class="aluno-details">
                                    <span class="nome"
                                        >{aluno.nome_completo}</span
                                    >
                                    <span class="email">{aluno.email}</span>
                                </div>
                            </div>
                            <Button
                                variant="danger"
                                size="icon"
                                type="button"
                                on:click={() => handleRemoveAluno(aluno.id)}
                                title="Remover aluno"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </Button>
                        </div>
                    {/each}
                </div>
            {/if}

            <Button
                variant="secondary"
                type="button"
                on:click={() => (searchDialogOpen = true)}
            >
                + Adicionar aluno
            </Button>
        </div>

        <div class="actions">
            <Button
                variant="secondary"
                on:click={() => goto("/professor/turmas")}
                disabled={loading}
            >
                Cancelar
            </Button>
            <Button
                variant="primary"
                type="submit"
                {loading}
                disabled={loading}
            >
                {loading ? "Criando..." : "Criar Turma"}
            </Button>
        </div>
    </form>
</div>

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAddAluno}
    excludeAlunos={alunosMatriculados}
/>

<Dialog open={changesSummaryOpen} on:close={() => (changesSummaryOpen = false)}>
    <svelte:fragment slot="header">
        <h2>Resumo das alterações</h2>
    </svelte:fragment>
    <div class="changes-summary-content">
        {#if error}
            <div class="error-message">{error}</div>
        {/if}

        {#if getChangesSummary().nameChanged}
            <div class="change-item">
                <span class="change-title">Nome da turma</span>
                <p class="change-detail">{turma.nome_turma}</p>
            </div>
        {/if}

        {#if getChangesSummary().alunosChanged}
            <div class="change-item">
                <span class="change-title">Alunos matriculados</span>
                <ul class="change-list">
                    {#each alunosMatriculados as aluno}
                        <li>{aluno.nome_completo}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        <div class="dialog-actions">
            <Button
                variant="secondary"
                on:click={() => (changesSummaryOpen = false)}
            >
                Cancelar
            </Button>
            <Button
                variant="primary"
                on:click={handleSubmit}
                disabled={loading}
            >
                {loading ? "Criando..." : "Criar Turma"}
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .form {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        border: 1px solid #e9ecef;
        max-width: 480px;
        margin: 0 auto;
        box-sizing: border-box;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.4rem;
        font-weight: 500;
        color: #212529;
    }

    .form-group input {
        width: 100%;
        padding: 0.65rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 1rem;
    }

    .form-group input:focus {
        outline: none;
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
    }

    .alunos-section {
        margin-bottom: 1.5rem;
    }

    .alunos-section h2 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.7rem;
    }

    .alunos-list {
        margin-bottom: 0.7rem;
    }

    .aluno-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0.2rem;
        border-bottom: 1px solid #e9ecef;
        font-size: 0.97rem;
    }

    .aluno-item:last-child {
        border-bottom: none;
    }

    .aluno-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .aluno-details {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .aluno-details .nome {
        font-weight: 500;
    }

    .aluno-details .email {
        font-size: 0.87rem;
        color: #6c757d;
    }

    .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .error-message {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    .changes-summary-content {
        padding: 1rem;
    }

    .change-item {
        margin-bottom: 1.5rem;
    }

    .change-title {
        font-weight: 500;
        color: #1a1a1a;
        display: block;
        margin-bottom: 0.5rem;
    }

    .change-detail {
        color: #4a5568;
        font-size: 0.875rem;
        margin: 0.25rem 0;
    }

    .change-list {
        list-style: none;
        padding: 0;
        margin: 0.25rem 0;
    }

    .change-list li {
        color: #4a5568;
        font-size: 0.875rem;
        padding: 0.25rem 0;
    }

    .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.7rem;
        }
        .form {
            padding: 0.7rem 0.3rem;
            border-radius: 8px;
            max-width: 100%;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group input {
            padding: 0.45rem;
            font-size: 0.97rem;
        }
        .alunos-section {
            margin-bottom: 1rem;
        }
        .alunos-section h2 {
            font-size: 0.97rem;
            margin-bottom: 0.4rem;
        }
        .alunos-list {
            margin-bottom: 0.4rem;
        }
        .aluno-item {
            padding: 0.4rem 0.1rem;
            font-size: 0.93rem;
        }
        .aluno-info {
            gap: 0.3rem;
        }
        .avatar {
            width: 24px;
            height: 24px;
        }
        .actions {
            gap: 0.3rem;
            margin-top: 0.7rem;
            flex-direction: column;
            align-items: stretch;
        }
        .actions button,
        .form :global(button) {
            width: 100%;
            min-width: 0;
            padding: 0.5rem 0.2rem;
            font-size: 0.97rem;
            box-sizing: border-box;
        }
    }

    @media (max-width: 480px) {
        .container {
            padding: 0.1rem;
        }
        .form {
            padding: 0.2rem 0.05rem;
            border-radius: 6px;
        }
        .form-group {
            margin-bottom: 0.5rem;
        }
        .form-group input {
            padding: 0.2rem;
            font-size: 0.91rem;
        }
        .alunos-section {
            margin-bottom: 0.5rem;
        }
        .alunos-section h2 {
            font-size: 0.91rem;
            margin-bottom: 0.2rem;
        }
        .alunos-list {
            margin-bottom: 0.2rem;
        }
        .aluno-item {
            padding: 0.2rem 0.01rem;
            font-size: 0.91rem;
        }
        .aluno-info {
            gap: 0.1rem;
        }
        .avatar {
            width: 18px;
            height: 18px;
        }
        .actions {
            gap: 0.1rem;
            margin-top: 0.3rem;
        }
        .actions button,
        .form :global(button) {
            padding: 0.2rem 0.01rem;
            font-size: 0.91rem;
        }
    }
</style>
