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

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;
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
                return res.status(404).json({ error: 'Problema not found' });
            }

            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { nome_problema, data_inicio, data_fim, id_turma, criterios } = req.body;
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
                logger.error(`Error creating problema: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id } = req.params;
            const { nome_problema, data_inicio, data_fim, id_turma, criterios, media_geral } = req.body;
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
                logger.error(`Error updating problema ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Problema not found' });
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id } = req.params;
            const { error } = await supabase
                .from('problemas')
                .delete()
                .eq('id_problema', id);

            if (error) {
                logger.error(`Error deleting problema ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        }),

        'add-avaliacao': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_problema, id_aluno_avaliador, id_aluno_avaliado, notas } = req.body;
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
                logger.error(`Error adding avaliacao to problema ${id_problema}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            // Update media_geral
            const { data: avaliacoes, error: avaliacoesError } = await supabase
                .from('avaliacoes')
                .select('notas')
                .eq('id_problema', id_problema);

            if (!avaliacoesError && avaliacoes) {
                const notas = avaliacoes.map(a => calculateAverageNota(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', id_problema);
            }

            return res.status(201).json(data);
        }),

        'get-avaliacoes': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;
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

            return res.json(data);
        })
    }
}; 