<script lang="ts">
    import Button from "$lib/design_system/components/Button.svelte";
    import { tooltip } from "$lib/design_system/utils/tooltip";
    import type {
        AlunoModel,
        AvaliacaoModel,
    } from "$lib/interfaces/interfaces";
    import { goto } from "$app/navigation";
    import { MediaCalculator } from "$lib/utils/utils";

    export let aluno: AlunoModel & {
        finalMedia: {
            professor: number;
            auto: number;
            peers: number;
            total: number;
        } | null;
    };
    export let criteriosList: {
        nome_criterio: string;
        descricao_criterio: string;
    }[];
    export let hasEvaluation: boolean;
    export let overallMedia: string;
    export let professorEvaluation: number | null = null;
    export let avaliacoesData: AvaliacaoModel[] = [];
    export let problema: any | null = null;
    export let onVerDetalhes: (id: string) => void;
    export let onAvaliar: (id: number) => void;

    function isOutlier(criterioKey: string, value: number): boolean {
        // This would need to be passed from parent or calculated here
        // For now, we'll use a simple threshold
        return value > 8 || value < 2;
    }

    // Helper to format grade based on scale (similar to relatórios page)
    function formatGrade(grade: number): number {
        if (!grade || grade === 0) return grade;
        return Number(grade.toFixed(2));
    }

    // Helper to get detailed evaluation information for tooltips
    function getEvaluationDetails(evaluationType: string): string {
        if (!avaliacoesData || !problema) return "";

        let details = `<strong>Detalhes da avaliação - ${evaluationType}</strong><br><br>`;

        if (evaluationType === "Professor") {
            const professorEval = avaliacoesData.find(
                (av) => av.id_professor && av.aluno_avaliado?.id === aluno.id,
            );

            if (!professorEval) {
                details +=
                    "❌ <strong>Avaliação do professor não encontrada</strong>";
                return details;
            }

            try {
                const notas =
                    typeof professorEval.notas === "string"
                        ? JSON.parse(professorEval.notas)
                        : professorEval.notas;

                details += "📊 <strong>Avaliação do Professor:</strong><br>";

                Object.entries(notas).forEach(([tag, criterios]) => {
                    if (typeof criterios === "object" && criterios !== null) {
                        details += `<br><strong>${tag}:</strong><br>`;
                        Object.entries(criterios).forEach(
                            ([criterio, nota]) => {
                                if (typeof nota === "number") {
                                    details += `  • ${criterio}: ${formatGrade(nota).toFixed(1)}<br>`;
                                }
                            },
                        );
                    }
                });

                // Add file grades if available
                if (professorEval.notas_por_arquivo) {
                    const fileGrades =
                        typeof professorEval.notas_por_arquivo === "string"
                            ? JSON.parse(professorEval.notas_por_arquivo)
                            : professorEval.notas_por_arquivo;

                    if (Object.keys(fileGrades).length > 0) {
                        details += `<br><strong>Arquivos:</strong><br>`;
                        Object.entries(fileGrades).forEach(
                            ([fileType, grade]: [string, any]) => {
                                if (typeof grade === "number") {
                                    // Backwards compatibility: old format
                                    details += `  • ${fileType}: ${formatGrade(grade).toFixed(1)}<br>`;
                                } else if (
                                    typeof grade === "object" &&
                                    grade !== null &&
                                    typeof grade.nota === "number"
                                ) {
                                    // New format: object with nota and observacao
                                    details += `  • ${fileType}: ${formatGrade(grade.nota).toFixed(1)}`;

                                    details += "<br>";
                                }
                            },
                        );
                    }
                }

                details += `<br><strong>Total Professor: ${aluno.finalMedia?.professor.toFixed(2)}</strong>`;
            } catch (error) {
                details +=
                    "❌ <strong>Erro ao processar avaliação do professor</strong>";
            }
        } else if (evaluationType === "Auto-avaliação") {
            const autoEval = avaliacoesData.find(
                (av) =>
                    av.aluno_avaliador?.id === aluno.id &&
                    av.aluno_avaliado?.id === aluno.id &&
                    !av.id_professor,
            );

            if (!autoEval) {
                details += "❌ <strong>Auto-avaliação não encontrada</strong>";
                return details;
            }

            try {
                const notas =
                    typeof autoEval.notas === "string"
                        ? JSON.parse(autoEval.notas)
                        : autoEval.notas;

                details += "📊 <strong>Auto-avaliação:</strong><br>";

                Object.entries(notas).forEach(([tag, criterios]) => {
                    if (typeof criterios === "object" && criterios !== null) {
                        details += `<br><strong>${tag}:</strong><br>`;
                        Object.entries(criterios).forEach(
                            ([criterio, nota]) => {
                                if (typeof nota === "number") {
                                    details += `  • ${criterio}: ${formatGrade(nota).toFixed(1)}<br>`;
                                }
                            },
                        );
                    }
                });

                details += `<br><strong>Total Auto-avaliação: ${aluno.finalMedia?.auto.toFixed(2)}</strong>`;
            } catch (error) {
                details +=
                    "❌ <strong>Erro ao processar auto-avaliação</strong>";
            }
        } else if (evaluationType === "Avaliação dos Pares") {
            const peerEvals = avaliacoesData.filter(
                (av) =>
                    av.aluno_avaliado?.id === aluno.id &&
                    av.aluno_avaliador?.id !== aluno.id &&
                    !av.id_professor,
            );

            if (peerEvals.length === 0) {
                details +=
                    "❌ <strong>Nenhuma avaliação dos pares encontrada</strong>";
                return details;
            }

            details += `📊 <strong>Avaliações dos Pares (${peerEvals.length} avaliações):</strong><br>`;

            peerEvals.forEach((evaluation, index) => {
                const evaluator = evaluation.aluno_avaliador;
                details += `<br><strong>${evaluator?.nome_completo || "Aluno"}:</strong><br>`;

                try {
                    const notas =
                        typeof evaluation.notas === "string"
                            ? JSON.parse(evaluation.notas)
                            : evaluation.notas;

                    Object.entries(notas).forEach(([tag, criterios]) => {
                        if (
                            typeof criterios === "object" &&
                            criterios !== null
                        ) {
                            details += `  <strong>${tag}:</strong><br>`;
                            Object.entries(criterios).forEach(
                                ([criterio, nota]) => {
                                    if (typeof nota === "number") {
                                        details += `    • ${criterio}: ${formatGrade(nota).toFixed(1)}<br>`;
                                    }
                                },
                            );
                        }
                    });
                } catch (error) {
                    details += `  ❌ Erro ao processar avaliação<br>`;
                }
            });

            details += `<br><strong>Média dos Pares: ${aluno.finalMedia?.peers.toFixed(2)}</strong>`;
        }

        return details;
    }

    // Helper to get falta information for tooltips
    function getFaltaInfo(): string {
        if (!problema || !problema.faltas_por_tag) return "";

        try {
            const faltasPorTag =
                typeof problema.faltas_por_tag === "string"
                    ? JSON.parse(problema.faltas_por_tag)
                    : problema.faltas_por_tag;

            const missedTags = Object.entries(faltasPorTag)
                .filter(([tag, students]) => {
                    if (typeof students === "object" && students !== null) {
                        return (students as any)[aluno.id] === true;
                    }
                    return false;
                })
                .map(([tag]) => tag);

            if (missedTags.length === 0) {
                return "";
            }

            return `<br><br>⚠️ <strong>Faltas registradas:</strong><br>• ${missedTags.join("<br>• ")}`;
        } catch (error) {
            return "";
        }
    }

    // Helper to generate complete tooltip content
    function getTooltipContent(evaluationType: string): string {
        const evaluationDetails = getEvaluationDetails(evaluationType);
        const faltaInfo = getFaltaInfo();

        return evaluationDetails + faltaInfo;
    }

    // Helper to generate total tooltip content
    function getTotalTooltipContent(): string {
        if (!aluno.finalMedia) return "Nenhuma avaliação disponível";

        return `Soma total: Professor + Auto-avaliação + Avaliação dos Pares<br><br>📊 <strong>Resumo:</strong><br>• Professor: ${aluno.finalMedia.professor.toFixed(2)}<br>• Auto-avaliação: ${aluno.finalMedia.auto.toFixed(2)}<br>• Pares: ${aluno.finalMedia.peers.toFixed(2)}<br>• <strong>Total: ${aluno.finalMedia.total.toFixed(2)}</strong>`;
    }
