import { EndpointController, RequestType, Problema } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('Problema', 'Controller');

interface NotasObject {
    [key: string]: number;
}

function isValidNotasObject(obj: any): obj is NotasObject {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.entries(obj).every(([key, value]) =>
        typeof key === 'string' && typeof value === 'number'
    );
}

function calculateAverageNota(notasString: string): number {
    try {
        const notasObj = JSON.parse(notasString);
        if (!isValidNotasObject(notasObj)) return 0;
        const values = Object.values(notasObj);
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    } catch {
        return 0;
    }
}

export const ProblemaController: EndpointController = {
    name: 'problemas',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            logger.info('Fetching all problemas');

            const { data, error } = await supabase
                .from('problemas')
                .select(`
                    *,
                    turma:turmas(*)
                `);

            if (error) {
                logger.error(`Error fetching problemas: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully fetched ${data?.length || 0} problemas`);
            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;
            if (!id) {
                logger.error('No id provided');
                return res.status(400).json({ error: 'No id provided' });
            }
            logger.info(`Fetching problema with id: ${id}`);

            const { data, error } = await supabase
                .from('problemas')
                .select(`
                    *,
                    turma:turmas(*),
                    avaliacoes:avaliacoes(*)
                `)
                .eq('id_problema', id)
                .single();

            if (error) {
                logger.error(`Error fetching problema ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                logger.warn(`Problema with id ${id} not found`);
                return res.status(404).json({ error: 'Problema not found' });
            }

            logger.info(`Successfully fetched problema ${id}`);
            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { nome_problema, data_inicio, data_fim, id_turma, criterios } = req.body;
            if (!nome_problema || !data_inicio || !data_fim || !id_turma || !criterios) {
                logger.error('Missing required fields');
                return res.status(400).json({ error: 'Missing required fields' });
            }
            logger.info(`Creating new problema: ${nome_problema} for turma ${id_turma}`);

            const { data, error } = await supabase
                .from('problemas')
                .insert([{
                    nome_problema,
                    data_inicio,
                    data_fim,
                    id_turma,
                    criterios: criterios || '{}',
                    media_geral: 0
                }])
                .select(`
                    *,
                    turma:turmas(*)
                `)
                .single();

            if (error) {
                logger.error(`Error creating problema: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully created problema with id: ${data?.id_problema}`);
            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id } = req.params;
            if (!id) {
                logger.error('No id provided');
                return res.status(400).json({ error: 'No id provided' });
            }
            const { nome_problema, data_inicio, data_fim, id_turma, criterios, media_geral } = req.body;
            logger.info(`Updating problema ${id} with new data: ${JSON.stringify(req.body)}`);

            const { data, error } = await supabase
                .from('problemas')
                .update({
                    nome_problema,
                    data_inicio,
                    data_fim,
                    id_turma,
                    criterios,
                    media_geral
                })
                .eq('id_problema', id)
                .select(`
                    *,
                    turma:turmas(*)
                `)
                .single();

            if (error) {
                logger.error(`Error updating problema ${id}: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                logger.warn(`Attempted to update non-existent problema ${id}`);
                return res.status(404).json({ error: 'Problema not found' });
            }

            logger.info(`Successfully updated problema ${id}`);
            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id } = req.params;
            if (!id) {
                logger.error('No id provided');
                return res.status(400).json({ error: 'No id provided' });
            }
            logger.info(`Attempting to delete problema ${id}`);

            const { error } = await supabase
                .from('problemas')
                .delete()
                .eq('id_problema', id);

            if (error) {
                logger.error(`Error deleting problema ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully deleted problema ${id}`);
            return res.status(204).send();
        }),

        'add-avaliacao': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_problema, id_aluno_avaliador, id_aluno_avaliado, notas } = req.body;
            if (!id_problema || !id_aluno_avaliador || !id_aluno_avaliado || !notas) {
                logger.error('Missing required fields');
                return res.status(400).json({ error: 'Missing required fields' });
            }
            logger.info(`Adding avaliacao for problema ${id_problema}: avaliador ${id_aluno_avaliador} -> avaliado ${id_aluno_avaliado}`);

            const { data, error } = await supabase
                .from('avaliacoes')
                .insert([{
                    id_problema,
                    id_aluno_avaliador,
                    id_aluno_avaliado,
                    notas: notas || '{}'
                }])
                .select(`
                    *,
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .single();

            if (error) {
                logger.error(`Error adding avaliacao to problema ${id_problema}: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully added avaliacao for problema ${id_problema}. Updating media_geral...`);

            // Update media_geral
            const { data: avaliacoes, error: avaliacoesError } = await supabase
                .from('avaliacoes')
                .select('notas')
                .eq('id_problema', id_problema);

            if (avaliacoesError) {
                logger.error(`Error fetching avaliacoes for media calculation: ${avaliacoesError.message}`);
            }

            if (!avaliacoesError && avaliacoes) {
                const notas = avaliacoes.map(a => calculateAverageNota(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                logger.info(`Calculated new media_geral for problema ${id_problema}: ${media}`);

                const { error: updateError } = await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', id_problema);

                if (updateError) {
                    logger.error(`Error updating media_geral: ${updateError.message}`);
                } else {
                    logger.info(`Successfully updated media_geral for problema ${id_problema}`);
                }
            }

            return res.status(201).json(data);
        }),

        'get-avaliacoes': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;
            if (!id) {
                logger.error('No id provided');
                return res.status(400).json({ error: 'No id provided' });
            }
            logger.info(`Fetching avaliacoes for problema ${id}`);

            const { data, error } = await supabase
                .from('avaliacoes')
                .select(`
                    *,
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .eq('id_problema', id);

            if (error) {
                logger.error(`Error fetching avaliacoes for problema ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully fetched ${data?.length || 0} avaliacoes for problema ${id}`);
            return res.json(data);
        })
    }
}; 