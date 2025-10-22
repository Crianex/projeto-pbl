import type { ProblemaModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/design_system/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/design_system/utils/logger";

export const ProblemasService = {
    getByTurma,
    getById,
    getByIdWithOptions,
    create,
    update,
    delete: deleteProblema,
};

async function getByTurma(turmaId: string): Promise<ProblemaModel[]> {
    try {
        logger.info(`Fetching problemas for turma ${turmaId} from API`);
        const data = await api.get(`/problemas/list-by-turma?id_turma=${turmaId}`);
        const parsed = Parsers.parseProblemas(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch problemas';
        throw error;
    }
}

async function getById(id: string): Promise<ProblemaModel> {
    try {
        logger.info(`Fetching problema ${id} from API`);
        const data = await api.get(`/problemas/get?id_problema=${id}`);
        const parsed = Parsers.parseProblema(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch problema';
        throw error;
    }
}



// Optional parameters to control expansion in backend (default matches previous behavior)
async function getByIdWithOptions(id: string, options?: { include_avaliacoes?: boolean }): Promise<ProblemaModel> {
    try {
        const includeAvaliacoes = options?.include_avaliacoes;
        const query = includeAvaliacoes === undefined
            ? `/problemas/get?id_problema=${id}`
            : `/problemas/get?id_problema=${id}&include_avaliacoes=${includeAvaliacoes}`;
        logger.info(`Fetching problema ${id} from API with options`, options || {});
        const data = await api.get(query);
        const parsed = Parsers.parseProblema(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch problema with options';
        throw error;
    }
}

async function create(problemaData: {
    nome_problema: string;
    id_turma: number;
    criterios: string;
    definicao_arquivos_de_avaliacao?: string;
    data_e_hora_criterios_e_arquivos?: string;
}): Promise<ProblemaModel> {
    try {
        logger.info('Creating new problema', problemaData);
        const response = await api.post('/problemas/create', problemaData);
        const createdProblema = Parsers.parseProblema(response);

        logger.info('Problema created successfully', { id: createdProblema.id_problema });
        return createdProblema;
    } catch (error) {
        logger.error('Failed to create problema', error);
        throw error;
    }
}

async function update(id: string, problemaData: {
    nome_problema: string;
    id_turma: number;
    criterios: string;
    definicao_arquivos_de_avaliacao?: string;
    data_e_hora_criterios_e_arquivos?: string;
    faltas_por_tag?: string;
}): Promise<ProblemaModel> {
    try {
        logger.info(`Updating problema ${id}`, problemaData);
        const response = await api.put(`/problemas/update?id_problema=${id}`, problemaData);
        const updatedProblema = Parsers.parseProblema(response);

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

        logger.info('Problema deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete problema', error);
        throw error;
    }
} 