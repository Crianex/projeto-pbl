<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import Button from "$lib/components/Button.svelte";
    import { api } from "$lib/utils/api";
    import { goto } from "$app/navigation";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import { TurmasService } from "$lib/services/turmas_service";

    const turmaId = $page.params.id;

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let originalTurma = {
        nome_turma: "",
        id_professor: "",
    };
    let alunosMatriculados: Array<{
        id_aluno: number;
        nome_completo: string;
        email: string;
    }> = [];
    let originalAlunosMatriculados: Array<{
        id_aluno: number;
        nome_completo: string;
        email: string;
    }> = [];
    let loading = true;
    let saving = false;
    let error: string | null = null;
    let searchDialogOpen = false;
    let changesSummaryOpen = false;
    let hasUnsavedChanges = false;

    async function fetchTurma() {
        try {
            loading = true;
            error = null;
            // Use the caching service instead of direct API call
            const data = await TurmasService.getById(turmaId);
            turma = {
                nome_turma: data.nome_turma || "",
                id_professor: data.id_professor?.toString() || "",
            };
            originalTurma = { ...turma };
            // Extract alunos from the nested structure
            alunosMatriculados = data.alunos?.map((item: any) => item) || [];
            originalAlunosMatriculados = [...alunosMatriculados];
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch turma";
            console.error("Error fetching turma:", err);
        } finally {
            loading = false;
        }
    }

    function getChangesSummary() {
        const changes = {
            nameChanged: turma.nome_turma !== originalTurma.nome_turma,
            removedAlunos: originalAlunosMatriculados.filter(
                (original) =>
                    !alunosMatriculados.some(
                        (current) => current.id_aluno === original.id_aluno,
                    ),
            ),
            addedAlunos: alunosMatriculados.filter(
                (current) =>
                    !originalAlunosMatriculados.some(
                        (original) => original.id_aluno === current.id_aluno,
                    ),
            ),
        };
        return changes;
    }

    async function handleSubmit() {
        try {
            saving = true;
            error = null;

            // Update turma basic info
            await api.put(`/turmas/update?id_turma=${turmaId}`, turma);

            // Invalidate cache after update
            TurmasService.invalidateCache(turmaId);

            // Get current enrolled students to compare
            const currentData = await TurmasService.getById(turmaId, true); // Force refresh
            const currentAlunos =
                currentData.alunos?.map((item: any) => item.id_aluno) || [];

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

            hasUnsavedChanges = false;
            changesSummaryOpen = true;
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to update turma";
            console.error("Error updating turma:", err);
        } finally {
            saving = false;
        }
    }

    async function handleUndo() {
        try {
            saving = true;
            error = null;

            // Restore original values
            turma = { ...originalTurma };
            alunosMatriculados = [...originalAlunosMatriculados];

            // Update turma basic info
            await api.put(`/turmas/update?id_turma=${turmaId}`, turma);

            // Get current enrolled students to compare
            const currentData = await api.get(
                `/turmas/get?id_turma=${turmaId}`,
            );
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

            changesSummaryOpen = false;
            goto("/professor/turmas");
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to undo changes";
            console.error("Error undoing changes:", err);
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
            hasUnsavedChanges = true;
        }
    }

    function handleRemoveAluno(alunoId: number) {
        alunosMatriculados = alunosMatriculados.filter(
            (a) => a.id_aluno !== alunoId,
        );
        hasUnsavedChanges = true;
    }

    $: {
        if (turma.nome_turma !== originalTurma.nome_turma) {
            hasUnsavedChanges = true;
        }
    }

    async function handleUndoNameChange() {
        try {
            saving = true;
            error = null;
            turma.nome_turma = originalTurma.nome_turma;
            await api.put(`/turmas/update?id_turma=${turmaId}`, turma);

            const changes = getChangesSummary();
            if (
                !changes.nameChanged &&
                changes.removedAlunos.length === 0 &&
                changes.addedAlunos.length === 0
            ) {
                changesSummaryOpen = false;
                goto("/professor/turmas");
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to undo name change";
            console.error("Error undoing name change:", err);
        } finally {
            saving = false;
        }
    }

    async function handleUndoRemoveAluno(
        aluno: (typeof originalAlunosMatriculados)[0],
    ) {
        try {
            saving = true;
            error = null;

            await api.post("/turmas/add-aluno", {
                id_turma: turmaId,
                id_aluno: aluno.id_aluno,
            });

            alunosMatriculados = [...alunosMatriculados, aluno];

            const changes = getChangesSummary();
            if (
                !changes.nameChanged &&
                changes.removedAlunos.length === 0 &&
                changes.addedAlunos.length === 0
            ) {
                changesSummaryOpen = false;
                goto("/professor/turmas");
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to undo aluno removal";
            console.error("Error undoing aluno removal:", err);
        } finally {
            saving = false;
        }
    }

    async function handleUndoAddAluno(aluno: (typeof alunosMatriculados)[0]) {
        try {
            saving = true;
            error = null;

            await api.delete(
                `/turmas/remove-aluno?id_turma=${turmaId}&id_aluno=${aluno.id_aluno}`,
            );

            alunosMatriculados = alunosMatriculados.filter(
                (a) => a.id_aluno !== aluno.id_aluno,
            );

            const changes = getChangesSummary();
            if (
                !changes.nameChanged &&
                changes.removedAlunos.length === 0 &&
                changes.addedAlunos.length === 0
            ) {
                changesSummaryOpen = false;
                goto("/professor/turmas");
            }
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to undo aluno addition";
            console.error("Error undoing aluno addition:", err);
        } finally {
            saving = false;
        }
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
                                <Button
                                    variant="danger"
                                    size="icon"
                                    type="button"
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
                                </Button>
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
                {#if hasUnsavedChanges}
                    <Button
                        variant="primary"
                        type="submit"
                        loading={saving}
                        disabled={saving}
                    >
                        {saving ? "Salvando..." : "Salvar"}
                    </Button>
                {/if}
            </div>
        </form>
    {/if}
</div>

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAlunoSelected}
    exclude_turma_id={turmaId}
/>

<Dialog open={changesSummaryOpen} on:close={() => goto("/professor/turmas")}>
    <svelte:fragment slot="header">
        <h2>Alterações realizadas</h2>
    </svelte:fragment>
    <div class="changes-summary-content">
        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        {#if getChangesSummary().nameChanged}
            <div class="change-item">
                <div class="change-header">
                    <span class="change-title">Nome da turma alterado</span>
                    <Button
                        variant="secondary"
                        on:click={handleUndoNameChange}
                        disabled={saving}
                        loading={saving}
                    >
                        Desfazer
                    </Button>
                </div>
                <p class="change-detail">
                    De: {originalTurma.nome_turma}<br />
                    Para: {turma.nome_turma}
                </p>
            </div>
        {/if}

        {#if getChangesSummary().removedAlunos.length > 0}
            <div class="change-item">
                <span class="change-title">Alunos removidos</span>
                <ul class="change-list">
                    {#each getChangesSummary().removedAlunos as aluno}
                        <li>
                            <div class="change-list-item">
                                <span>{aluno.nome_completo}</span>
                                <Button
                                    variant="secondary"
                                    on:click={() =>
                                        handleUndoRemoveAluno(aluno)}
                                    disabled={saving}
                                    loading={saving}
                                >
                                    Desfazer
                                </Button>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

        {#if getChangesSummary().addedAlunos.length > 0}
            <div class="change-item">
                <span class="change-title">Alunos adicionados</span>
                <ul class="change-list">
                    {#each getChangesSummary().addedAlunos as aluno}
                        <li>
                            <div class="change-list-item">
                                <span>{aluno.nome_completo}</span>
                                <Button
                                    variant="secondary"
                                    on:click={() => handleUndoAddAluno(aluno)}
                                    disabled={saving}
                                    loading={saving}
                                >
                                    Desfazer
                                </Button>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

        <div class="dialog-actions">
            <Button
                variant="secondary"
                on:click={() => goto("/professor/turmas")}
            >
                Voltar para turmas
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .container {
        height: 100%;
        width: 100%;
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

    .delete-confirm-content {
        padding: 1rem;
    }

    .delete-confirm-content p {
        margin-bottom: 1rem;
    }

    .delete-confirm-content .warning {
        color: #dc3545;
        font-size: 0.875rem;
    }

    .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
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

    .change-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .change-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .error-message {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }

    :global(.change-list-item .button),
    :global(.change-header .button) {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
    }
</style>
