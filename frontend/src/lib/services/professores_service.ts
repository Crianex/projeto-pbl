import type { ProfessorModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/design_system/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/design_system/utils/logger";

export const ProfessoresService = {
    getById,
    list,
    create,
    update,
    delete: deleteProfessor,
};

async function getById(id: string): Promise<ProfessorModel> {
    try {
        logger.info(`Fetching professor ${id} from API`);
        const data = await api.get(`/professores/get/${id}`);
        const parsed = Parsers.parseProfessor(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch professor';
        throw error;
    }
}

async function list(): Promise<ProfessorModel[]> {
    try {
        logger.info('Fetching all professores from API');
        const data = await api.get('/professores/list');
        const parsed = Parsers.parseProfessores(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch professores';
        throw error;
    }
}

async function create(professorData: { nome_completo: string; email: string }): Promise<ProfessorModel> {
    try {
        logger.info('Creating new professor from admin', professorData);
        const response = await api.post('/professores/create-from-admin', professorData);
        const createdProfessor = Parsers.parseProfessor(response);

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

        logger.info('Professor deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete professor', error);
        throw error;
    }
} 