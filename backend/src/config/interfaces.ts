import { Pair } from "./utils";
import { Request, Response } from 'express';

export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export interface EndpointController {
    name: string;
    routes: {
        [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response | void>>
    };
}

export interface Aluno {
    id_aluno: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
}

export interface AlunoPorTurma {
    id_aluno_por_turma: number;
    created_at: Date;
    id_turma: number | null;
    id_aluno: number | null;
}

export interface Avaliacao {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    id_aluno_avaliador: number | null;
    id_aluno_avaliado: number | null;
    notas: string;
}

export interface Problema {
    id_problema: number;
    created_at: Date;
    data_inicio: Date | null;
    data_fim: Date | null;
    nome_problema: string | null;
    id_turma: number | null;
    media_geral: number | null;
    criterios: string;
}

export interface ProblemaPorTurma {
    id_problema_por_turma: number;
    created_at: Date;
    id_turma: number | null;
    id_problema: number | null;
}

export interface Professor {
    id_professor: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
}

export interface Turma {
    id_turma: number;
    created_at: Date;
    id_professor: number | null;
    nome_turma: string | null;
    professor: Professor | null;
    alunos: Aluno[] | null;
}


