import { goto } from '$app/navigation';
import { writable } from 'svelte/store';
import { supabase } from '../supabase';
import { api, APIError } from './api';
import { logger } from './logger';
import { parseToAlunoModel, parseToProfessorModel, type AlunoModel, type BaseUser, type ProfessorModel } from '$lib/interfaces/interfaces';
import { redirect } from '@sveltejs/kit';

export const currentUser = writable<BaseUser | null | undefined>(undefined);
let isInitializing = false;

// Helper function to check if there's an active Supabase session
export async function hasActiveSession(): Promise<boolean> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session !== null;
    } catch (error) {
        logger.error('Error checking session:', error);
        return false;
    }
}

export function isAluno(user: BaseUser | null): user is AlunoModel {
    console.log('isAluno', user);
    return user?.tipo === 'aluno';
}

export function isProfessor(user: BaseUser | null): user is ProfessorModel {
    console.log('isProfessor', user);
    return user?.tipo === 'professor';
}

export async function protectProfessorRoute(user: BaseUser | null) {
    if (!user || !isProfessor(user)) {
        logger.info('User is not a professor, redirecting to login');
        await redirect(303, '/login');
        return false;
    }
    return true;
}

export async function protectAlunoRoute(user: BaseUser | null) {
    if (!user || !isAluno(user)) {
        logger.info('User is not an aluno, redirecting to login');
        await redirect(303, '/login');
        return false;
    }
    return true;
}

export async function createOrGetUser(session: any): Promise<BaseUser | null> {
    try {
        const { user: supabaseUser } = session;

        if (!supabaseUser) {
            logger.error('No Supabase user found in session');
            return null;
        }

        // First, try to find existing user as professor by email
        try {
            const professorResponse = await api.get(`/professores/getByEmail?email=${encodeURIComponent(supabaseUser.email)}`);
            logger.info('Found existing professor', { email: supabaseUser.email });
            var userProfessor = parseToProfessorModel(professorResponse);
            return userProfessor;
        } catch (error) {
            if (error instanceof APIError && error.status === 404) {
                // Continue to try aluno
            } else {
                throw error;
            }
        }

        // Then try as aluno
        try {
            const alunoResponse = await api.get(`/alunos/getByEmail?email=${encodeURIComponent(supabaseUser.email)}`);
            logger.info('Found existing aluno', { email: supabaseUser.email });
            var userAluno = parseToAlunoModel(alunoResponse);
            return userAluno;
        } catch (error) {
            if (error instanceof APIError && error.status === 404) {
                // Continue to create new user
            } else {
                throw error;
            }
        }
        

        // If no user found, create new aluno by default
        logger.info('Creating new aluno account', { email: supabaseUser.email });
        const newUser = await api.post('/alunos/create', {
            email: supabaseUser.email,
            nome_completo: supabaseUser.user_metadata?.nome_completo || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Novo Usuário',
            link_avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || undefined
        });

        var user = parseToAlunoModel(newUser);

        return user;


    } catch (error) {
        logger.error('Error in createOrGetUser:', error);
        throw error;
    }
}

export async function initializeAuth() {
    if (isInitializing) {
        logger.info('Auth initialization already in progress, skipping');
        return;
    }

    try {
        isInitializing = true;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const user = await createOrGetUser(session);
            currentUser.set(user);
        } else {
            currentUser.set(null);
        }
    } catch (error) {
        logger.error('Error initializing auth:', error);
        currentUser.set(null);
    } finally {
        isInitializing = false;
    }
}

// Logout function
export async function logout() {
    try {
        logger.info('Logging out user');

        // Check if there's an active session before trying to sign out
        const hasSession = await hasActiveSession();

        if (hasSession) {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    logger.error('Error during Supabase logout (continuing anyway):', error);
                }
            } catch (error) {
                logger.error('Error during Supabase logout (continuing anyway):', error);
            }
        } else {
            logger.info('No active session found, skipping Supabase logout');
        }

        // Always clear local user state and redirect to home, regardless of Supabase logout result
        currentUser.set(null);
        await goto('/');
        logger.info('User logged out successfully and redirected to home');
    } catch (error) {
        logger.error('Failed to logout:', error);
        // Even if goto fails, still clear the user state
        currentUser.set(null);
        throw error;
    }
}

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
    logger.info('Auth state changed:', { event });

    if (isInitializing) {
        logger.info('Auth initialization in progress, skipping auth state change handler');
        return;
    }

    if (event === 'SIGNED_IN' && session) {
        try {
            const user = await createOrGetUser(session);
            currentUser.set(user);
        } catch (error) {
            logger.error('Error handling sign in:', error);
            currentUser.set(null);
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser.set(null);
    } else if (event === 'INITIAL_SESSION') {
        // Handle initial session check
        if (session) {
            try {
                const user = await createOrGetUser(session);
                currentUser.set(user);
            } catch (error) {
                logger.error('Error handling initial session:', error);
                currentUser.set(null);
            }
        } else {
            currentUser.set(null);
        }
    }
}); 