import { currentUser, protectProfessorRoute } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
    if (get(currentUser)?.tipo == "coordenador") {
        redirect(302, "/coordenador/turmas");
    }
    return {};
}; 