</script>

<div class="aluno-item">
    <div class="aluno-info">
        <div class="aluno-header">
            <div class="avatar-container">
                <img
                    src={aluno.link_avatar || "/images/default_avatar.png"}
                    alt={aluno.nome_completo || "Avatar do aluno"}
                    class="aluno-avatar"
                    on:error={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target) {
                            target.src = "/images/default_avatar.png";
                        }
                    }}
                />
            </div>
            <h3 class="aluno-nome">
                {aluno.nome_completo || "Nome não disponível"}
            </h3>
        </div>

        <div class="criterios-section">
            <h4 class="criterios-title">Avaliações:</h4>
            <div class="criterios-grid">
                {#if aluno.finalMedia}
                    <div class="criterio-item">
                        <span class="criterio-label">Professor:</span>
                        <span class="criterio-value">
                            {aluno.finalMedia.professor.toFixed(2)}
                            <span
                                class="question-mark"
                                use:tooltip={{
                                    title: getTooltipContent("Professor"),
                                }}>?</span
                            >
                        </span>
                    </div>
                    <div class="criterio-item">
                        <span class="criterio-label">Auto-avaliação:</span>
                        <span class="criterio-value">
                            {aluno.finalMedia.auto.toFixed(2)}
                            <span
                                class="question-mark"
                                use:tooltip={{
                                    title: getTooltipContent("Auto-avaliação"),
                                }}>?</span
                            >
                        </span>
                    </div>
                    <div class="criterio-item">
                        <span class="criterio-label">Avaliação dos Pares:</span>
                        <span class="criterio-value">
                            {aluno.finalMedia.peers.toFixed(2)}
                            <span
                                class="question-mark"
                                use:tooltip={{
                                    title: getTooltipContent(
                                        "Avaliação dos Pares",
                                    ),
                                }}>?</span
                            >
                        </span>
                    </div>
                    <div class="criterio-item total">
                        <span class="criterio-label">Total:</span>
                        <span class="criterio-value total-value">
                            {aluno.finalMedia.total.toFixed(2)}
                            <span
                                class="question-mark"
                                use:tooltip={{
                                    title: getTotalTooltipContent(),
                                }}>?</span
                            >
                        </span>
                    </div>
                {:else}
                    <div class="criterio-item">
                        <span class="criterio-value not-evaluated">
                            Não avaliado
                        </span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- <div class="media-section">
            <span class="media-label">Média Geral:</span>
            <span class="media-value">{overallMedia}</span>
        </div> -->

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
        align-items: stretch;
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

    .aluno-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .avatar-container {
        flex-shrink: 0;
    }

    .aluno-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e5e7eb;
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .aluno-avatar:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
        color: var(--color-info-main);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .criterio-value.outlier {
        color: var(--color-info-dark);
    }

    .criterio-value.not-evaluated {
        color: var(--color-text-muted);
        font-style: italic;
    }

    .criterio-item.total {
        border-top: 2px solid #e5e7eb;
        padding-top: 0.5rem;
        margin-top: 0.5rem;
    }

    .criterio-value.total-value {
        font-weight: bold;
        color: #059669;
        font-size: 1.1em;
    }

    .question-mark {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: #6b7280;
        color: white;
        border-radius: 50%;
        text-align: center;
        line-height: 16px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 4px;
        cursor: help;
    }

    .criterio-label {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .media-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--color-bg-light);
        border-radius: 6px;
    }

    .media-label {
        font-weight: 600;
        color: var(--color-text-primary);
        font-size: 0.9rem;
    }

    .media-value {
        font-weight: 700;
        color: var(--color-info-main);
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
        justify-content: center;
        flex: 0.3;
        min-height: 0;
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

        .aluno-header {
            gap: 0.5rem;
        }

        .aluno-avatar {
            width: 40px;
            height: 40px;
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

        .aluno-header {
            gap: 0.4rem;
        }

        .aluno-avatar {
            width: 36px;
            height: 36px;
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
