import type { AlunoDB, AlunoModel, AvaliacaoDB, AvaliacaoModel, AvaliacaoNota, ProblemaDB, TurmaDB } from "$lib/interfaces/interfaces";
import { Parsers } from "$lib/interfaces/parsers";
import { api } from "$lib/utils/api";
import { logger } from "$lib/utils/logger";
import { avaliacoesCache, autoInvalidate, triggerPageRefresh } from "$lib/utils/cache";

export const AvaliacoesService = {
    getAvaliacoes,
    getByProblema,
    create,
    update,
    delete: deleteAvaliacao,
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
            notas: JSON.parse(avaliacao.notas) as AvaliacaoNota,
            notas_por_arquivo: JSON.parse(avaliacao.notas_por_arquivo) as { [tag: string]: number }
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
        // parse data to AvaliacaoModel[]
        const parsedData = data.map((avaliacao: AvaliacaoDB) =>
            Parsers.parseAvaliacao(avaliacao)
        );
        avaliacoesCache.setData(cacheKey, parsedData);
        return parsedData;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch avaliacoes';
        avaliacoesCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function create(avaliacaoData: {
    id_problema: number;
    id_aluno_avaliador?: number;
    id_professor?: number;
    id_aluno_avaliado: number;
    notas: string;
}): Promise<void> {
    try {
        logger.info('Creating new avaliacao', avaliacaoData);

        if (avaliacaoData.id_professor) {
            // Professor evaluation
            await api.post('/avaliacoes/create', avaliacaoData);
        } else {
            // Student evaluation
            await api.post('/problemas/add-avaliacao', avaliacaoData);
        }

        // Auto-invalidate related caches
        await autoInvalidate.avaliacaoCreated(avaliacaoData.id_problema.toString());
        triggerPageRefresh.avaliacoes();

        logger.info('Avaliacao created successfully', { problemaId: avaliacaoData.id_problema });
    } catch (error) {
        logger.error('Failed to create avaliacao', error);
        throw error;
    }
}

async function update(id: string, avaliacaoData: {
    id_problema: number;
    notas: string;
}): Promise<void> {
    try {
        logger.info(`Updating avaliacao ${id}`, avaliacaoData);
        await api.put(`/avaliacoes/update?id_avaliacao=${id}`, avaliacaoData);

        // Auto-invalidate related caches
        await autoInvalidate.avaliacaoUpdated(avaliacaoData.id_problema.toString());
        triggerPageRefresh.avaliacoes();

        logger.info('Avaliacao updated successfully', { id });
    } catch (error) {
        logger.error('Failed to update avaliacao', error);
        throw error;
    }
}

async function deleteAvaliacao(id: string, problemaId: string): Promise<void> {
    try {
        logger.info(`Deleting avaliacao ${id}`);
        await api.delete(`/avaliacoes/delete?id_avaliacao=${id}`);

        // Auto-invalidate related caches
        await autoInvalidate.avaliacaoDeleted(problemaId);
        triggerPageRefresh.avaliacoes();

        logger.info('Avaliacao deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete avaliacao', error);
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

