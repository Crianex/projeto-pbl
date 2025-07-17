export interface BaseUser {
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
}

export interface AlunoModel extends BaseUser {
    tipo: 'aluno';
    id_aluno: number;
}

export interface ProfessorModel extends BaseUser {
    tipo: 'professor';
    id_professor: number;
}

// Parser functions to convert API responses to our models
export function parseToAlunoModel(data: any): AlunoModel {
    return {
        tipo: 'aluno',
        id_aluno: data.id_aluno,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
}

export function parseToProfessorModel(data: any): ProfessorModel {
    return {
        tipo: 'professor',
        id_professor: data.id_professor,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
} 