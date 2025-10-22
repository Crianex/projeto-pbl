import type { TurmaModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/design_system/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/design_system/utils/logger";

export const TurmasService = {
    getAll,
    getById,
    create,
    update,
    delete: deleteTurma,
    addAluno,
    removeAluno,
};

async function getAll(professorId: number | null): Promise<TurmaModel[]> {
    try {
        logger.info(`Fetching turmas ${professorId ? `for professor ${professorId}` : 'for all turmas'} from API`);

        const url = professorId
            ? `/turmas/list?id_professor=${professorId}`
            : '/turmas/list';

        const data = await api.get(url);
        const parsed = Parsers.parseTurmas(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch turmas';
        throw error;
    }
}

async function getById(id: string): Promise<TurmaModel> {
    try {
        logger.info(`Fetching turma ${id} from API`);
        const data = await api.get(`/turmas/get?id_turma=${id}`);
        const parsed = Parsers.parseTurma(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch turma';
        throw error;
    }
}

async function create(turmaData: { nome_turma: string; id_professor: number; alunos?: number[] }): Promise<TurmaModel> {
    try {
        logger.info('Creating new turma', turmaData);
        const response = await api.post('/turmas/create', turmaData);
        const createdTurma = Parsers.parseTurma(response);

        logger.info('Turma created successfully', { id: createdTurma.id_turma });
        return createdTurma;
    } catch (error) {
        logger.error('Failed to create turma', error);
        throw error;
    }
}

async function update(id: string, turmaData: { nome_turma: string; alunos?: number[] }): Promise<TurmaModel> {
    try {
        logger.info(`Updating turma ${id}`, turmaData);
        const response = await api.put(`/turmas/update?id_turma=${id}`, turmaData);
        const updatedTurma = Parsers.parseTurma(response);

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

        logger.info('Aluno removed from turma successfully', { turmaId, alunoId });
    } catch (error) {
        logger.error('Failed to remove aluno from turma', error);
        throw error;
    }
} 