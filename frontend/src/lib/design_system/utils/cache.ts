import { writable, derived, get } from 'svelte/store';
import type { ProblemaModel, TurmaModel, AlunoModel, AvaliacaoModel, ProfessorModel } from '$lib/interfaces/interfaces';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    loading: boolean;
    error: string | null;
}

interface CacheStore<T> {
    [key: string]: CacheEntry<T>;
}

// Base cache store creator
function createCacheStore<T>() {
    const { subscribe, set, update } = writable<CacheStore<T>>({});

    return {
        subscribe,
        set,
        update,
        // Check if data is cached and fresh
        isFresh: (key: string): boolean => {
            const store = get({ subscribe });
            const entry = store[key];
            if (!entry) return false;
            return Date.now() - entry.timestamp < CACHE_DURATION;
        },
        // Get cached data if available and fresh
        getCached: (key: string): T | null => {
            const store = get({ subscribe });
            const entry = store[key];
            if (!entry || !entry.data) return null;
            if (Date.now() - entry.timestamp > CACHE_DURATION) return null;
            return entry.data;
        },
        // Set loading state
        setLoading: (key: string, loading: boolean) => {
            update(store => ({
                ...store,
                [key]: {
                    ...store[key],
                    loading,
                    error: loading ? null : store[key]?.error || null
                }
            }));
        },
        // Set data
        setData: (key: string, data: T) => {
            update(store => ({
                ...store,
                [key]: {
                    data,
                    timestamp: Date.now(),
                    loading: false,
                    error: null
                }
            }));
        },
        // Set error
        setError: (key: string, error: string) => {
            update(store => ({
                ...store,
                [key]: {
                    ...store[key],
                    loading: false,
                    error
                }
            }));
        },
        // Get loading state
        isLoading: (key: string): boolean => {
            const store = get({ subscribe });
            return store[key]?.loading || false;
        },
        // Get error state
        getError: (key: string): string | null => {
            const store = get({ subscribe });
            return store[key]?.error || null;
        },
        // Clear cache entry
        clear: (key: string) => {
            update(store => {
                const newStore = { ...store };
                delete newStore[key];
                return newStore;
            });
        },
        // Clear all cache
        clearAll: () => {
            set({});
        }
    };
}

// Create cache stores for different data types
export const turmasCache = createCacheStore<TurmaModel[]>();
export const turmaCache = createCacheStore<TurmaModel>();
export const problemasCache = createCacheStore<ProblemaModel[]>();
export const problemaCache = createCacheStore<ProblemaModel>();
export const alunosCache = createCacheStore<AlunoModel[]>();
export const alunoCache = createCacheStore<AlunoModel>();
export const professorCache = createCacheStore<ProfessorModel>();
export const avaliacoesCache = createCacheStore<AvaliacaoModel[]>();

// Enhanced cache invalidation with relationship management
export const cacheInvalidation = {
    // Invalidate when turma is created/updated/deleted
    turma: {
        created: (turma: TurmaModel) => {
            turmasCache.clear('all');
            // If this turma has a professor, they need to see the new turma in their list
        },
        updated: (turmaId: string, turma?: TurmaModel) => {
            turmaCache.clear(`turma_${turmaId}`);
            turmasCache.clear('all');
            // If turma has problemas, they might be affected
            problemasCache.clear(`turma_${turmaId}`);
        },
        deleted: (turmaId: string) => {
            turmaCache.clear(`turma_${turmaId}`);
            turmasCache.clear('all');
            // Clear all related data
            problemasCache.clear(`turma_${turmaId}`);
            // Clear any cached alunos that were in this turma
            alunosCache.clearAll();
        },
        alunoAdded: (turmaId: string) => {
            turmaCache.clear(`turma_${turmaId}`);
            turmasCache.clear('all');
        },
        alunoRemoved: (turmaId: string) => {
            turmaCache.clear(`turma_${turmaId}`);
            turmasCache.clear('all');
        }
    },

    // Invalidate when problema is created/updated/deleted
    problema: {
        created: (problema: ProblemaModel) => {
            if (problema.id_turma) {
                problemasCache.clear(`turma_${problema.id_turma}`);
            }
        },
        updated: (problemaId: string, turmaId?: string, problema?: ProblemaModel) => {
            problemaCache.clear(`problema_${problemaId}`);
            if (turmaId) {
                problemasCache.clear(`turma_${turmaId}`);
            }
            // Clear any avaliacoes for this problema as criteria might have changed
            avaliacoesCache.clear(`problema_${problemaId}`);
        },
        deleted: (problemaId: string, turmaId?: string) => {
            problemaCache.clear(`problema_${problemaId}`);
            if (turmaId) {
                problemasCache.clear(`turma_${turmaId}`);
            }
            // Clear all avaliacoes for this problema
            avaliacoesCache.clear(`problema_${problemaId}`);
        }
    },

    // Invalidate when aluno is created/updated/deleted
    aluno: {
        created: (aluno: AlunoModel) => {
            alunosCache.clearAll();
        },
        updated: (alunoId: string, aluno?: AlunoModel) => {
            alunoCache.clear(`aluno_${alunoId}`);
            alunosCache.clearAll();
            // If aluno is in a turma, invalidate that turma's cache
            if (aluno?.id_turma) {
                turmaCache.clear(`turma_${aluno.id_turma}`);
                turmasCache.clear('all');
            }
        },
        deleted: (alunoId: string, turmaId?: string) => {
            alunoCache.clear(`aluno_${alunoId}`);
            alunosCache.clearAll();
            if (turmaId) {
                turmaCache.clear(`turma_${turmaId}`);
                turmasCache.clear('all');
            }
        }
    },

    // Invalidate when professor is updated
    professor: {
        updated: (professorId: string, professor?: ProfessorModel) => {
            professorCache.clear(`professor_${professorId}`);
            // If professor teaches turmas, they might need refreshing
            turmasCache.clear('all');
        }
    },

    // Invalidate when avaliacao is created/updated/deleted
    avaliacao: {
        created: (problemaId: string) => {
            avaliacoesCache.clear(`problema_${problemaId}`);
        },
        updated: (problemaId: string) => {
            avaliacoesCache.clear(`problema_${problemaId}`);
        },
        deleted: (problemaId: string) => {
            avaliacoesCache.clear(`problema_${problemaId}`);
        }
    },

    // Legacy compatibility - keep the old functions
    invalidateTurma: (turmaId: string) => {
        cacheInvalidation.turma.updated(turmaId);
    },

    invalidateProblema: (problemaId: string, turmaId?: string) => {
        cacheInvalidation.problema.updated(problemaId, turmaId);
    },

    invalidateAvaliacoes: (problemaId: string) => {
        cacheInvalidation.avaliacao.updated(problemaId);
    },

    // Clear all caches
    clearAll: () => {
        turmasCache.clearAll();
        turmaCache.clearAll();
        problemasCache.clearAll();
        problemaCache.clearAll();
        alunosCache.clearAll();
        alunoCache.clearAll();
        avaliacoesCache.clearAll();
        professorCache.clearAll();
    }
};

