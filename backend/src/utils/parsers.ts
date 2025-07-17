import { Aluno, Professor, Problema, Turma } from '../config/interfaces';

/**
 * Parses raw Supabase data into strongly typed interfaces
 */

export function parseAluno(data: any): Aluno {
    return {
        id_aluno: data.id_aluno,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
}

export function parseProblema(data: any): Problema {
    return {
        id_problema: data.id_problema,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
        data_fim: data.data_fim ? new Date(data.data_fim) : null,
        nome_problema: data.nome_problema || null,
        id_turma: data.id_turma || null
    };
}

export function parseProfessor(data: any): Professor {
    return {
        id_professor: data.id_professor,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null
    };
}

export function parseTurma(data: any): Turma {
    return {
        id_turma: data.id_turma,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        id_professor: data.id_professor || null,
        nome_turma: data.nome_turma || null,
        professor: data.professores ? parseProfessor(data.professores) : null,
        alunos: data.alunos ? data.alunos.map((aluno: any) => parseAluno(aluno)) : null
    };
}



export function parseAlunos(data: any[]): Aluno[] {
    return data.map(item => parseAluno(item));
}

export function parseProblemas(data: any[]): Problema[] {
    return data.map(item => parseProblema(item));
}

export function parseProfessores(data: any[]): Professor[] {
    return data.map(item => parseProfessor(item));
}

export function parseTurmas(data: any[]): Turma[] {
    return data.map(item => parseTurma(item));
} 