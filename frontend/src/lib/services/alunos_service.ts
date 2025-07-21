import type { AlunoModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";
import { alunoCache } from "$lib/utils/cache";

export const AlunosService = {
    getById,
    invalidateCache,
    update,
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

function invalidateCache(alunoId?: string) {
    if (alunoId) {
        alunoCache.clear(`aluno_${alunoId}`);
    } else {
        alunoCache.clearAll();
    }
} 

function update(aluno: AlunoModel) {
    return api.put(`/alunos/update?id_aluno=${aluno.id}`, {
        nome_completo: aluno.nome_completo,
        email: aluno.email,
    });
}