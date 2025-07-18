




export interface ProblemaModel {
    id_problema: number;
    created_at: Date;
    data_inicio: Date | null;
    data_fim: Date | null;
    nome_problema: string | null;
    id_turma: number | null;
    media_geral: number | null;
    turma: TurmaModel | null;
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
}

export interface AlunoModel extends BaseUser {
    tipo: 'aluno';
}

export interface ProfessorModel extends BaseUser {
    tipo: 'professor';
}

// Parser functions to convert API responses to our models
export function parseToAlunoModel(data: any): AlunoModel {
    return {
        tipo: 'aluno',
        id: data.id_aluno,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
}

export function parseToProfessorModel(data: any): ProfessorModel {
    return {
        tipo: 'professor',
        id: data.id_professor,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
} 