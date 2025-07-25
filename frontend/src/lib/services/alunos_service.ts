import type { AlunoModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { alunoCache, autoInvalidate, triggerPageRefresh } from "$lib/utils/cache";

export const AlunosService = {
    getById,
    create,
    update,
    delete: deleteAluno,
    invalidateCache,
    searchPaginated,
};

async function getById(id: string, forceRefresh = false): Promise<AlunoModel> {
    const cacheKey = `aluno_${id}`;

    if (!forceRefresh && alunoCache.isFresh(cacheKey)) {
        const cached = alunoCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached aluno ${id}`);
            return cached;
        }
    }

    if (alunoCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = alunoCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data!);
                }
            });
        });
    }

    try {
        alunoCache.setLoading(cacheKey, true);
        logger.info(`Fetching aluno ${id} from API`);
        const data = await api.get(`/alunos/get?id_aluno=${id}`);
        const parsed = Parsers.parseAluno(data);
        alunoCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch aluno';
        alunoCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function create(alunoData: { nome_completo: string; email: string }): Promise<AlunoModel> {
    try {
        logger.info('Creating new aluno', alunoData);
        const response = await api.post('/alunos/create', alunoData);
        const createdAluno = Parsers.parseAluno(response);

        // Auto-invalidate related caches
        await autoInvalidate.alunoCreated(createdAluno);
        triggerPageRefresh.alunos();

        logger.info('Aluno created successfully', { id: createdAluno.id });
        return createdAluno;
    } catch (error) {
        logger.error('Failed to create aluno', error);
        throw error;
    }
}

async function update(aluno: AlunoModel): Promise<AlunoModel> {
    try {
        logger.info(`Updating aluno ${aluno.id}`, aluno);
        const response = await api.put(`/alunos/update?id_aluno=${aluno.id}`, {
            nome_completo: aluno.nome_completo,
            email: aluno.email,
        });
        const updatedAluno = Parsers.parseAluno(response);

        // Auto-invalidate related caches
        await autoInvalidate.alunoUpdated(aluno.id.toString(), updatedAluno);
        triggerPageRefresh.alunos();

        logger.info('Aluno updated successfully', { id: aluno.id });
        return updatedAluno;
    } catch (error) {
        logger.error('Failed to update aluno', error);
        throw error;
    }
}

async function deleteAluno(id: string, turmaId?: string): Promise<void> {
    try {
        logger.info(`Deleting aluno ${id}`);
        await api.delete(`/alunos/delete?id_aluno=${id}`);

        // Auto-invalidate related caches
        await autoInvalidate.alunoDeleted(id, turmaId);
        triggerPageRefresh.alunos();

        logger.info('Aluno deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete aluno', error);
        throw error;
    }
}

function invalidateCache(alunoId?: string) {
    if (alunoId) {
        alunoCache.clear(`aluno_${alunoId}`);
    } else {
        alunoCache.clearAll();
    }
}

/**
 * Fetch alunos with pagination for infinite scroll.
 * @param {Object} params
 * @param {string} params.query - Search query (required)
 * @param {number} params.limit - Number of results per page
 * @param {number} params.offset - Offset for pagination
 * @param {string | null} params.exclude_turma_id - Optional turma to exclude
 * @param {string[]} [params.exclude_aluno_ids] - Optional array of aluno IDs to exclude
 */
async function searchPaginated({ query, limit = 10, offset = 0, exclude_turma_id = null, exclude_aluno_ids = [], order = 'nome_completo.asc' }: {
    query: string,
    limit?: number,
    offset?: number,
    exclude_turma_id?: string | null,
    exclude_aluno_ids?: string[],
    order?: string,
}): Promise<AlunoModel[]> {
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (exclude_turma_id) params.set('exclude_turma_id', exclude_turma_id);
    if (exclude_aluno_ids && exclude_aluno_ids.length > 0) {
        params.set('exclude_aluno_ids', exclude_aluno_ids.join(','));
    }
    if (order) params.set('order', order);
    const data = await api.get(`/alunos/search?${params.toString()}`);
    return Parsers.parseAlunos(data);
}