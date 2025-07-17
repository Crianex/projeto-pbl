import { protectProfessorRoute } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
    await protectProfessorRoute((data as any)?.user);
    return data;
}; 