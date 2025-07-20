import { writable, derived, get } from 'svelte/store';
import type { ProblemaModel, TurmaModel, AlunoModel, AvaliacaoModel } from '$lib/interfaces/interfaces';

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
export const avaliacoesCache = createCacheStore<AvaliacaoModel[]>();

// Cache invalidation helpers
export const cacheInvalidation = {
    // Invalidate when turma is updated
    invalidateTurma: (turmaId: string) => {
        turmaCache.clear(`turma_${turmaId}`);
        turmasCache.clear('all');
    },

    // Invalidate when problema is updated
    invalidateProblema: (problemaId: string, turmaId?: string) => {
        problemaCache.clear(`problema_${problemaId}`);
        if (turmaId) {
            problemasCache.clear(`turma_${turmaId}`);
        }
    },

    // Invalidate when avaliacao is updated
    invalidateAvaliacoes: (problemaId: string) => {
        avaliacoesCache.clear(`problema_${problemaId}`);
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
    }
};

// Derived stores for loading states
export const isAnyLoading = derived(
    [turmasCache, turmaCache, problemasCache, problemaCache, alunosCache, alunoCache, avaliacoesCache],
    (stores) => {
        return stores.some(store =>
            Object.values(store).some(entry => entry.loading)
        );
    }
); 