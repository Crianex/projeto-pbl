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
            const values = Object.values(notasObj).filter(v => typeof v === 'number') as number[];
            return values.length > 0 ? Number((values.reduce((sum, val) => sum + val, 0)).toFixed(2)) : 0;
        } catch {
            return 0;
        }
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
        alunoId: any,
        criteriosGroup: any,
        fileDefs: any[]
    ) {
        // Helper to sum all notas in all tags/criterios
        function sumNotas(notas: any) {
            let sum = 0;
            Object.values(notas || {}).forEach((criterios: any) => {
                if (typeof criterios === 'object' && criterios !== null) {
                    Object.values(criterios).forEach((v: any) => {
                        if (typeof v === 'number') sum += v;
                    });
                }
            });
            return sum;
        }
        // Helper to sum all file grades
        function sumFileGrades(notas_por_arquivo: any) {
            let sum = 0;
            Object.values(notas_por_arquivo || {}).forEach((v: any) => {
                if (typeof v === 'number') sum += v;
            });
            return sum;
        }
        // Calculate max possible for criterios (all tags)
        let maxCriterios = 0;
        Object.values(criteriosGroup).forEach((criteriosList: any) => {
            (criteriosList as any[]).forEach((c: any) => {
                maxCriterios += c.nota_maxima_aluno; // Always use student max for criterios
            });
        });

        // Calculate max possible for file grades
        let maxFileGrades = 0;
        fileDefs.forEach((def: any) => {
            if (typeof def.nota_maxima === 'number') maxFileGrades += def.nota_maxima;
        });

        // Professor evaluation - includes criterios + file grades
        const profEval = avaliacoes.find(
            (av: any) => av.id_professor && av.aluno_avaliado?.id === alunoId
        );
        let professorScore = 0;
        if (profEval) {
            const criteriosSum = sumNotas(profEval.notas);
            const fileGradesSum = sumFileGrades(profEval.notas_por_arquivo);
            professorScore = criteriosSum + fileGradesSum;
        }

        // Auto evaluation - criterios only
        const autoEval = avaliacoes.find(
            (av: any) => av.aluno_avaliador?.id === alunoId && av.aluno_avaliado?.id === alunoId && !av.id_professor
        );
        let autoScore = 0;
        if (autoEval) {
            autoScore = sumNotas(autoEval.notas);
        }

        // Peer evaluations - criterios only
        const peerEvals = avaliacoes.filter(
            (av: any) => av.aluno_avaliado?.id === alunoId && av.aluno_avaliador?.id !== alunoId && !av.id_professor
        );
        let peersScore = 0;
        if (peerEvals.length > 0) {
            const peerSums = peerEvals.map((av: any) => sumNotas(av.notas));
            peersScore = peerSums.reduce((a: number, b: number) => a + b, 0) / peerSums.length;
        }
        // Final total (out of 30)
        const total = professorScore + autoScore + peersScore;
        return {
            professor: Number(professorScore.toFixed(2)),
            auto: Number(autoScore.toFixed(2)),
            peers: Number(peersScore.toFixed(2)),
            total: Number(total.toFixed(2)),
        };
    }
} 