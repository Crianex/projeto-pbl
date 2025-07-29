



// DB interfaces

export interface AlunoDB {
    id_aluno: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    id_turma: number | null;
    link_avatar: string | null;
}


export interface AvaliacaoDB {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    id_aluno_avaliador: number | null;
    id_aluno_avaliado: number | null;
    notas: string;
    id_professor: number | null; 
}

export interface ProblemaDB {
    id_problema: number;
    created_at: Date;
    nome_problema: string | null;
    id_turma: number | null;
    media_geral: number | null;
    criterios: string;
    definicao_arquivos_de_avaliacao: string;
    faltas_por_tag: string;
}

export interface ProfessorDB {
    id_professor: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    link_avatar: string | null;
}

export interface TurmaDB {
    id_turma: number;
    created_at: Date;
    id_professor: number | null;
    nome_turma: string | null;
    professor: ProfessorDB | null;
    alunos: AlunoDB[] | null;
}


// Models
export interface DefinicaoArquivoDeAvaliacao {
    nome_tipo: string | undefined;
    descricao_tipo: string | undefined;
    tipos_de_arquivos_aceitos: string[];
}

// Used for per-tag open/close date and time
export interface DataEHoraDefinition {
    data_e_hora_inicio: Date;
    data_e_hora_fim: Date;
}

export interface ProblemaModel {
    id_problema: number;
    created_at: Date;
    nome_problema: string | null;
    id_turma: number | null;
    media_geral: number | null;
    turma: TurmaModel | null;
    criterios: CriteriosGroup;
    definicao_arquivos_de_avaliacao: DefinicaoArquivoDeAvaliacao[];
    // For each criterios tag, stores open/close date/time
    data_e_hora_criterios_e_arquivos: {
        [tag: string]: DataEHoraDefinition;
    };
    faltas_por_tag: {
        [tag: string]: {
            [id_aluno: number]: boolean;
        }
    }
}

export interface TurmaModel {
    id_turma: number;
    created_at: Date;
    id_professor: number | null;
    nome_turma: string | null;
    professor: ProfessorModel | null;
    alunos: AlunoModel[] | null;
}

export interface BaseUser {
    id: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    tipo: 'aluno' | 'professor';
    link_avatar: string | null;
}

export interface Criterio {
    nome_criterio: string;
    descricao_criterio: string;
    nota_maxima: number;
}

export interface CriteriosGroup {
    [tag: string]: Criterio[];
}

export interface AlunoModel extends BaseUser {
    tipo: 'aluno';
    id_turma: number | null;
}

export interface ProfessorModel extends BaseUser {
    tipo: 'professor';
}



export interface AvaliacaoNota {
    [tag: string]: { [criterio: string]: number };
}

export interface AvaliacaoModel {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    aluno_avaliador: AlunoModel | null;
    aluno_avaliado: AlunoModel | null;
    notas: AvaliacaoNota;
    id_professor?: number | null; // NEW: track professor evaluations
}



// Parser functions to convert API responses to our models
export function parseToAlunoModel(data: any): AlunoModel {
    //console.log(`Parsing aluno model: ${JSON.stringify(data)}`);
    return {
        tipo: 'aluno',
        id: data.id_aluno,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null,
        id_turma: data.id_turma || null,
        link_avatar: data.link_avatar || null
    };
}

export function parseToProfessorModel(data: any): ProfessorModel {
    return {
        tipo: 'professor',
        id: data.id_professor,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null,
        link_avatar: data.link_avatar || null
    };
} 