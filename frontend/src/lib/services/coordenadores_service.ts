import type { CoordenadorModel } from "$lib/interfaces/interfaces";
import { api } from "$lib/utils/api";
import { Parsers } from "$lib/interfaces/parsers";
import { logger } from "$lib/utils/logger";

export const CoordenadoresService = {
    getById,
    update,
    list,
    checkEmail,
};

async function getById(id: string): Promise<CoordenadorModel> {
    try {
        logger.info(`Fetching coordenador ${id} from API`);
        const data = await api.get(`/coordenadores/get?id_coordenador=${id}`);
        const parsed = Parsers.parseCoordenador(data);
        return parsed;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch coordenador';
        throw error;
    }
}

async function update(coordenador: CoordenadorModel): Promise<CoordenadorModel> {
    try {
        logger.info(`Updating coordenador ${coordenador.id}`, coordenador);
        const response = await api.put(`/coordenadores/update?id_coordenador=${coordenador.id}`, {
            nome_completo: coordenador.nome_completo,
            email: coordenador.email,
        });
        const updatedCoordenador = Parsers.parseCoordenador(response);
        logger.info('Coordenador updated successfully', { id: coordenador.id });
        return updatedCoordenador;
    } catch (error) {
        logger.error('Failed to update coordenador', error);
        throw error;
    }
}

async function list(): Promise<CoordenadorModel[]> {
    try {
        logger.info('Fetching all coordenadores');
        const data = await api.get('/coordenadores/list');
        return Parsers.parseCoordenadores(data);
    } catch (error) {
        logger.error('Failed to fetch coordenadores', error);
        throw error;
    }
}

async function checkEmail(email: string): Promise<{ exists: boolean; email: string }> {
    try {
        logger.info(`Checking if email exists: ${email}`);
        const response = await api.get(`/coordenadores/checkEmail?email=${encodeURIComponent(email)}`);
        return response;
    } catch (error) {
        logger.error('Failed to check email', error);
        throw error;
    }
} 