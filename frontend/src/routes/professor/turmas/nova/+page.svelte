<script lang="ts">
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";
    import { currentUser } from "$lib/utils/auth";
    import { TurmasService } from "$lib/services/turmas_service";

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

            // First create the turma using the service
            const turmaResponse = await TurmasService.create({
                nome_turma: nomeTurma,
                id_professor: $currentUser?.id!,
            });

            // Then add all students using the service
            for (const aluno of alunosMatriculados) {
                await TurmasService.addAluno(
                    turmaResponse.id_turma.toString(),
                    aluno.id_aluno,
                );
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

    <div class="header">
        <h1>Nova Turma</h1>
    </div>

    {#if error}
        <div class="error">
            <p>{error}</p>
            <Button variant="secondary" on:click={() => (error = null)}
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
                <Button
                    variant="primary"
                    type="submit"
                    loading={saving}
                    disabled={saving}
                >
                    {saving ? "Salvando..." : "Salvar"}
                </Button>
            </div>
        </form>
    {/if}

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAlunoSelected}
    exclude_turma_id={null}
/>

<style>
    .container {
        height: 100%;
        width: 100%;
        margin: 0 auto;
        padding: 2rem;
        margin-top: 2.5rem;
        box-sizing: border-box;
    }

    .header {
        margin-bottom: 1.2rem;
        margin-top: 0.5rem;
    }

    .header h1 {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0;
        text-align: left;
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

    .more-options {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.3rem;
        color: #dc3545;
        border-radius: 4px;
    }

    .more-options:hover {
        background-color: #f8f9fa;
    }

    .actions {
        display: flex;
        gap: 0.7rem;
        justify-content: flex-end;
        margin-top: 1.2rem;
    }

    .error {
        text-align: center;
        padding: 1.2rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        color: #dc3545;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
            margin-top: 3rem;
        }
        .header {
            margin-top: 0.2rem;
            margin-bottom: 0.7rem;
        }
        .header h1 {
            font-size: 1.05rem;
            text-align: center;
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
</style>
