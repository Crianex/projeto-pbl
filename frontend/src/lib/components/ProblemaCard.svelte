<script lang="ts">
    import Button from "./Button.svelte";
    import DeleteButton from "./DeleteButton.svelte";
    import type { ProblemaModel } from "$lib/interfaces/interfaces";
    import { goto } from "$app/navigation";
    import { DateUtils } from "$lib/utils/utils";
    import { formatToDateTime } from "brazilian-values";

    export let problema: ProblemaModel;
    export let turmaId: string;
    export let onEditProblema: (problema: ProblemaModel) => void;
    export let onOpenDeleteConfirm: (problema: ProblemaModel) => void;
</script>

<div class="problema-item">
    <div class="problema-info">
        <h3>{problema.nome_problema}</h3>
        <div class="problema-tags-status">
            <div class="problema-tag-status-group">
                <span class="problema-tag-label">Período:</span>
                {#each Object.entries(problema.data_e_hora_criterios_e_arquivos) as [tag, dateObj]}
                    {#if dateObj.data_e_hora_inicio && dateObj.data_e_hora_fim}
                        <span
                            class="tag-status {DateUtils.isNowWithinTagDateRange(
                                problema,
                                tag,
                            )
                                ? 'tag-green'
                                : 'tag-red'}"
                        >
                            {tag}:<br />De {formatToDateTime(
                                dateObj.data_e_hora_inicio,
                            )} à {formatToDateTime(dateObj.data_e_hora_fim)}
                        </span>
                    {/if}
                {/each}
            </div>
        </div>
    </div>
    <div class="actions">
        <Button
            variant="secondary"
            on:click={() =>
                goto(
                    `/professor/turmas/${turmaId}/problemas/${problema.id_problema}`,
                )}
        >
            Ver detalhes
        </Button>
        <Button
            variant="secondary"
            size="icon"
            class="edit-button"
            on:click={() => onEditProblema(problema)}
            title="Editar problema"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </Button>
        <DeleteButton
            size="icon"
            title="Confirmar Exclusão"
            confirmMessage="Tem certeza que deseja excluir este problema?"
            on:delete={() => onOpenDeleteConfirm(problema)}
        />
    </div>
</div>

<style>
    .problema-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        padding: 1rem 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 0.3rem;
    }

    .problema-item:last-child {
        margin-bottom: 0;
    }

    .problema-info h3 {
        font-size: 1.08rem;
        font-weight: 600;
        margin: 0 0 0.3rem 0;
    }

    .problema-details {
        display: flex;
        gap: 1rem;
        color: #6c757d;
        font-size: 0.93rem;
    }

    .actions {
        display: flex;
        gap: 0.3rem;
        align-items: center;
    }

    .edit-button {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #6c757d;
        border-radius: 4px;
    }

    .edit-button:hover {
        background-color: #f8f9fa;
        color: #0d6efd;
    }



    .problema-tags-status {
        margin: 0.2rem 0 0.5rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .problema-tag-status-group {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: flex-start;
        margin-bottom: 0.1rem;
    }

    .problema-tag-label {
        font-weight: 500;
        margin-right: 0.3rem;
        color: #444;
        font-size: 0.97rem;
    }

    .tag-status {
        display: block;
        padding: 0.15rem 0.5rem;
        border-radius: 8px;
        font-size: 0.93rem;
        font-weight: 500;
        margin-right: 0.2rem;
        margin-bottom: 0.1rem;
        background: #f2f4f8;
        color: #697077;
    }

    .tag-green {
        background: #e6f9ed;
        color: #1a7f37;
    }

    .tag-red {
        background: #fbeaea;
        color: #b71c1c;
    }

    @media (max-width: 768px) {
        .problema-item {
            padding: 0.7rem 0.5rem;
            border-radius: 8px;
            font-size: 0.97rem;
            flex-direction: column;
            align-items: stretch;
            gap: 0.8rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .problema-info h3 {
            font-size: 0.97rem;
            margin-bottom: 0.3rem;
        }

        .problema-details {
            gap: 0.7rem;
            font-size: 0.9rem;
        }

        .actions {
            gap: 0.5rem;
            flex-direction: row;
            justify-content: flex-end;
        }

        .problema-tags-status {
            gap: 0.1rem;
        }

        .problema-tag-status-group {
            gap: 0.2rem;
        }

        .problema-tag-label {
            font-size: 0.91rem;
        }

        .tag-status {
            font-size: 0.88rem;
            padding: 0.1rem 0.3rem;
        }
    }

    @media (max-width: 480px) {
        .problema-item {
            padding: 0.4rem 0.2rem;
            border-radius: 6px;
            font-size: 0.91rem;
            gap: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .problema-info h3 {
            font-size: 0.91rem;
            margin-bottom: 0.2rem;
        }

        .problema-details {
            gap: 0.4rem;
            font-size: 0.88rem;
        }

        .actions {
            gap: 0.3rem;
        }
    }
</style>
