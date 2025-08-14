import { EndpointController, RequestType } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { Utils } from '../config/utils';

const logger = createControllerLogger('User', 'Controller');

export const UserController: EndpointController = {
    name: 'users',
    routes: {
        'getByEmail': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Allow unauthenticated access for auth flow (user might not exist yet)
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                logger.info('No authentication provided for unified user lookup - allowing for auth flow');
            }

            const { email } = req.query as { email?: string };
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            // Check in priority order: coordenadores -> professores -> alunos
            try {
                const [coordRes, profRes, alunoRes] = await Promise.all([
                    supabase.from('coordenadores').select('*').eq('email', email),
                    supabase.from('professores').select('*').eq('email', email),
                    supabase.from('alunos').select('*').eq('email', email)
                ]);

                if (coordRes.error) {
                    logger.warn(`Error checking coordenadores by email ${email}: ${coordRes.error.message}`);
                }
                if (profRes.error) {
                    logger.warn(`Error checking professores by email ${email}: ${profRes.error.message}`);
                }
                if (alunoRes.error) {
                    logger.warn(`Error checking alunos by email ${email}: ${alunoRes.error.message}`);
                }

                if (coordRes.data && coordRes.data.length > 0) {
                    return res.json({ tipo: 'coordenador', ...coordRes.data[0] });
                }
                if (profRes.data && profRes.data.length > 0) {
                    return res.json({ tipo: 'professor', ...profRes.data[0] });
                }
                if (alunoRes.data && alunoRes.data.length > 0) {
                    return res.json({ tipo: 'aluno', ...alunoRes.data[0] });
                }

                return res.status(404).json({ error: 'User not found' });
            } catch (error: any) {
                logger.error(`Unified getByEmail failed for ${email}: ${error?.message || error}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })
    }
};


