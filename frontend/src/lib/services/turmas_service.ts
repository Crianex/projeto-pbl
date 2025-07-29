import type { TurmaModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { turmasCache, turmaCache, autoInvalidate, triggerPageRefresh } from "$lib/utils/cache";

export const TurmasService = {
    getAll,
    getById,
    create,
    update,
    delete: deleteTurma,
    addAluno,
    removeAluno,
    invalidateCache,
};

async function getAll(professorId: number, forceRefresh = false): Promise<TurmaModel[]> {
    const cacheKey = `professor_${professorId}`;

    // Return cached data if available and fresh
    if (!forceRefresh && turmasCache.isFresh(cacheKey)) {
        const cached = turmasCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached turmas for professor ${professorId}`);
            return cached;
        }
    }

    // Check if already loading
    if (turmasCache.isLoading(cacheKey)) {
        logger.info(`Turmas already loading for professor ${professorId}, waiting...`);
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
        logger.info(`Fetching turmas for professor ${professorId} from API`);
        const data = await api.get(`/turmas/list?id_professor=${professorId}`);
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

async function create(turmaData: { nome_turma: string; id_professor: number }): Promise<TurmaModel> {
    try {
        logger.info('Creating new turma', turmaData);
        const response = await api.post('/turmas/create', turmaData);
        const createdTurma = Parsers.parseTurma(response);

        // Auto-invalidate related caches
        await autoInvalidate.turmaCreated(createdTurma);
        triggerPageRefresh.turmas();

        logger.info('Turma created successfully', { id: createdTurma.id_turma });
        return createdTurma;
    } catch (error) {
        logger.error('Failed to create turma', error);
        throw error;
    }
}

async function update(id: string, turmaData: { nome_turma: string }): Promise<TurmaModel> {
    try {
        logger.info(`Updating turma ${id}`, turmaData);
        const response = await api.put(`/turmas/update?id_turma=${id}`, turmaData);
        const updatedTurma = Parsers.parseTurma(response);

        // Auto-invalidate related caches
        await autoInvalidate.turmaUpdated(id, updatedTurma);
        triggerPageRefresh.turmas();

        logger.info('Turma updated successfully', { id });
        return updatedTurma;
    } catch (error) {
        logger.error('Failed to update turma', error);
        throw error;
    }
}

async function deleteTurma(id: string): Promise<void> {
    try {
        logger.info(`Deleting turma ${id}`);
        await api.delete(`/turmas/delete?id_turma=${id}`);

        // Auto-invalidate related caches
        await autoInvalidate.turmaDeleted(id);
        triggerPageRefresh.turmas();

        logger.info('Turma deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete turma', error);
        throw error;
    }
}

async function addAluno(turmaId: string, alunoId: number): Promise<void> {
    try {
        logger.info(`Adding aluno ${alunoId} to turma ${turmaId}`);
        await api.post('/turmas/add-aluno', {
            id_turma: turmaId,
            id_aluno: alunoId,
        });

        // Auto-invalidate related caches
        await autoInvalidate.turmaAlunoAdded(turmaId);
        triggerPageRefresh.turmas();

        logger.info('Aluno added to turma successfully', { turmaId, alunoId });
    } catch (error) {
        logger.error('Failed to add aluno to turma', error);
        throw error;
    }
}

async function removeAluno(turmaId: string, alunoId: number): Promise<void> {
    try {
        logger.info(`Removing aluno ${alunoId} from turma ${turmaId}`);
        await api.delete(`/turmas/remove-aluno?id_turma=${turmaId}&id_aluno=${alunoId}`);

        // Auto-invalidate related caches
        await autoInvalidate.turmaAlunoRemoved(turmaId);
        triggerPageRefresh.turmas();

        logger.info('Aluno removed from turma successfully', { turmaId, alunoId });
    } catch (error) {
        logger.error('Failed to remove aluno from turma', error);
        throw error;
    }
}

function invalidateCache(turmaId?: string) {
    if (turmaId) {
        turmaCache.clear(`turma_${turmaId}`);
    }
    turmasCache.clear('all');
} 