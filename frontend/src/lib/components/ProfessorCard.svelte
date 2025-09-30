<script lang="ts">
    import Button from "./Button.svelte";
    import type { ProfessorModel } from "$lib/interfaces/interfaces";

    export let professor: ProfessorModel;
    export let openDropdownId: number | null = null;
    export let onToggleDropdown: (
        event: MouseEvent,
        professorId: number,
    ) => void;
    export let onOpenDeleteConfirm: (professor: ProfessorModel) => void;
</script>

<div class="professor-item">
    <div class="professor-main-info">
        <div class="professor-avatar">
            {#if professor.link_avatar}
                <img
                    src={professor.link_avatar}
                    alt="Avatar de {professor.nome_completo}"
                    class="avatar-image"
                />
            {:else}
                <div class="avatar-placeholder">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
            {/if}
        </div>
        <div class="professor-details">
            <span class="professor-nome">{professor.nome_completo}</span>
            <span class="professor-email">{professor.email}</span>
        </div>
    </div>

    <div class="actions">
        <div class="dropdown">
            <Button
                variant="secondary"
                size="icon"
                on:click={(e) => onToggleDropdown(e, professor.id)}
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
                class:show={openDropdownId === professor.id}
            >
                <button
                    class="dropdown-item delete"
                    on:click={(e) => {
                        e.stopPropagation();
                        onOpenDeleteConfirm(professor);
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="3,6 5,6 21,6" />
                        <path
                            d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"
                        />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Excluir professor
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .professor-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 1px solid var(--color-border-light);
        border-radius: 0.5rem;
        background-color: var(--color-bg-white);
        box-shadow: var(--color-shadow-light);
        transition: all 0.2s ease;
        cursor: default;
        margin-bottom: 0.5rem;
    }

    .professor-item:hover {
        box-shadow: var(--color-shadow-main);
        border-color: var(--color-border-main);
    }

    .professor-main-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        min-width: 0;
    }

    .professor-avatar {
        flex-shrink: 0;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid var(--color-nature-border-light);
    }

    .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-placeholder {
        width: 100%;
        height: 100%;
        background-color: var(--color-nature-background-light);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-nature-main);
    }

    .professor-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
    }

    .professor-nome {
        font-weight: 600;
        font-size: 1.1rem;
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .professor-email {
        font-size: 0.9rem;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .dropdown {
        position: relative;
    }

    .dropdown-content {
        position: absolute;
        right: 0;
        top: calc(100% + 0.5rem);
        background-color: var(--color-bg-white);
        border: 1px solid var(--color-border-light);
        border-radius: 0.375rem;
        box-shadow: var(--color-shadow-main);
        min-width: 12rem;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-0.5rem);
        transition: all 0.2s ease;
    }

    .dropdown-content.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        text-align: left;
        font-size: 0.875rem;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .dropdown-item:hover {
        background-color: var(--color-bg-light);
    }

    .dropdown-item.delete {
        color: var(--color-error-main);
    }

    .dropdown-item.delete:hover {
        background-color: var(--color-error-background);
    }

    .dropdown-item svg {
        flex-shrink: 0;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .professor-item {
            padding: 0.75rem;
            margin-bottom: 0.25rem;
        }

        .professor-main-info {
            gap: 0.75rem;
        }

        .professor-avatar {
            width: 2.5rem;
            height: 2.5rem;
        }

        .professor-nome {
            font-size: 1rem;
        }

        .professor-email {
            font-size: 0.85rem;
        }
    }

    @media (max-width: 480px) {
        .professor-item {
            padding: 0.5rem;
        }

        .professor-main-info {
            gap: 0.5rem;
        }

        .professor-avatar {
            width: 2rem;
            height: 2rem;
        }

        .professor-nome {
            font-size: 0.9rem;
        }

        .professor-email {
            font-size: 0.8rem;
        }
    }
</style>
