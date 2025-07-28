<script lang="ts">
    import Button from "./Button.svelte";
    import type { AlunoModel } from "$lib/interfaces/interfaces";
    import { goto } from "$app/navigation";

    export let aluno: AlunoModel & { medias: Record<string, number> | null };
    export let criteriosList: {
        nome_criterio: string;
        descricao_criterio: string;
    }[];
    export let hasEvaluation: boolean;
    export let overallMedia: string;
    export let onVerDetalhes: (id: string) => void;
    export let onAvaliar: (id: number) => void;

    function isOutlier(criterioKey: string, value: number): boolean {
        // This would need to be passed from parent or calculated here
        // For now, we'll use a simple threshold
        return value > 8 || value < 2;
    }
</script>

<div class="aluno-item">
    <div class="aluno-info">
        <h3 class="aluno-nome">
            {aluno.nome_completo || "Nome não disponível"}
        </h3>

        <div class="criterios-section">
            <h4 class="criterios-title">Critérios:</h4>
            <div class="criterios-grid">
                {#each criteriosList as criterio}
                    {@const key = criterio.nome_criterio.toLowerCase()}
                    {@const value =
                        aluno.medias && key in aluno.medias
                            ? aluno.medias[key]
                            : null}
                    <div class="criterio-item">
                        <span
                            class="criterio-label"
                            title={criterio.descricao_criterio}
                        >
                            {criterio.nome_criterio}:
                        </span>
                        <span
                            class="criterio-value {value !== null &&
                            value !== undefined
                                ? isOutlier(key, value)
                                    ? 'outlier'
                                    : ''
                                : 'not-evaluated'}"
                        >
                            {value !== null && value !== undefined
                                ? value.toFixed(2)
                                : "Não avaliado"}
                        </span>
                    </div>
                {/each}
            </div>
        </div>

        <div class="media-section">
            <span class="media-label">Média Geral:</span>
            <span class="media-value">{overallMedia}</span>
        </div>

        <div class="evaluation-status">
            <span class="status-label">Avaliado:</span>
            <span
                class="status-value {hasEvaluation
                    ? 'evaluated'
                    : 'not-evaluated'}"
            >
                {hasEvaluation ? "✓ Sim" : "✗ Não"}
            </span>
        </div>
    </div>

    <div class="actions">
        <Button variant="primary" on:click={() => onAvaliar(aluno.id)}>
            Avaliar
        </Button>
        <Button
            variant="secondary"
            on:click={() => onVerDetalhes(aluno.id.toString())}
        >
            Ver Detalhes
        </Button>
    </div>
</div>

<style>
    .aluno-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.5rem;
        transition: box-shadow 0.2s ease;
    }

    .aluno-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .aluno-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .aluno-nome {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        color: #1f2937;
    }

    .criterios-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .criterios-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #6b7280;
        margin: 0;
    }

    .criterios-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .criterio-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.3rem 0.5rem;
        background: #f9fafb;
        border-radius: 4px;
        font-size: 0.85rem;
    }

    .criterio-label {
        font-weight: 500;
        color: #374151;
    }

    .criterio-value {
        font-weight: 600;
        color: #059669;
    }

    .criterio-value.outlier {
        color: #dc2626;
    }

    .criterio-value.not-evaluated {
        color: #6b7280;
        font-style: italic;
    }

    .media-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f0f9ff;
        border-radius: 6px;
    }

    .media-label {
        font-weight: 600;
        color: #0369a1;
        font-size: 0.9rem;
    }

    .media-value {
        font-weight: 700;
        color: #0369a1;
        font-size: 1rem;
    }

    .evaluation-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-label {
        font-weight: 500;
        color: #6b7280;
        font-size: 0.85rem;
    }

    .status-value {
        font-weight: 600;
        font-size: 0.85rem;
    }

    .status-value.evaluated {
        color: #059669;
    }

    .status-value.not-evaluated {
        color: #dc2626;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;
    }

    .actions :global(button) {
        width: 100%;
        min-width: 120px;
    }

    @media (max-width: 768px) {
        .aluno-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            padding: 1rem;
        }

        .criterios-grid {
            grid-template-columns: 1fr;
        }

        .actions {
            flex-direction: row;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        .actions :global(button) {
            flex: 1;
            min-width: 0;
        }

        .aluno-nome {
            font-size: 1rem;
        }

        .criterio-item {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .aluno-item {
            padding: 0.8rem;
        }

        .aluno-nome {
            font-size: 0.95rem;
        }

        .criterios-grid {
            gap: 0.3rem;
        }

        .criterio-item {
            padding: 0.2rem 0.4rem;
            font-size: 0.75rem;
        }

        .actions {
            gap: 0.3rem;
        }

        .actions :global(button) {
            flex: 1;
            min-width: 0;
        }
    }
</style>
