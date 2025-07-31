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
    id_turma: number | null;
    link_avatar: string | null;
}


export interface Avaliacao {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    id_aluno_avaliador: number | null;
    id_aluno_avaliado: number | null;
    notas: string;
    notas_por_arquivo: string;
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
    definicao_arquivos_de_avaliacao: string;
    data_e_hora_criterios_e_arquivos: string;
    faltas_por_tag: string;
}

export interface Professor {
    id_professor: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    link_avatar: string | null;
}

export interface Turma {
    id_turma: number;
    created_at: Date;
    id_professor: number | null;
    nome_turma: string | null;
    professor: Professor | null;
    alunos: Aluno[] | null;
}


export interface ArquivoAlunoTurma {
    id_arquivo: number;
    created_at: Date;
    id_aluno: number | null;
    id_turma: number | null;
    nome_arquivo: string | null;
    link_arquivo: string | null;
}

export interface ArquivoAlunoProblema {
    id_arquivo: number;
    created_at: Date;
    id_aluno: number | null;
    id_problema: number | null;
    nome_arquivo: string | null;
    link_arquivo: string | null;
    nome_tipo: string | null;
}
