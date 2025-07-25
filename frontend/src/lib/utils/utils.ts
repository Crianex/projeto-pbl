import type { ProblemaModel } from "$lib/interfaces/interfaces";
import { formatToDateTime } from "brazilian-values";

export function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export class Utils {
    static formatDate(date: Date | null | undefined) {
        if (!date) return "";
        return date.toLocaleDateString("pt-BR");
    }
}

export class MediaCalculator {
    /**
     * Calculates simple average from a single notas object
     * Used for overall evaluation scores from a single evaluation
     */
    static calculateSimpleMedia(notasString: string | null): number {
        if (!notasString) return 0;
        try {
            const notasObj = JSON.parse(notasString);
            const values = Object.values(notasObj).filter(v => typeof v === 'number') as number[];
            return values.length > 0 ? Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)) : 0;
        } catch {
            return 0;
        }
    }

    /**
     * Calculates media per criterio from multiple evaluations
     * Used for peer evaluation averages per criterion
     */
    static calcularMediaPorCriterio(
        avaliacoes: any[],
        alunoId: number,
        criteriosList: { nome_criterio: string }[]
    ): Record<string, number> | null {
        // Get unique list of students who have submitted evaluations (evaluators)
        const studentsWhoEvaluated = new Set(
            avaliacoes.map(av => av.id_aluno_avaliador)
        );

        // Filter avaliações where this aluno was evaluated AND only from students who have submitted evaluations
        const avaliacoesRecebidas = avaliacoes.filter(
            (av) =>
                av.id_aluno_avaliado === alunoId &&
                studentsWhoEvaluated.has(av.id_aluno_avaliador),
        );
        if (!avaliacoesRecebidas.length) return null;

        // For each criterio, calculate the average
        const medias: Record<string, number> = {};
        criteriosList.forEach((criterio) => {
            const criterioKey = criterio.nome_criterio.toLowerCase();
            let soma = 0;
            let count = 0;

            avaliacoesRecebidas.forEach((av) => {
                try {
                    const notas = JSON.parse(av.notas);
                    // notas: { [tag]: { [criterio]: number } }
                    Object.entries(notas).forEach(
                        ([tagName, categoria]: [string, any]) => {
                            if (
                                typeof categoria === "object" &&
                                categoria !== null
                            ) {
                                if (criterioKey in categoria) {
                                    const val = categoria[criterioKey];
                                    if (typeof val === "number") {
                                        soma += val;
                                        count++;
                                    }
                                }
                            }
                        },
                    );
                } catch (error) {
                    console.error("Error parsing notas:", av.notas, error);
                }
            });

            if (count > 0) {
                medias[criterioKey] = Number((soma / count).toFixed(2));
            }
        });

        return Object.keys(medias).length > 0 ? medias : null;
    }

    /**
     * Calculates media per criterio from a single notas string
     * Used for individual evaluation displays
     */
    static calcularMediaPorCriterioSingle(
        notasString: string | null,
        criteriosList: { nome_criterio: string }[]
    ): Record<string, number> | null {
        if (!notasString) return null;
        try {
            const notasObj = JSON.parse(notasString);
            const medias: Record<string, number> = {};

            criteriosList.forEach((criterio) => {
                const criterioKey = criterio.nome_criterio.toLowerCase();
                let soma = 0;
                let count = 0;

                Object.entries(notasObj).forEach(
                    ([tagName, categoria]: [string, any]) => {
                        if (
                            typeof categoria === "object" &&
                            categoria !== null
                        ) {
                            if (criterioKey in categoria) {
                                const val = categoria[criterioKey];
                                if (typeof val === "number") {
                                    soma += val;
                                    count++;
                                }
                            }
                        }
                    },
                );

                if (count > 0) {
                    medias[criterioKey] = Number((soma / count).toFixed(2));
                }
            });

            return Object.keys(medias).length > 0 ? medias : null;
        } catch (error) {
            console.error("Error parsing notasString:", error, notasString);
            return null;
        }
    }

    /**
     * Calculates overall media from individual criteria averages
     * Used for final student scores
     */
    static calculateOverallMedia(medias: Record<string, number> | null): number | string {
        if (!medias) return "Não avaliado";

        const validScores = Object.values(medias).filter(
            (score) => typeof score === "number"
        ) as number[];

        if (validScores.length > 0) {
            const overallMedia = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            return Number(overallMedia.toFixed(2));
        }

        return "Não avaliado";
    }

    /**
     * Simple media calculation from current evaluation values
     * Used during evaluation process
     */
    static calculateCurrentMedia(currentValues: { [tag: string]: { [criterio: string]: number } }): number {
        let total = 0;
        let count = 0;

        Object.entries(currentValues).forEach(([tag, criterios]) => {
            Object.entries(criterios).forEach(([criterioKey, nota]) => {
                if (!isNaN(nota)) {
                    total += nota;
                    count++;
                }
            });
        });

        return count > 0 ? total / count : 0;
    }
}


