import type { AlunoDB, AlunoModel, AvaliacaoDB, AvaliacaoModel, AvaliacaoNota, ProblemaDB, TurmaDB } from "$lib/interfaces/interfaces";
import { Parsers } from "$lib/interfaces/parsers";
import { api } from "$lib/utils/api";

export const AvaliacoesService = {
    getAvaliacoes,
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
            aluno_avaliador: alunosPorID.get(avaliacao.id_aluno_avaliador!)!,
            aluno_avaliado: alunosPorID.get(avaliacao.id_aluno_avaliado!)!,
            notas: JSON.parse(avaliacao.notas) as AvaliacaoNota
        }
    });

    return avaliacoes;
}

