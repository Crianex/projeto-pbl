import { protectAlunoRoute } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
    await protectAlunoRoute((data as any)?.user);
    return data;
}; 