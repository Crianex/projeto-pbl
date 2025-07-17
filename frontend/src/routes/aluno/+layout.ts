import { currentUser, protectAlunoRoute } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    await protectAlunoRoute(get(currentUser));
    return {};
}; 