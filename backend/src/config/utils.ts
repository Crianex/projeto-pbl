import logger from "../utils/logger";
import { SupabaseWrapper } from "./supabase_wrapper";
import { createControllerLogger } from "../utils/controller_logger";
import { Request } from "express";

export class Pair<K, V> {
    key: K;
    value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

// logger for utils
const utilsLogger = createControllerLogger("Utils", "Utils");

export interface AuthUser {
    id: number;
    email: string;
    nome_completo: string;
    type: 'aluno' | 'professor';
}

export const Utils = {
    /**
     * Validates the Supabase auth token and returns the user data
     */
    validateAuthToken: async (req: Request): Promise<{ user: any; email: string } | null> => {
        const headers = req.headers;
        const authorization = headers["authorization"];

        utilsLogger.info(`Validating auth token`);

        if (!authorization) {
            utilsLogger.error("Authorization header not found");
            return null;
        }

        if (typeof authorization !== "string") {
            utilsLogger.error(`Authorization header is not a string: ${authorization}`);
            return null;
        }

        let token = authorization;
        if (typeof token === "string" && token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        try {
            const { data, error } = await SupabaseWrapper.get().auth.getUser(token);
            if (error) {
                utilsLogger.error(`Error validating auth token: ${error.message}`);
                return null;
            }

            if (!data.user || !data.user.email) {
                utilsLogger.error("No user or email found in auth token");
                return null;
            }

            return { user: data.user, email: data.user.email };
        } catch (error) {
            utilsLogger.error(`Unexpected error validating auth token: ${error}`);
            return null;
        }
    },

    /**
     * Validates that the user is an aluno and returns the aluno data
     */
    validateAluno: async (req: Request): Promise<AuthUser | null> => {
        const authResult = await Utils.validateAuthToken(req);
        if (!authResult) {
            return null;
        }

        const { email } = authResult;

        try {
            // Check if user exists as aluno
            const { data: aluno, error } = await SupabaseWrapper.get()
                .from('alunos')
                .select('id_aluno, email, nome_completo')
                .eq('email', email)
                .single();

            if (error) {
                utilsLogger.error(`Error checking aluno: ${error.message}`);
                return null;
            }

            if (!aluno) {
                utilsLogger.error(`Aluno not found with email: ${email}`);
                return null;
            }

            return {
                id: aluno.id_aluno,
                email: aluno.email,
                nome_completo: aluno.nome_completo,
                type: 'aluno'
            };
        } catch (error) {
            utilsLogger.error(`Unexpected error validating aluno: ${error}`);
            return null;
        }
    },

    /**
     * Validates that the user is a professor and returns the professor data
     */
    validateProfessor: async (req: Request): Promise<AuthUser | null> => {
        const authResult = await Utils.validateAuthToken(req);
        if (!authResult) {
            return null;
        }

        const { email } = authResult;

        try {
            // Check if user exists as professor
            const { data: professor, error } = await SupabaseWrapper.get()
                .from('professores')
                .select('id_professor, email, nome_completo')
                .eq('email', email)
                .single();

            if (error) {
                utilsLogger.error(`Error checking professor: ${error.message}`);
                return null;
            }

            if (!professor) {
                utilsLogger.error(`Professor not found with email: ${email}`);
                return null;
            }

            return {
                id: professor.id_professor,
                email: professor.email,
                nome_completo: professor.nome_completo,
                type: 'professor'
            };
        } catch (error) {
            utilsLogger.error(`Unexpected error validating professor: ${error}`);
            return null;
        }
    },

    /**
     * Validates that the user is either an aluno or professor
     */
    validateUser: async (req: Request): Promise<AuthUser | null> => {
        // First try as professor
        const professor = await Utils.validateProfessor(req);
        if (professor) {
            return professor;
        }

        // Then try as aluno
        const aluno = await Utils.validateAluno(req);
        if (aluno) {
            return aluno;
        }

        return null;
    },

    /**
     * Middleware function to require aluno authentication
     */
    requireAlunoAuth: (req: Request, res: any, next: any) => {
        Utils.validateAluno(req).then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized: Valid aluno authentication required' });
            }
            req.user = user;
            next();
        }).catch(error => {
            utilsLogger.error(`Error in requireAlunoAuth: ${error}`);
            return res.status(500).json({ error: 'Internal server error during authentication' });
        });
    },

    /**
     * Middleware function to require professor authentication
     */
    requireProfessorAuth: (req: Request, res: any, next: any) => {
        Utils.validateProfessor(req).then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }
            req.user = user;
            next();
        }).catch(error => {
            utilsLogger.error(`Error in requireProfessorAuth: ${error}`);
            return res.status(500).json({ error: 'Internal server error during authentication' });
        });
    },

    /**
     * Middleware function to require any user authentication (aluno or professor)
     */
    requireAuth: (req: Request, res: any, next: any) => {
        Utils.validateUser(req).then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }
            req.user = user;
            next();
        }).catch(error => {
            utilsLogger.error(`Error in requireAuth: ${error}`);
            return res.status(500).json({ error: 'Internal server error during authentication' });
        });
    }
}