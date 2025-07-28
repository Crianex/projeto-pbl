<script lang="ts">
    import Button from "./Button.svelte";
    import type { TurmaModel } from "$lib/interfaces/interfaces";
    import { goto } from "$app/navigation";

    export let turma: TurmaModel;
    export let openDropdownId: number | null = null;
    export let onToggleDropdown: (event: MouseEvent, turmaId: number) => void;
    export let onOpenDeleteConfirm: (turma: TurmaModel) => void;
</script>

<div
    class="turma-item"
    on:click={() => goto(`/professor/turmas/${turma.id_turma}/problemas`)}
    role="button"
    tabindex="0"
    on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            goto(`/professor/turmas/${turma.id_turma}/problemas`);
        }
    }}
>
    <div class="turma-main-info">
        <span class="turma-nome">{turma.nome_turma}</span>
        <div class="turma-alunos-mobile">
            <span class="alunos-label">Alunos:</span>
            {#if turma.alunos && turma.alunos.length > 0}
                <ul class="alunos-list">
                    {#each turma.alunos as aluno}
                        <li class="aluno-nome">
                            {aluno.nome_completo}
                        </li>
                    {/each}
                </ul>
            {:else}
                <span class="alunos-empty">Nenhum aluno cadastrado</span>
            {/if}
        </div>
    </div>
    <div class="actions">
        <div class="dropdown">
            <Button
                variant="secondary"
                size="icon"
                on:click={(e) => onToggleDropdown(e, turma.id_turma)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                </svg>
            </Button>
            <div
                class="dropdown-content"
                class:show={openDropdownId === turma.id_turma}
            >
                <Button
                    variant="secondary"
                    class="dropdown-item"
                    on:click={(e) => {
                        e.stopPropagation();
                        goto(`/professor/turmas/${turma.id_turma}`);
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    Editar
                </Button>
                <Button
                    variant="danger"
                    class="dropdown-item delete"
                    on:click={(e) => {
                        e.stopPropagation();
                        onOpenDeleteConfirm(turma);
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                            fill="currentColor"
                        />
                    </svg>
                    Excluir turma
                </Button>
            </div>
        </div>
    </div>
</div>

<style>
    .turma-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1rem;
        border-bottom: 1px solid #e9ecef;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-radius: 12px;
        margin-bottom: 0.3rem;
    }

    .turma-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }

    .turma-item:hover {
        background-color: #f8f9fa;
    }

    .turma-main-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex: 1;
    }

    .turma-nome {
        font-weight: 600;
        font-size: 1.08rem;
    }

    .turma-alunos-mobile {
        display: none;
        font-size: 0.98rem;
        margin-top: 0.2rem;
        color: #444;
    }

    .alunos-label {
        font-weight: 500;
        margin-right: 0.3rem;
    }

    .alunos-list {
        margin: 0.2rem 0 0 0.7rem;
        padding: 0;
        list-style: disc inside;
    }

    .aluno-nome {
        font-size: 0.97rem;
        margin-bottom: 0.1rem;
    }

    .alunos-empty {
        color: #888;
        font-size: 0.97rem;
        margin-left: 0.5rem;
    }

    .actions {
        display: flex;
        gap: 0.3rem;
        align-items: center;
    }

    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        top: 100%;
        background-color: white;
        min-width: max-content;
        width: max-content;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        z-index: 1;
        margin-top: 0.25rem;
        flex-direction: column;
        gap: 0.1rem;
    }

    .dropdown-content.show {
        display: flex;
    }

    .dropdown-item {
        width: 100%;
        justify-content: flex-start;
        text-align: left;
    }

    @media (max-width: 768px) {
        .turma-item {
            padding: 0.8rem 0.6rem;
            font-size: 0.97rem;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .actions {
            gap: 0.1rem;
        }

        .turma-alunos-mobile {
            display: block;
        }
    }

    @media (max-width: 480px) {
        .turma-item {
            padding: 0.6rem 0.4rem;
            font-size: 0.91rem;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .actions {
            gap: 0.05rem;
        }
    }
</style>
