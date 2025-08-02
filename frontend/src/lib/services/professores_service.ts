import type { ProfessorModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { professorCache, autoInvalidate, triggerPageRefresh } from "$lib/utils/cache";

export const ProfessoresService = {
    getById,
    create,
    update,
    delete: deleteProfessor,
    invalidateCache,
};

async function getById(id: string, forceRefresh = false): Promise<ProfessorModel> {
    const cacheKey = `professor_${id}`;

    if (!forceRefresh && professorCache.isFresh(cacheKey)) {
        const cached = professorCache.getCached(cacheKey);
        if (cached) {
            logger.info(`Returning cached professor ${id}`);
            return cached;
        }
    }



    try {
        professorCache.setLoading(cacheKey, true);
        logger.info(`Fetching professor ${id} from API`);
        const data = await api.get(`/professores/get/${id}`);
        const parsed = Parsers.parseProfessor(data);
        professorCache.setData(cacheKey, parsed);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch professor';
        professorCache.setError(cacheKey, errorMsg);
        throw error;
    }
}

async function create(professorData: { nome_completo: string; email: string }): Promise<ProfessorModel> {
    try {
        logger.info('Creating new professor', professorData);
        const response = await api.post('/professores/create', professorData);
        const createdProfessor = Parsers.parseProfessor(response);

        // Auto-invalidate related caches
        await autoInvalidate.professorUpdated(createdProfessor.id.toString(), createdProfessor);

        logger.info('Professor created successfully', { id: createdProfessor.id });
        return createdProfessor;
    } catch (error) {
        logger.error('Failed to create professor', error);
        throw error;
    }
}

async function update(professor: ProfessorModel): Promise<ProfessorModel> {
    try {
        logger.info(`Updating professor ${professor.id}`, professor);
        const response = await api.put(`/professores/update/${professor.id}`, {
            nome_completo: professor.nome_completo,
            email: professor.email,
        });
        const updatedProfessor = Parsers.parseProfessor(response);

        // Auto-invalidate related caches
        await autoInvalidate.professorUpdated(professor.id.toString(), updatedProfessor);

        logger.info('Professor updated successfully', { id: professor.id });
        return updatedProfessor;
    } catch (error) {
        logger.error('Failed to update professor', error);
        throw error;
    }
}

async function deleteProfessor(id: string): Promise<void> {
    try {
        logger.info(`Deleting professor ${id}`);
        await api.delete(`/professores/delete/${id}`);

        // Auto-invalidate related caches
        await autoInvalidate.professorUpdated(id);

        logger.info('Professor deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete professor', error);
        throw error;
    }
}

function invalidateCache(professorId?: string) {
    if (professorId) {
        professorCache.clear(`professor_${professorId}`);
    } else {
        professorCache.clearAll();
    }
} 