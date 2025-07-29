<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import { api } from "$lib/utils/api";
    import SearchAlunoDialog from "../SearchAlunoDialog.svelte";
    import Dialog from "$lib/components/Dialog.svelte";
    import { TurmasService } from "$lib/services/turmas_service";
    import type { AlunoModel } from "$lib/interfaces/interfaces";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import Input from "$lib/components/Input.svelte";
    import TrashIcon from "$lib/components/TrashIcon.svelte";
    import { currentUser } from "$lib/utils/auth";

    let turma = {
        nome_turma: "",
        id_professor: "",
    };
    let alunosMatriculados: AlunoModel[] = [];
    let loading = false;
    let saving = false;
    let error: string | null = null;
    let searchDialogOpen = false;
    let changesSummaryOpen = false;
    let hasUnsavedChanges = false;

    onMount(() => {
        // Initialize with current user as professor
        turma.id_professor = "1"; // This should be the current user's ID
    });

    function handleSave() {
        saveChanges();
    }

    function handleCancel() {
        // Reset to original values
        turma = {
            nome_turma: "",
            id_professor: "1",
        };
        alunosMatriculados = [];
        hasUnsavedChanges = false;
        goto("/professor/turmas");
    }

    async function saveChanges() {
        if (!turma.nome_turma.trim()) {
            error = "Nome da turma é obrigatório";
            return;
        }

        try {
            saving = true;
            error = null;

            const payload = {
                nome_turma: turma.nome_turma,
                id_professor: $currentUser?.id!,
                alunos: alunosMatriculados.map((aluno) => aluno.id),
            };

            await TurmasService.create(payload);

            // Show success message and redirect
            alert("Turma criada com sucesso!");
            goto("/professor/turmas");
        } catch (err: any) {
            error = err.message || "Erro ao criar turma";
            console.error("Error creating turma:", err);
        } finally {
            saving = false;
        }
    }

    function handleNameChange(event: Event) {
        const target = event.target as HTMLInputElement;
        turma.nome_turma = target.value;
        checkForChanges();
    }

    function handleAddAluno(event: CustomEvent<AlunoModel[]>) {
        const selectedAlunos = event.detail;
        for (const aluno of selectedAlunos) {
            if (!alunosMatriculados.find((a) => a.id === aluno.id)) {
                alunosMatriculados = [...alunosMatriculados, aluno];
            }
        }
        checkForChanges();
        searchDialogOpen = false;
    }

    function handleRemoveAluno(alunoId: number) {
        alunosMatriculados = alunosMatriculados.filter((a) => a.id !== alunoId);
        checkForChanges();
    }

    function checkForChanges() {
        const nameChanged = turma.nome_turma.trim() !== "";
        const alunosChanged = alunosMatriculados.length > 0;

        hasUnsavedChanges = nameChanged || alunosChanged;
    }

    function getChangesSummary() {
        return {
            nameChanged: turma.nome_turma.trim() !== "",
            alunosChanged: alunosMatriculados.length > 0,
        };
    }

    function handleUndoNameChange() {
        turma.nome_turma = "";
        checkForChanges();
    }

    function handleUndoAlunosChange() {
        alunosMatriculados = [];
        checkForChanges();
    }
</script>

<PageHeader
    backUrl="/professor/turmas"
    backText="Voltar para turmas"
    title="Nova Turma"
/>

