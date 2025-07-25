import { type AlunoModel, type ProfessorModel, type ProblemaModel, type TurmaModel, parseToProfessorModel, parseToAlunoModel, type CriteriosGroup, type Criterio, type AvaliacaoModel, type DefinicaoArquivoDeAvaliacao, type DataEHoraDefinition } from '$lib/interfaces/interfaces';

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

    console.log(`parsing problema, definicao_arquivos_de_avaliacao: ${data.definicao_arquivos_de_avaliacao}`);

    var definicao_arquivos_de_avaliacao_json = data.definicao_arquivos_de_avaliacao ? JSON.parse(data.definicao_arquivos_de_avaliacao) : [];

    // Ensure it's an array before mapping
    var definicao_arquivos_de_avaliacao = Array.isArray(definicao_arquivos_de_avaliacao_json)
        ? definicao_arquivos_de_avaliacao_json.map((arquivo: any) => parseDefinicaoArquivoDeAvaliacao(arquivo))
        : [];

    var data_e_hora_criterios_e_arquivos_json = data.data_e_hora_criterios_e_arquivos ? JSON.parse(data.data_e_hora_criterios_e_arquivos) : {};

    // since it is a dictionary, we need to parse it
    var data_e_hora_criterios_e_arquivos: { [tag: string]: DataEHoraDefinition } = {};

    Object.keys(data_e_hora_criterios_e_arquivos_json).forEach((key: string) => {
        data_e_hora_criterios_e_arquivos[key] = {
            data_e_hora_inicio: new Date(data_e_hora_criterios_e_arquivos_json[key].data_e_hora_inicio),
            data_e_hora_fim: new Date(data_e_hora_criterios_e_arquivos_json[key].data_e_hora_fim)
        };
    });

    return {
        id_problema: data.id_problema,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_problema: data.nome_problema || null,
        id_turma: data.id_turma || null,
        media_geral: data.media_geral || null,
        turma: data.turma ? parseTurma(data.turma) : null,
        criterios: data.criterios ? parseCriterios(data.criterios) : {},
        definicao_arquivos_de_avaliacao: definicao_arquivos_de_avaliacao,
        data_e_hora_criterios_e_arquivos: data_e_hora_criterios_e_arquivos
    };
}

function parseDefinicaoArquivoDeAvaliacao(data: any): DefinicaoArquivoDeAvaliacao {
    return {
        nome_tipo: data.nome_tipo || null,
        descricao_tipo: data.descricao_tipo || null,
        tipos_de_arquivos_aceitos: data.tipos_de_arquivos_aceitos || []
    }
}

function parseProfessor(data: any): ProfessorModel {
    return parseToProfessorModel(data);
}

function parseTurma(data: any): TurmaModel {
    return {
        id_turma: data.id_turma,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        id_professor: data.id_professor || null,
        nome_turma: data.nome_turma || null,
        professor: data.professor ? parseProfessor(data.professor) : null,
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
        aluno_avaliador: data.avaliador ? parseAluno(data.avaliador) : null,
        aluno_avaliado: data.avaliado ? parseAluno(data.avaliado) : null,
        notas: data.notas ? JSON.parse(data.notas) : {},
        id_professor: data.id_professor || null
    };
}

function parseAvaliacoes(data: any[]): AvaliacaoModel[] {
    return data.map(item => parseAvaliacao(item));
}