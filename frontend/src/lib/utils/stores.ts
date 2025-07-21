import { writable } from 'svelte/store';
import type { ProblemaModel } from '$lib/interfaces/interfaces';

// Re-export cache utilities for convenience
export {
    turmasCache,
    turmaCache,
    problemasCache,
    problemaCache,
    alunosCache,
    alunoCache,
    professorCache,
    avaliacoesCache,
    cacheInvalidation,
    autoInvalidate,
    pageRefreshEvents,
    triggerPageRefresh,
    isAnyLoading
} from '$lib/utils/cache';

// Legacy compatibility - keep the old problemaStore for existing code
export const problemaStore = writable<ProblemaModel[]>([]);

export const addProblema = (problema: ProblemaModel) => {
    problemaStore.update(problemas => [...problemas, problema]);
};

export const removeProblema = (id_problema: number) => {
    problemaStore.update(problemas => problemas.filter(p => p.id_problema !== id_problema));
};

export const updateProblema = (problema: ProblemaModel) => {
    problemaStore.update(problemas => {
        const index = problemas.findIndex(p => p.id_problema === problema.id_problema);
        if (index >= 0) {
            problemas[index] = problema;
        }
        return [...problemas];
    });
}; 