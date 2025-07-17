import { goto } from '$app/navigation';
import type { AlunoModel, ProfessorModel } from '../interfaces/user';

export type User = AlunoModel | ProfessorModel;

export function isAluno(user: User | null): user is AlunoModel {
    return user?.tipo === 'aluno';
}

export function isProfessor(user: User | null): user is ProfessorModel {
    return user?.tipo === 'professor';
}

export async function protectProfessorRoute(user: User | null) {
    if (!user || !isProfessor(user)) {
        await goto('/');
        return false;
    }
    return true;
}

export async function protectAlunoRoute(user: User | null) {
    if (!user || !isAluno(user)) {
        await goto('/');
        return false;
    }
    return true;
} 