<div class="container">
    {#if loading}
        <div class="loading">Carregando...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else}
        <form on:submit|preventDefault={handleSave} class="form">
            {#if error}
                <div class="error-message">{error}</div>
            {/if}

            <div class="form-group">
                <label for="nome_turma">Nome da Turma</label>
                <Input
                    type="text"
                    id="nome_turma"
                    bind:value={turma.nome_turma}
                    on:input={handleNameChange}
                    required
                    placeholder="Digite o nome da turma"
                />
            </div>

            <div class="alunos-section">
                <h2>Alunos Matriculados</h2>
                <div class="alunos-list">
                    {#each alunosMatriculados as aluno}
                        <div class="aluno-item">
                            <div class="aluno-info">
                                <img
                                    src={aluno.link_avatar ||
                                        "/images/default_avatar.png"}
                                    alt={aluno.nome_completo}
                                    class="avatar"
                                />
                                <div class="aluno-details">
                                    <div class="nome">
                                        {aluno.nome_completo}
                                    </div>
                                    <div class="email">{aluno.email}</div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="danger"
                                size="icon"
                                class="remove-button"
                                on:click={() => handleRemoveAluno(aluno.id)}
                                title="Remover aluno"
                            >
                                <TrashIcon size="sm" />
                            </Button>
                        </div>
                    {/each}
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    on:click={() => (searchDialogOpen = true)}
                >
                    + Adicionar Aluno
                </Button>
            </div>

            <div class="actions">
                <Button
                    type="button"
                    variant="secondary"
                    on:click={handleCancel}
                >
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Criando..." : "Criar Turma"}
                </Button>
            </div>
        </form>
    {/if}
</div>

<SearchAlunoDialog
    open={searchDialogOpen}
    on:close={() => (searchDialogOpen = false)}
    on:select={handleAddAluno}
    exclude_aluno_ids={alunosMatriculados.map((aluno) => aluno.id)}
/>

<Dialog open={changesSummaryOpen} on:close={() => (changesSummaryOpen = false)}>
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
                    <span class="change-title">Nome da turma</span>
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
                    Nome: {turma.nome_turma}
                </p>
            </div>
        {/if}

        {#if getChangesSummary().alunosChanged}
            <div class="change-item">
                <div class="change-header">
                    <span class="change-title">Lista de alunos</span>
                    <Button
                        variant="secondary"
                        on:click={handleUndoAlunosChange}
                        disabled={saving}
                        loading={saving}
                    >
                        Desfazer
                    </Button>
                </div>
                <p class="change-detail">
                    Alunos adicionados: {alunosMatriculados.length}
                </p>
            </div>
        {/if}

        <div class="dialog-actions">
            <Button
                variant="secondary"
                on:click={() => (changesSummaryOpen = false)}
            >
                Cancelar
            </Button>
            <Button variant="primary" on:click={saveChanges} disabled={saving}>
                {saving ? "Criando..." : "Criar Turma"}
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .container {
        margin: 0 auto;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        font-size: 1.1rem;
    }

    .error {
        color: #dc3545;
    }

    .form {
        background: white;
        padding: 1rem;
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
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
        min-width: 0;
        overflow: hidden;
    }

    .aluno-item:last-child {
        border-bottom: none;
    }

    .aluno-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
        flex: 1;
    }

    .aluno-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
        flex: 1;
        padding-right: 0.3rem;
    }

    .aluno-details .nome {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .aluno-details .email {
        font-size: 0.875rem;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        aspect-ratio: 1;
        object-fit: cover;
    }

    .more-options {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        color: #6c757d;
    }

    .more-options:hover {
        background: #f8f9fa;
        color: #495057;
    }

    .dropdown {
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 120px;
    }

    .dropdown button {
        display: block;
        width: 100%;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        color: #212529;
    }

    .dropdown button:hover {
        background: #f8f9fa;
    }

    .dropdown button.danger {
        color: #dc3545;
    }

    .dropdown button.danger:hover {
        background: #f8d7da;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .actions button {
        flex: 1;
        min-width: 0;
    }

    .remove-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .button-text {
        display: inline;
    }

    .trash-icon {
        display: none;
    }

    @media (max-width: 768px) {
        .remove-button {
            padding: 0.5rem;
            min-width: 2.5rem;
            justify-content: center;
        }

        .button-text {
            display: none;
        }

        .trash-icon {
            display: block;
        }
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
