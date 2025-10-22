import type { AlunoDB, AlunoModel, AvaliacaoDB, AvaliacaoModel, AvaliacaoNota, ProblemaDB, TurmaDB } from "$lib/interfaces/interfaces";
import { Parsers, parseNotasPorArquivo } from "$lib/interfaces/parsers";
import { api } from "$lib/design_system/utils/api";
import { logger } from "$lib/design_system/utils/logger";

export const AvaliacoesService = {
    getAvaliacoes,
    getByProblema,
    getByProblemaForAvaliador,
    getByProblemaForAvaliado,
    create,
    update,
    delete: deleteAvaliacao,
}

async function getAvaliacoes(id_problema: number): Promise<AvaliacaoModel[]> {
    const response: AvaliacaoDB[] = await api.get(`/problemas/get-avaliacoes?id_problema=${id_problema}`);

    const problema: ProblemaDB = await api.get(`/problemas/get?id_problema=${id_problema}`);

    const turma: TurmaDB = await api.get(`/turmas/get?id_turma=${problema.id_turma}`);

    const alunosPorID = new Map<number, AlunoModel>(turma.alunos!.map((aluno: AlunoDB) => [aluno.id_aluno, Parsers.parseAluno(aluno)]));

    const avaliacoes: AvaliacaoModel[] = response.map((avaliacao: AvaliacaoDB) => {
        return {
            id_avaliacao: avaliacao.id_avaliacao,
            created_at: new Date(avaliacao.created_at),
            id_problema: avaliacao.id_problema,
            aluno_avaliador: avaliacao.id_aluno_avaliador ? alunosPorID.get(avaliacao.id_aluno_avaliador)! : null,
            aluno_avaliado: alunosPorID.get(avaliacao.id_aluno_avaliado!)!,
            notas: JSON.parse(avaliacao.notas) as AvaliacaoNota,
            id_professor: avaliacao.id_professor || null,
            notas_por_arquivo: parseNotasPorArquivo(JSON.parse(avaliacao.notas_por_arquivo))
        }
    });

    return avaliacoes;
}

async function getByProblema(problemaId: string): Promise<AvaliacaoModel[]> {
    try {
        logger.info(`Fetching avaliacoes for problema ${problemaId} from API`);
        const data = await api.get(`/avaliacoes/list?id_problema=${problemaId}`);
        // parse data to AvaliacaoModel[]
        const parsedData = data.map((avaliacao: AvaliacaoDB) =>
            Parsers.parseAvaliacao(avaliacao)
        );
        return parsedData;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch avaliacoes';
        throw error;
    }
}

// Get evaluations for a specific problema filtered by evaluator (aluno_avaliador)
async function getByProblemaForAvaliador(problemaId: number, avaliadorId: number): Promise<AvaliacaoModel[]> {
    try {
        logger.info(`Fetching avaliacoes for problema ${problemaId} and avaliador ${avaliadorId}`);
        const data = await api.get(`/avaliacoes/list?id_problema=${problemaId}&id_aluno=${avaliadorId}`);
        return Parsers.parseAvaliacoes(data);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch filtered avaliacoes';
        throw error;
    }
}

// Get evaluations for a specific problema filtered by evaluated student (aluno_avaliado)
async function getByProblemaForAvaliado(problemaId: number, avaliadoId: number): Promise<AvaliacaoModel[]> {
    try {
        logger.info(`Fetching avaliacoes for problema ${problemaId} and avaliado ${avaliadoId}`);
        const data = await api.get(`/avaliacoes/list?id_problema=${problemaId}&id_aluno_avaliado=${avaliadoId}`);
        return Parsers.parseAvaliacoes(data);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch filtered avaliacoes';
        throw error;
    }
}

async function create(avaliacaoData: {
    id_problema: number;
    id_aluno_avaliador?: number;
    id_professor?: number;
    id_aluno_avaliado: number;
    notas: string;
}): Promise<void> {
    try {
        logger.info('Creating new avaliacao', avaliacaoData);

        if (avaliacaoData.id_professor) {
            // Professor evaluation
            await api.post('/avaliacoes/create', avaliacaoData);
        } else {
            // Student evaluation
            await api.post('/problemas/add-avaliacao', avaliacaoData);
        }

        logger.info('Avaliacao created successfully', { problemaId: avaliacaoData.id_problema });
    } catch (error) {
        logger.error('Failed to create avaliacao', error);
        throw error;
    }
}

async function update(id: string, avaliacaoData: {
    id_problema: number;
    notas: string;
}): Promise<void> {
    try {
        logger.info(`Updating avaliacao ${id}`, avaliacaoData);
        await api.put(`/avaliacoes/update?id_avaliacao=${id}`, avaliacaoData);

        logger.info('Avaliacao updated successfully', { id });
    } catch (error) {
        logger.error('Failed to update avaliacao', error);
        throw error;
    }
}

async function deleteAvaliacao(id: string, problemaId: string): Promise<void> {
    try {
        logger.info(`Deleting avaliacao ${id}`);
        await api.delete(`/avaliacoes/delete?id_avaliacao=${id}`);

        logger.info('Avaliacao deleted successfully', { id });
    } catch (error) {
        logger.error('Failed to delete avaliacao', error);
        throw error;
    }
}

