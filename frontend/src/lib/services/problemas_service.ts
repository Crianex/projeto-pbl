import type { ProblemaModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { problemasCache, problemaCache, autoInvalidate, triggerPageRefresh } from "$lib/utils/cache";

export const ProblemasService = {
    getByTurma,
    getById,
    create,
    update,
    delete: deleteProblema,
    invalidateCache,
};

async function getByTurma(turmaId: string, forceRefresh = false): Promise<ProblemaModel[]> {
    const cacheKey = `turma_${turmaId}`;

    if (!forceRefresh && problemasCache.isFresh(cacheKey)) {
        const cached = problemasCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached problemas for turma ${turmaId}`);
            return cached;
        }
    }

    if (problemasCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = problemasCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data || []);
                }
            });
        });
    }

    try {
        problemasCache.setLoading(cacheKey, true);
        logger.info(`Fetching problemas for turma ${turmaId} from API`);
        const data = await api.get(`/problemas/list-by-turma?id_turma=${turmaId}`);
        const parsed = Parsers.parseProblemas(data);
        problemasCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch problemas';
        problemasCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function getById(id: string, forceRefresh = false): Promise<ProblemaModel> {
    const cacheKey = `problema_${id}`;

    if (!forceRefresh && problemaCache.isFresh(cacheKey)) {
        const cached = problemaCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached problema ${id}`);
            return cached;
        }
    }

    if (problemaCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = problemaCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data!);
                }
            });
        });
    }

    try {
        problemaCache.setLoading(cacheKey, true);
        logger.info(`Fetching problema ${id} from API`);
        const data = await api.get(`/problemas/get?id_problema=${id}`);
        const parsed = Parsers.parseProblema(data);
        problemaCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch problema';
        problemaCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function create(problemaData: {
    nome_problema: string;
    data_inicio: string;
    data_fim: string;
    id_turma: number;
    criterios: string;
    definicao_arquivos_de_avaliacao?: string;
}): Promise<ProblemaModel> {
    try {
        logger.info('Creating new problema', problemaData);
        const response = await api.post('/problemas/create', problemaData);
        const createdProblema = Parsers.parseProblema(response);

        // Auto-invalidate related caches
        await autoInvalidate.problemaCreated(createdProblema);
        triggerPageRefresh.problemas();

        logger.info('Problema created successfully', { id: createdProblema.id_problema });
        return createdProblema;
    } catch (error) {
        logger.error('Failed to create problema', error);
        throw error;
    }
}

async function update(id: string, problemaData: {
    nome_problema: string;
    data_inicio: string;
    data_fim: string;
    id_turma: number;
    criterios: string;
    definicao_arquivos_de_avaliacao?: string;
}): Promise<ProblemaModel> {
    try {
        logger.info(`Updating problema ${id}`, problemaData);
        const response = await api.put(`/problemas/update?id_problema=${id}`, problemaData);
        const updatedProblema = Parsers.parseProblema(response);

        // Auto-invalidate related caches
        await autoInvalidate.problemaUpdated(id, problemaData.id_turma.toString(), updatedProblema);
        triggerPageRefresh.problemas();

        logger.info('Problema updated successfully', { id });
        return updatedProblema;
    } catch (error) {
        logger.error('Failed to update problema', error);
        throw error;
    }
}

async function deleteProblema(id: string, turmaId?: string): Promise<void> {
    try {
        logger.info(`Deleting problema ${id}`);
        await api.delete(`/problemas/delete?id_problema=${id}`);

        // Auto-invalidate related caches
        await autoInvalidate.problemaDeleted(id, turmaId);
        triggerPageRefresh.problemas();

        logger.info('Problema deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete problema', error);
        throw error;
    }
}

function invalidateCache(problemaId?: string, turmaId?: string) {
    if (problemaId) {
        problemaCache.clear(`problema_${problemaId}`);
    }
    if (turmaId) {
        problemasCache.clear(`turma_${turmaId}`);
    }
} 