// Derived stores for loading states
export const isAnyLoading = derived(
    [turmasCache, turmaCache, problemasCache, problemaCache, alunosCache, alunoCache, professorCache, avaliacoesCache],
    (stores) => {
        return stores.some(store =>
            Object.values(store).some(entry => entry.loading)
        );
    }
);

// Auto-invalidation wrapper for common operations
export const autoInvalidate = {
    // Turma operations
    async turmaCreated(turma: TurmaModel) {
        cacheInvalidation.turma.created(turma);
    },
    async turmaUpdated(turmaId: string, turma?: TurmaModel) {
        cacheInvalidation.turma.updated(turmaId, turma);
    },
    async turmaDeleted(turmaId: string) {
        cacheInvalidation.turma.deleted(turmaId);
    },
    async turmaAlunoAdded(turmaId: string) {
        cacheInvalidation.turma.alunoAdded(turmaId);
    },
    async turmaAlunoRemoved(turmaId: string) {
        cacheInvalidation.turma.alunoRemoved(turmaId);
    },

    // Problema operations
    async problemaCreated(problema: ProblemaModel) {
        cacheInvalidation.problema.created(problema);
    },
    async problemaUpdated(problemaId: string, turmaId?: string, problema?: ProblemaModel) {
        cacheInvalidation.problema.updated(problemaId, turmaId, problema);
    },
    async problemaDeleted(problemaId: string, turmaId?: string) {
        cacheInvalidation.problema.deleted(problemaId, turmaId);
    },

    // Aluno operations
    async alunoCreated(aluno: AlunoModel) {
        cacheInvalidation.aluno.created(aluno);
    },
    async alunoUpdated(alunoId: string, aluno?: AlunoModel) {
        cacheInvalidation.aluno.updated(alunoId, aluno);
    },
    async alunoDeleted(alunoId: string, turmaId?: string) {
        cacheInvalidation.aluno.deleted(alunoId, turmaId);
    },

    // Professor operations
    async professorUpdated(professorId: string, professor?: ProfessorModel) {
        cacheInvalidation.professor.updated(professorId, professor);
    },

    // Avaliacao operations
    async avaliacaoCreated(problemaId: string) {
        cacheInvalidation.avaliacao.created(problemaId);
    },
    async avaliacaoUpdated(problemaId: string) {
        cacheInvalidation.avaliacao.updated(problemaId);
    },
    async avaliacaoDeleted(problemaId: string) {
        cacheInvalidation.avaliacao.deleted(problemaId);
    }
};

// Page refresh event system for components to listen to
export const pageRefreshEvents = writable<{
    type: 'turmas' | 'problemas' | 'alunos' | 'avaliacoes';
    timestamp: number;
} | null>(null);

// Trigger page refresh events
export const triggerPageRefresh = {
    turmas: () => {
        pageRefreshEvents.set({ type: 'turmas', timestamp: Date.now() });
    },
    problemas: () => {
        pageRefreshEvents.set({ type: 'problemas', timestamp: Date.now() });
    },
    alunos: () => {
        pageRefreshEvents.set({ type: 'alunos', timestamp: Date.now() });
    },
    avaliacoes: () => {
        pageRefreshEvents.set({ type: 'avaliacoes', timestamp: Date.now() });
    }
}; 