<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";

    const turmaId = $page.params.id;

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let alunosMatriculados: Array<{
        id_aluno: number;
        nome_completo: string;
        email: string;
    }> = [];
    let loading = true;
    let saving = false;
    let error: string | null = null;
    let searchDialogOpen = false;

    async function fetchTurma() {
        try {
            loading = true;
            error = null;
            const data = await api.get(`/turmas/get?id=${turmaId}`);
            turma = {
                nome_turma: data.nome_turma,
                id_professor: data.id_professor,
            };
            // Extract alunos from the nested structure
            alunosMatriculados =
                data.alunos?.map((item: any) => item.alunos) || [];
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch turma";
            console.error("Error fetching turma:", err);
        } finally {
            loading = false;
        }
    }

    async function handleSubmit() {
        try {
            saving = true;
            error = null;

            // Update turma basic info
            await api.put(`/turmas/update?id=${turmaId}`, turma);

            // Get current enrolled students to compare
            const currentData = await api.get(`/turmas/get?id=${turmaId}`);
            const currentAlunos =
                currentData.alunos?.map((item: any) => item.alunos.id_aluno) ||
                [];

            // Remove students that are no longer in the list
            for (const alunoId of currentAlunos) {
                if (!alunosMatriculados.some((a) => a.id_aluno === alunoId)) {
                    await api.delete(
                        `/turmas/remove-aluno?id_turma=${turmaId}&id_aluno=${alunoId}`,
                    );
                }
            }

            // Add new students
            for (const aluno of alunosMatriculados) {
                if (!currentAlunos.includes(aluno.id_aluno)) {
                    await api.post("/turmas/add-aluno", {
                        id_turma: turmaId,
                        id_aluno: aluno.id_aluno,
                    });
                }
            }

            goto("/professor/turmas");
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to update turma";
            console.error("Error updating turma:", err);
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

    onMount(fetchTurma);
</script>

<div class="container">
    <div class="header">
        <h1>Editar Turma</h1>
    </div>

    {#if loading}
        <div class="loading">Carregando turma...</div>
    {:else if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={fetchTurma}
                >Tentar novamente</Button
            >
        </div>
    {:else}
        <form on:submit|preventDefault={handleSubmit} class="form">
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

                <Button
                    variant="secondary"
                    type="button"
                    on:click={handleAddAluno}
                >
                    + Adicionar aluno
                </Button>
            </div>

            <div class="actions">
                <Button
                    variant="secondary"
                    on:click={() => goto("/professor/turmas")}
                    disabled={saving}
                >
                    Cancelar
                </Button>
                <Button variant="primary" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                </Button>
            </div>
        </form>
    {/if}
</div>

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAlunoSelected}
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

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }

    .error {
        color: #dc3545;
    }

    .error button {
        margin-top: 1rem;
    }
</style>
