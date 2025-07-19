import { type AlunoModel, type ProfessorModel, type ProblemaModel, type TurmaModel, parseToProfessorModel, parseToAlunoModel, type CriteriosGroup, type Criterio, type AvaliacaoModel } from '$lib/interfaces/interfaces';

/**
 * Parses raw Supabase data into strongly typed interfaces
 */

export const Parsers = {
    parseAluno,
    parseProblema,
    parseProfessor,
    parseTurma,
    parseAlunos,
    parseProblemas,
    parseProfessores,
    parseTurmas,
    parseCriterios,
    parseAvaliacao,
    parseAvaliacoes,
}

function parseAluno(data: any): AlunoModel {
    return parseToAlunoModel(data);
}

function parseProblema(data: any): ProblemaModel {
    return {
        id_problema: data.id_problema,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
        data_fim: data.data_fim ? new Date(data.data_fim) : null,
        nome_problema: data.nome_problema || null,
        id_turma: data.id_turma || null,
        media_geral: data.media_geral || null,
        turma: data.turma ? parseTurma(data.turma) : null,
        criterios: data.criterios ? parseCriterios(data.criterios) : {}
    };
}

function parseProfessor(data: any): ProfessorModel {
    return parseToProfessorModel(data);
}

function parseTurma(data: any): TurmaModel {
    //console.log(`Parsing turma: ${JSON.stringify(data)}`);
    return {
        id_turma: data.id_turma,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        id_professor: data.id_professor || null,
        nome_turma: data.nome_turma || null,
        professor: data.professores ? parseProfessor(data.professores) : null,
        alunos: data.alunos ? data.alunos.map((aluno: any) => parseAluno(aluno)) : null
    };
}



function parseAlunos(data: any[]): AlunoModel[] {
    return data.map(item => parseAluno(item));
}

function parseProblemas(data: any[]): ProblemaModel[] {
    return data.map(item => parseProblema(item));
}

function parseProfessores(data: any[]): ProfessorModel[] {
    return data.map(item => parseProfessor(item));
}

function parseTurmas(data: any[]): TurmaModel[] {
    return data.map(item => parseTurma(item));
}

function parseCriterios(criteriosString: string): CriteriosGroup {
    var criterios = JSON.parse(criteriosString);
    var object: {
        [key: string]: Criterio[]
    } = {};
    Object.keys(criterios).forEach((key: string) => {
        object[key] = criterios[key].map((criterio: any) => ({
            nome_criterio: criterio.nome_criterio,
            descricao_criterio: criterio.descricao_criterio,
            nota_maxima: criterio.nota_maxima
        } as Criterio));
    });
    return object;
}

function parseAvaliacao(data: any): AvaliacaoModel {
    return {
        id_avaliacao: data.id_avaliacao,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        id_problema: data.id_problema || null,
        aluno_avaliador: data.aluno_avaliador ? parseAluno(data.aluno_avaliador) : null,
        aluno_avaliado: data.aluno_avaliado ? parseAluno(data.aluno_avaliado) : null,
        notas: data.notas ? JSON.parse(data.notas) : {}
    };
}

function parseAvaliacoes(data: any[]): AvaliacaoModel[] {
    return data.map(item => parseAvaliacao(item));
}