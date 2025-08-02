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

        // Check both professor and aluno tables simultaneously to prevent race conditions
        const [professorPromise, alunoPromise] = await Promise.allSettled([
            api.get(`/professores/getByEmail?email=${encodeURIComponent(supabaseUser.email)}`),
            api.get(`/alunos/getByEmail?email=${encodeURIComponent(supabaseUser.email)}`)
        ]);

        // Check if user exists as professor (priority check)
        if (professorPromise.status === 'fulfilled') {
            logger.info('Found existing professor', { email: supabaseUser.email });
            const userProfessor = parseToProfessorModel(professorPromise.value);
            return userProfessor;
        }

        // Check if user exists as aluno
        if (alunoPromise.status === 'fulfilled') {
            logger.info('Found existing aluno', { email: supabaseUser.email });
            const userAluno = parseToAlunoModel(alunoPromise.value);
            return userAluno;
        }

        // Log any errors from the API calls for debugging
        if (professorPromise.status === 'rejected') {
            logger.warn('Error checking professor table:', professorPromise.reason);
        }
        if (alunoPromise.status === 'rejected') {
            logger.warn('Error checking aluno table:', alunoPromise.reason);
        }

        // If no user found in either table, create new aluno by default
        logger.info('Creating new aluno account', { email: supabaseUser.email });
        const newUser = await api.post('/alunos/create', {
            email: supabaseUser.email,
            nome_completo: supabaseUser.user_metadata?.nome_completo || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Novo Usuário',
            link_avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || undefined
        });

        const user = parseToAlunoModel(newUser);
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

        // Always clear local user state and redirect to login, regardless of Supabase logout result
        currentUser.set(null);
        await goto('/');
        logger.info('User logged out successfully and redirected to login');
    } catch (error) {
        logger.error('Failed to logout:', error);
        // Even if goto fails, still clear the user state and try to redirect
        currentUser.set(null);
        try {
            await goto('/');
        } catch (redirectError) {
            logger.error('Failed to redirect after logout:', redirectError);
        }
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