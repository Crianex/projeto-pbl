import type { AvaliacaoModel, ProblemaModel } from "$lib/interfaces/interfaces";
import { formatToDateTime } from "brazilian-values";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PDFFont } from "pdf-lib";

export function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export class Utils {
    static formatDate(date: Date | null | undefined) {
        if (!date) return "";
        return date.toLocaleDateString("pt-BR");
    }

    /**
     * Returns true if the current device is considered mobile (screen width <= 768px)
     */
    static isMobile(): boolean {
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
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

    static calculateRawSum(notasString: string | null): number {
        if (!notasString) return 0;
        try {
            const notasObj = JSON.parse(notasString);

            var valuesPerTag = Object.values(notasObj).filter(v => typeof v === 'object' && v !== null).map(v => Object.values(v).filter(v => typeof v === 'number') as number[]);

            const values = valuesPerTag.flat();
            return values.length > 0 ? Number((values.reduce((sum, val) => {
                return sum + val;
            }, 0)).toFixed(2)) : 0;
        } catch {
            return 0;
        }
    }



    static calculateSimpleMediaFromAvaliacao(avaliacao: AvaliacaoModel): number {
        if (!avaliacao.notas) return 0;
        // console.log(`avaliacao.notas: ${JSON.stringify(avaliacao.notas)}`);
        let values: number[] = [];
        Object.entries(avaliacao.notas).forEach(([key, val]) => {
            if (key === "media" || typeof val !== "object" || val === null) return;
            Object.values(val).forEach((num) => {
                if (typeof num === "number" && !isNaN(num)) {
                    values.push(num);
                }
            });
        });
        return values.length > 0 ? Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)) : 0;
    }

    static calculateRawSumFromAvaliacao(avaliacao: AvaliacaoModel): number {
        if (!avaliacao.notas) return 0;
        let sum = 0;
        Object.entries(avaliacao.notas).forEach(([key, val]) => {
            if (key === "media" || typeof val !== "object" || val === null) return;
            Object.values(val).forEach((num) => {
                if (typeof num === "number" && !isNaN(num)) {
                    sum += num;
                }
            });
        });
        return Number(sum.toFixed(2));
    }

    // Helper to normalize keys: lowercase and remove accents
    static normalizeKey(key: string): string {
        return key
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '');
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
            avaliacoes.map(av => av.aluno_avaliador?.id)
        );

        // Filter avaliações where this aluno was evaluated AND only from students who have submitted evaluations
        const avaliacoesRecebidas = avaliacoes.filter(
            (av) =>
                av.aluno_avaliado?.id === alunoId &&
                studentsWhoEvaluated.has(av.aluno_avaliador?.id),
        );
        if (!avaliacoesRecebidas.length) return null;

        // For each criterio, calculate the average
        const medias: Record<string, number> = {};
        criteriosList.forEach((criterio) => {
            const criterioKey = MediaCalculator.normalizeKey(criterio.nome_criterio);
            let soma = 0;
            let count = 0;

            avaliacoesRecebidas.forEach((av) => {
                try {
                    const notas = typeof av.notas === 'string' ? JSON.parse(av.notas) : av.notas;
                    // notas: { [tag]: { [criterio]: number } }
                    Object.entries(notas).forEach(
                        ([tagName, categoria]: [string, any]) => {
                            if (
                                typeof categoria === "object" &&
                                categoria !== null
                            ) {
                                // Normalize all keys in categoria
                                Object.entries(categoria).forEach(([catKey, val]) => {
                                    if (MediaCalculator.normalizeKey(catKey) === criterioKey && typeof val === "number") {
                                        soma += val;
                                        count++;
                                    }
                                });
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

    /**
     * Calculates the final media for a student in a problem, based on all evaluations.
     * @param avaliacoes All AvaliacaoModel for this problem
     * @param alunoId The id of the student being evaluated
     * @param criteriosGroup The CriteriosGroup for the problem
     * @param fileDefs The file definitions for the problem
     * @returns { professor: number, auto: number, peers: number, total: number }
     */
    static calculateFinalMedia(
        avaliacoes: any[],
        alunoId: number,
        criteriosGroup: { [tag: string]: { nome_criterio: string; nota_maxima_aluno: number; nota_maxima_professor: number }[] },
        fileDefs: { nome_tipo?: string; nota_maxima?: number }[]
    ) {
        console.log("MediaCalculator.calculateFinalMedia called with:", {
            alunoId,
            avaliacoesCount: avaliacoes.length,
            criteriosGroup,
            fileDefs
        });

        // Debug: Log the first few evaluations to see their structure
        console.log("Sample evaluations:", avaliacoes.slice(0, 3).map(av => ({
            id_aluno_avaliador: av.aluno_avaliador?.id,
            id_aluno_avaliado: av.aluno_avaliado?.id,
            id_professor: av.id_professor,
            hasNotas: !!av.notas,
            hasNotasPorArquivo: !!av.notas_por_arquivo,
            // Log the full evaluation object to see the actual structure
            fullEvaluation: av
        })));

        // Helper to sum all notas in all tags/criterios
        function sumNotas(notas: any) {
            let sum = 0;
            Object.values(notas || {}).forEach((criterios: any) => {
                if (typeof criterios === 'object' && criterios !== null) {
                    Object.values(criterios).forEach((v) => {
                        if (typeof v === 'number') sum += v;
                    });
                }
            });
            return sum;
        }
        // Helper to sum all file grades
        function sumFileGrades(notas_por_arquivo: any) {
            let sum = 0;
            Object.values(notas_por_arquivo || {}).forEach((v) => {
                if (typeof v === 'number') sum += v;
            });
            return sum;
        }
        // Calculate max possible for criterios (all tags)
        let maxCriterios = 0;
        Object.values(criteriosGroup).forEach((criteriosList) => {
            criteriosList.forEach((c) => {
                maxCriterios += c.nota_maxima_aluno; // Always use student max for criterios
            });
        });

        // Calculate max possible for file grades
        let maxFileGrades = 0;
        fileDefs.forEach((def) => {
            if (typeof def.nota_maxima === 'number') maxFileGrades += def.nota_maxima;
        });

        // Professor evaluation - includes criterios + file grades
        console.log("Looking for professor evaluation for alunoId:", alunoId);
        const profEval = avaliacoes.find(
            (av) => {
                const matches = av.id_professor && av.aluno_avaliado?.id === alunoId;

                return matches;
            }
        );
        let professorScore = 0;
        if (profEval) {
            const criteriosSum = sumNotas(profEval.notas);
            const fileGradesSum = sumFileGrades(profEval.notas_por_arquivo);
            professorScore = criteriosSum + fileGradesSum;
            console.log("Professor evaluation found:", {
                alunoId,
                profEval: {
                    id_professor: profEval.id_professor,
                    id_aluno_avaliado: profEval.id_aluno_avaliado,
                    criteriosSum,
                    fileGradesSum,
                    professorScore
                }
            });
        } else {
            console.log("No professor evaluation found for alunoId:", alunoId);
        }

        // Auto evaluation - criterios only
        console.log("Looking for auto evaluation for alunoId:", alunoId);
        const autoEval = avaliacoes.find(
            (av) => {
                const matches = av.aluno_avaliador?.id === alunoId && av.aluno_avaliado?.id === alunoId && !av.id_professor;

                return matches;
            }
        );
        let autoScore = 0;
        if (autoEval) {
            autoScore = sumNotas(autoEval.notas);
            console.log("Auto evaluation found:", {
                alunoId,
                autoEval: {
                    id_aluno_avaliador: autoEval.id_aluno_avaliador,
                    id_aluno_avaliado: autoEval.id_aluno_avaliado,
                    autoScore
                }
            });
        } else {
            console.log("No auto evaluation found for alunoId:", alunoId);
        }

        // Peer evaluations - criterios only
        console.log("Looking for peer evaluations for alunoId:", alunoId);
        const peerEvals = avaliacoes.filter(
            (av) => {
                const matches = av.aluno_avaliado?.id === alunoId && av.aluno_avaliador?.id !== alunoId && !av.id_professor;

                return matches;
            }
        );
        let peersScore = 0;
        if (peerEvals.length > 0) {
            const peerSums = peerEvals.map((av) => sumNotas(av.notas));
            peersScore = peerSums.reduce((a, b) => a + b, 0) / peerSums.length;
            console.log("Peer evaluations found:", {
                alunoId,
                peerEvalsCount: peerEvals.length,
                peerSums,
                peersScore
            });
        } else {
            console.log("No peer evaluations found for alunoId:", alunoId);
        }
        // Final total (out of 30)
        const total = professorScore + autoScore + peersScore;
        const result = {
            professor: Number(professorScore.toFixed(2)),
            auto: Number(autoScore.toFixed(2)),
            peers: Number(peersScore.toFixed(2)),
            total: Number(total.toFixed(2)),
        };
        console.log("MediaCalculator.calculateFinalMedia result:", {
            alunoId,
            result
        });
        return result;
    }
}

export class PDFExportUtils {
    /**
     * Helper to wrap text for the name column in PDF
     */
    static wrapText(
        text: string,
        maxWidth: number,
        font: PDFFont,
        fontSize: number,
    ): string[] {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";
        for (let word of words) {
            const testLine = currentLine ? currentLine + " " + word : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth + 4 > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    /**
     * Exports evaluation matrix as PDF
     */
    static async exportMatrixAsPDF(
        alunos: any[],
        evaluationMatrix: { [evaluatorId: number]: { [evaluatedId: number]: number } },
        selectedProblema: any,
        professor: any,
        getFinalMediaForStudent: (studentId: number) => { professor: number; auto: number; peers: number; total: number },
        getProfessorGradeFor: (studentId: number) => number | null,
        formatGrade: (grade: number) => number
    ) {
        if (!alunos.length || !Object.keys(evaluationMatrix).length) return;

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Define all variables first
        const leftMargin = 30; // Reduced from 40 to 30
        const cellHeight = 25; // Reduced from 32 to 25
        const nameFontSize = 11; // Reduced from 13 to 11
        const namePadding = 15; // Reduced from 20 to 15
        const otherColWidth = 55; // Reduced from 70 to 55

        // Dynamically calculate the max width needed for the name column
        const maxNameWidth = Math.max(
            ...alunos.map((a) =>
                font.widthOfTextAtSize(
                    a.nome_completo?.split(" ").slice(0, 2).join(" ") || "N/A",
                    nameFontSize,
                ),
            ),
        );
        const nameColWidth = Math.ceil(maxNameWidth) + namePadding;

        // Calculate page size based on table width
        const tableWidth =
            leftMargin + nameColWidth + otherColWidth * (alunos.length + 5); // +5 for number, prof, auto, pares, total columns
        const pageWidth = Math.max(800, tableWidth + 40); // Add some margin
        const pageHeight = Math.max(
            600,
            100 + (alunos.length + 3) * cellHeight,
        ); // +3 for header, students, and professor row

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = page.getHeight() - 40; // Reduced from 50 to 40
        const headerBg = rgb(0.88, 0.91, 1);
        const borderColor = rgb(0.8, 0.8, 0.8);

        // Title
        page.drawText(
            `Matriz de Avaliações - ${selectedProblema?.nome_problema || "Problema"}`,
            { x: leftMargin, y, size: 18, font, color: rgb(0, 0, 0) }, // Reduced from 22 to 18
        );
        y -= 30; // Reduced from 40 to 30

        // Table header
        let x = leftMargin;
        const headers = [
            "Aluno",
            "Número",
            "Prof.",
            "Auto",
            "Pares",
            "Total",
            ...alunos.map((_, idx) => (idx + 1).toString()),
        ];
        headers.forEach((header, i) => {
            const colWidth = i === 0 ? nameColWidth : otherColWidth;
            page.drawRectangle({
                x,
                y,
                width: colWidth,
                height: cellHeight,
                color: headerBg,
                borderColor,
                borderWidth: 1,
            });
            page.drawText(header, {
                x: x + 8, // Reduced from 10 to 8
                y: y + 10, // Reduced from 12 to 10
                size: 12, // Reduced from 15 to 12
                font,
                color: rgb(0, 0, 0),
            });
            x += colWidth;
        });
        y -= cellHeight;

        // Table body
        alunos.forEach((evaluator, evaluatorIdx) => {
            x = leftMargin;
            // Aluno name
            const name =
                evaluator.nome_completo?.split(" ").slice(0, 2).join(" ") ||
                "N/A";
            const nameLines = PDFExportUtils.wrapText(
                name,
                nameColWidth - 8, // Reduced from 10 to 8
                font,
                nameFontSize,
            );
            const rowHeight = Math.max(
                cellHeight,
                nameLines.length * (nameFontSize + 1) + 6, // Reduced spacing
            );
            page.drawRectangle({
                x,
                y,
                width: nameColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            nameLines.forEach((line, i) => {
                page.drawText(line, {
                    x: x + 8, // Reduced from 10 to 8
                    y: y + rowHeight - 12 - i * (nameFontSize + 1), // Reduced spacing
                    size: nameFontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
            });
            x += nameColWidth;
            // Número
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((evaluatorIdx + 1).toString(), {
                x: x + 20, // Reduced from 24 to 20
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Prof, Auto, Pares, Total columns
            const finalMedia = getFinalMediaForStudent(evaluator.id);

            // Prof
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((finalMedia.professor || "-").toString(), {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Auto
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((finalMedia.auto || "-").toString(), {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Pares
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((finalMedia.peers || "-").toString(), {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Total
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText((finalMedia.total || "-").toString(), {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Grades
            alunos.forEach((evaluated) => {
                page.drawRectangle({
                    x,
                    y,
                    width: otherColWidth,
                    height: rowHeight,
                    borderColor,
                    borderWidth: 1,
                });
                let text = "-";
                if (evaluator.id === evaluated.id) {
                    text = "X";
                } else {
                    const grade =
                        evaluationMatrix[evaluator.id]?.[evaluated.id];
                    text =
                        grade && grade > 0
                            ? formatGrade(grade).toString()
                            : grade === 0
                                ? "0"
                                : "-";
                }
                page.drawText(text, {
                    x: x + 22, // Reduced from 30 to 22
                    y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                    size: 11, // Reduced from 13 to 11
                    font,
                    color: rgb(0, 0, 0),
                });
                x += otherColWidth;
            });
            y -= rowHeight;
        });

        // Professor row
        if (professor) {
            x = leftMargin;
            const name =
                professor.nome_completo?.split(" ").slice(0, 2).join(" ") ||
                "Professor";
            const nameLines = PDFExportUtils.wrapText(
                name,
                nameColWidth - 8, // Reduced from 10 to 8
                font,
                nameFontSize,
            );
            const rowHeight = Math.max(
                cellHeight,
                nameLines.length * (nameFontSize + 1) + 6, // Reduced spacing
            );
            page.drawRectangle({
                x,
                y,
                width: nameColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            nameLines.forEach((line, i) => {
                page.drawText(line, {
                    x: x + 8, // Reduced from 10 to 8
                    y: y + rowHeight - 12 - i * (nameFontSize + 1), // Reduced spacing
                    size: nameFontSize,
                    font,
                    color: rgb(0, 0, 0),
                });
            });
            x += nameColWidth;
            // Número
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("Prof.", {
                x: x + 8, // Reduced from 10 to 8
                y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                size: 11, // Reduced from 13 to 11
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Prof, Auto, Pares, Total columns for professor row
            // Prof
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("-", {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Auto
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("-", {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Pares
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("-", {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;

            // Total
            page.drawRectangle({
                x,
                y,
                width: otherColWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
            });
            page.drawText("-", {
                x: x + 20,
                y: y + rowHeight / 2 - 5,
                size: 11,
                font,
                color: rgb(0, 0, 0),
            });
            x += otherColWidth;
            // Grades
            alunos.forEach((evaluated) => {
                page.drawRectangle({
                    x,
                    y,
                    width: otherColWidth,
                    height: rowHeight,
                    borderColor,
                    borderWidth: 1,
                });
                let text: string;
                if (professor.id === evaluated.id) {
                    text = "X";
                } else {
                    const grade = getProfessorGradeFor(evaluated.id);
                    text = grade !== null ? grade.toString() : "-";
                }
                page.drawText(text, {
                    x: x + 22, // Reduced from 30 to 22
                    y: y + rowHeight / 2 - 5, // Reduced from 6 to 5
                    size: 11, // Reduced from 13 to 11
                    font,
                    color: rgb(0, 0, 0),
                });
                x += otherColWidth;
            });
            y -= rowHeight;
        }

        // Download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${selectedProblema?.nome_problema || "matriz"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    static getDateRangesFromProblemaModel(problema: ProblemaModel) {
        // Returns date ranges in a single line format for mobile
        const ranges = Object.entries(problema.data_e_hora_criterios_e_arquivos)
            .map(([tag, dateObj]) => {
                if (!dateObj.data_e_hora_inicio || !dateObj.data_e_hora_fim) return null;
                const inicio = formatToDateTime(dateObj.data_e_hora_inicio);
                const fim = formatToDateTime(dateObj.data_e_hora_fim);
                const isActive = DateUtils.isNowWithinTagDateRange(problema, tag);
                return {
                    tag,
                    range: `${inicio} - ${fim}`,
                    isActive
                };
            })
            .filter(Boolean);
        return ranges;
    }
}