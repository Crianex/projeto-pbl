import type { AlunoModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";

export const AlunosService = {
    getById,
    create,
    update,
    delete: deleteAluno,
    searchPaginated,
    checkEmail,
};

async function getById(id: string): Promise<AlunoModel> {
    try {
        logger.info(`Fetching aluno ${id} from API`);
        const data = await api.get(`/alunos/get?id_aluno=${id}`);
        const parsed = Parsers.parseAluno(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch aluno';
        throw error;
    }
}

async function create(alunoData: { nome_completo: string; email: string }): Promise<AlunoModel> {
    try {
        logger.info('Creating new aluno', alunoData);
        const response = await api.post('/alunos/create', alunoData);
        const createdAluno = Parsers.parseAluno(response);

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

        logger.info('Aluno deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete aluno', error);
        throw error;
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

async function checkEmail(email: string): Promise<{ exists: boolean; email: string }> {
    try {
        logger.info(`Checking if email exists: ${email}`);
        const response = await api.get(`/alunos/checkEmail?email=${encodeURIComponent(email)}`);
        return response;
    } catch (error) {
        logger.error('Failed to check email', error);
        throw error;
    }
}