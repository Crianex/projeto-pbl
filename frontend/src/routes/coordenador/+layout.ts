import { currentUser } from '$lib/utils/auth';
import { protectCoordenadorRoute } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    const user = get(currentUser);

    // Check if user is a coordenador
    const isAuthorized = await protectCoordenadorRoute(user);

    if (!isAuthorized) {
        throw redirect(303, '/login');
    }

    return {
        user
    };
}; 