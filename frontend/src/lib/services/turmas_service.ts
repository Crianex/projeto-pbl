import type { TurmaModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { turmasCache, turmaCache } from "$lib/utils/cache";

export const TurmasService = {
    getAll,
    getById,
    invalidateCache,
};

async function getAll(forceRefresh = false): Promise<TurmaModel[]> {
    const cacheKey = 'all';

    // Return cached data if available and fresh
    if (!forceRefresh && turmasCache.isFresh(cacheKey)) {
        const cached = turmasCache.getCached(cacheKey);
        if (cached) {
            logger.info('Returning cached turmas');
            return cached;
        }
    }

    // Check if already loading
    if (turmasCache.isLoading(cacheKey)) {
        logger.info('Turmas already loading, waiting...');
        // Wait for loading to complete
        return new Promise((resolve) => {
            const unsubscribe = turmasCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data || []);
                }
            });
        });
    }

    try {
        turmasCache.setLoading(cacheKey, true);
        logger.info('Fetching turmas from API');
        const data = await api.get('/turmas/list');
        const parsed = Parsers.parseTurmas(data);
        turmasCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch turmas';
        turmasCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function getById(id: string, forceRefresh = false): Promise<TurmaModel> {
    const cacheKey = `turma_${id}`;

    if (!forceRefresh && turmaCache.isFresh(cacheKey)) {
        const cached = turmaCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached turma ${id}`);
            return cached;
        }
    }

    if (turmaCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = turmaCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data!);
                }
            });
        });
    }

    try {
        turmaCache.setLoading(cacheKey, true);
        logger.info(`Fetching turma ${id} from API`);
        const data = await api.get(`/turmas/get?id_turma=${id}`);
        const parsed = Parsers.parseTurma(data);
        turmaCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch turma';
        turmaCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

function invalidateCache(turmaId?: string) {
    if (turmaId) {
        turmaCache.clear(`turma_${turmaId}`);
    }
    turmasCache.clear('all');
} 