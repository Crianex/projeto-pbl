import type { ProfessorModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { professorCache } from "$lib/utils/cache";

export const ProfessoresService = {
    getById,
    invalidateCache,
    update,
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

    if (professorCache.isLoading(cacheKey)) {
        return new Promise((resolve) => {
            const unsubscribe = professorCache.subscribe((store) => {
                const entry = store[cacheKey];
                if (entry && !entry.loading) {
                    unsubscribe();
                    resolve(entry.data!);
                }
            });
        });
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

function invalidateCache(professorId?: string) {
    if (professorId) {
        professorCache.clear(`professor_${professorId}`);
    } else {
        professorCache.clearAll();
    }
}

function update(professor: ProfessorModel) {
    return api.put(`/professores/update/${professor.id}`, {
        nome_completo: professor.nome_completo,
        email: professor.email,
    });
} 