export class DateUtils {
    static getDateFromProblemaModel(problema: ProblemaModel) {
        // For each criterios tag, format its start and end date
        const ranges = Object.values(problema.data_e_hora_criterios_e_arquivos)
            .map(dateObj => {
                if (!dateObj.data_e_hora_inicio || !dateObj.data_e_hora_fim) return null;
                const inicio = formatToDateTime(dateObj.data_e_hora_inicio);
                const fim = formatToDateTime(dateObj.data_e_hora_fim);
                return `De ${inicio} a ${fim}`;
            })
            .filter(Boolean);
        if (ranges.length === 0) return "";
        return ranges.join(" e ");
    }

    static getDateStartFromProblemaModel(problema: ProblemaModel) {
        const ranges = Object.entries(problema.data_e_hora_criterios_e_arquivos)
            .map(([tag, dateObj]) => {
                if (!dateObj.data_e_hora_inicio) return null;
                return `${tag}: ${formatToDateTime(dateObj.data_e_hora_inicio)}`;
            })
            .filter(Boolean);
        return ranges.join("<br><br>");
    }

    static getDateEndFromProblemaModel(problema: ProblemaModel) {
        const ranges = Object.entries(problema.data_e_hora_criterios_e_arquivos)
            .map(([tag, dateObj]) => {
                if (!dateObj.data_e_hora_fim) return null;
                return `${tag}: ${formatToDateTime(dateObj.data_e_hora_fim)}`;
            })
            .filter(Boolean);
        return ranges.join("<br><br>");
    }

    static isNowWithinAnyDateRange(problema: ProblemaModel): boolean {
        const now = new Date();
        return Object.values(problema.data_e_hora_criterios_e_arquivos).some(dateObj => {
            if (!dateObj.data_e_hora_inicio || !dateObj.data_e_hora_fim) return false;
            const inicio = new Date(dateObj.data_e_hora_inicio);
            const fim = new Date(dateObj.data_e_hora_fim);
            return now >= inicio && now <= fim;
        });
    }

    static isNowWithinTagDateRange(problema: ProblemaModel, tag: string): boolean {
        const now = new Date();
        const dateObj = problema.data_e_hora_criterios_e_arquivos[tag];
        if (!dateObj || !dateObj.data_e_hora_inicio || !dateObj.data_e_hora_fim) return false;
        const inicio = new Date(dateObj.data_e_hora_inicio);
        const fim = new Date(dateObj.data_e_hora_fim);
        return now >= inicio && now <= fim;
    }

    static getDateStartStatusArrayFromProblemaModel(problema: ProblemaModel) {
        // Returns [{ tag, date, isActive }]
        return Object.entries(problema.data_e_hora_criterios_e_arquivos)
            .filter(([tag, dateObj]) => !!dateObj.data_e_hora_inicio)
            .map(([tag, dateObj]) => ({
                tag,
                date: formatToDateTime(dateObj.data_e_hora_inicio),
                isActive: DateUtils.isNowWithinTagDateRange(problema, tag)
            }));
    }

    static getDateEndStatusArrayFromProblemaModel(problema: ProblemaModel) {
        // Returns [{ tag, date, isActive }]
        return Object.entries(problema.data_e_hora_criterios_e_arquivos)
            .filter(([tag, dateObj]) => !!dateObj.data_e_hora_fim)
            .map(([tag, dateObj]) => ({
                tag,
                date: formatToDateTime(dateObj.data_e_hora_fim),
                isActive: DateUtils.isNowWithinTagDateRange(problema, tag)
            }));
    }
}