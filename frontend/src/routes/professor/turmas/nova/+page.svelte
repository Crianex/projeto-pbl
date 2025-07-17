<script lang="ts">
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";

    let nomeTurma = "";
    let alunosMatriculados: Array<{
        id_aluno: number;
        nome_completo: string;
        email: string;
    }> = [];
    let saving = false;
    let error: string | null = null;
    let searchDialogOpen = false;

    async function handleSubmit() {
        if (!nomeTurma.trim()) {
            error = "O nome da turma é obrigatório";
            return;
        }

        try {
            saving = true;
            error = null;

            // First create the turma
            const turmaResponse = await api.post("/turmas/create", {
                nome_turma: nomeTurma,
                id_professor: 1, // TODO: Get this from the logged in user
            });

            // Then add all students
            for (const aluno of alunosMatriculados) {
                await api.post("/turmas/add-aluno", {
                    id_turma: turmaResponse.id_turma,
                    id_aluno: aluno.id_aluno,
                });
            }

            goto("/professor/turmas");
        } catch (err) {
            error = err instanceof Error ? err.message : "Erro ao criar turma";
            console.error("Error creating turma:", err);
        } finally {
            saving = false;
        }
    }

    function handleAddAluno() {
        searchDialogOpen = true;
    }

    function handleAlunoSelected(
        event: CustomEvent<{
            id_aluno: number;
            nome_completo: string;
            email: string;
        }>,
    ) {
        const aluno = event.detail;
        // Check if student is already added
        if (!alunosMatriculados.some((a) => a.id_aluno === aluno.id_aluno)) {
            alunosMatriculados = [...alunosMatriculados, aluno];
        }
    }

    function handleRemoveAluno(alunoId: number) {
        alunosMatriculados = alunosMatriculados.filter(
            (a) => a.id_aluno !== alunoId,
        );
    }
</script>

<div class="container">
    <div class="header">
        <h1>Nova Turma</h1>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="form">
        <div class="form-group">
            <label for="nome_turma">Nome da turma</label>
            <input
                type="text"
                id="nome_turma"
                bind:value={nomeTurma}
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
                                    src="https://via.placeholder.com/32"
                                    alt="Avatar"
                                    class="avatar"
                                />
                                <div class="aluno-details">
                                    <span class="nome"
                                        >{aluno.nome_completo}</span
                                    >
                                    <span class="email">{aluno.email}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="more-options"
                                on:click={() =>
                                    handleRemoveAluno(aluno.id_aluno)}
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
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}

            <Button variant="secondary" type="button" on:click={handleAddAluno}>
                + Adicionar aluno
            </Button>
        </div>

        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        <div class="actions">
            <Button variant="primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar turma"}
            </Button>
        </div>
    </form>
</div>

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAlunoSelected}
    exclude_turma_id={null}
/>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        margin-bottom: 2rem;
    }

    .header h1 {
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
        margin-bottom: 2rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #212529;
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem;
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
        margin-bottom: 2rem;
    }

    .alunos-section h2 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }

    .alunos-list {
        margin-bottom: 1rem;
    }

    .aluno-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #e9ecef;
    }

    .aluno-item:last-child {
        border-bottom: none;
    }

    .aluno-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .aluno-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .aluno-details .nome {
        font-weight: 500;
    }

    .aluno-details .email {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
    }

    .more-options {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #dc3545;
        border-radius: 4px;
    }

    .more-options:hover {
        background-color: #f8f9fa;
    }

    .error-message {
        color: #dc3545;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background-color: #f8d7da;
        border: 1px solid #f5c2c7;
        border-radius: 4px;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 2rem;
    }
</style>
