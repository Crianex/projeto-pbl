import type { AlunoDB, AlunoModel, AvaliacaoDB, AvaliacaoModel, AvaliacaoNota, ProblemaDB, TurmaDB } from "$lib/interfaces/interfaces";
import { Parsers } from "$lib/interfaces/parsers";
import { api } from "$lib/utils/api";
import { logger } from "$lib/utils/logger";
import { avaliacoesCache } from "$lib/utils/cache";

export const AvaliacoesService = {
    getAvaliacoes,
    getByProblema,
    invalidateCache,
}

async function getAvaliacoes(id_problema: number): Promise<AvaliacaoModel[]> {
    const response: AvaliacaoDB[] = await api.get(`/problemas/get-avaliacoes?id_problema=${id_problema}`);

    const problema: ProblemaDB = await api.get(`/problemas/get?id_problema=${id_problema}`);

    const turma: TurmaDB = await api.get(`/turmas/get?id_turma=${problema.id_turma}`);

    const alunosPorID = new Map<number, AlunoModel>(turma.alunos!.map((aluno: AlunoDB) => [aluno.id_aluno, Parsers.parseAluno(aluno)]));

    const avaliacoes: AvaliacaoModel[] = response.map((avaliacao: AvaliacaoDB) => {
        return {
            id_avaliacao: avaliacao.id_avaliacao,
            created_at: new Date(avaliacao.created_at),
            id_problema: avaliacao.id_problema,
            aluno_avaliador: alunosPorID.get(avaliacao.id_aluno_avaliador!)!,
            aluno_avaliado: alunosPorID.get(avaliacao.id_aluno_avaliado!)!,
            notas: JSON.parse(avaliacao.notas) as AvaliacaoNota
        }
    });

    return avaliacoes;
}

async function getByProblema(problemaId: string, forceRefresh = false): Promise<AvaliacaoModel[]> {
    const cacheKey = `problema_${problemaId}`;

    if (!forceRefresh && avaliacoesCache.isFresh(cacheKey)) {
        const cached = avaliacoesCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached avaliacoes for problema ${problemaId}`);
            return cached;
        }
    }

    if (avaliacoesCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = avaliacoesCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data || []);
                }
            });
        });
    }

    try {
        avaliacoesCache.setLoading(cacheKey, true);
        logger.info(`Fetching avaliacoes for problema ${problemaId} from API`);
        const data = await api.get(`/avaliacoes/list?id_problema=${problemaId}`);
        avaliacoesCache.setData(cacheKey, data);
        return data;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch avaliacoes';
        avaliacoesCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

function invalidateCache(problemaId?: string) {
    if (problemaId) {
        avaliacoesCache.clear(`problema_${problemaId}`);
    } else {
        avaliacoesCache.clearAll();
    }
}

