import { currentUser, protectProfessorRoute } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    await protectProfessorRoute(get(currentUser));
    return {};
}; 