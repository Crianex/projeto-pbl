import { EndpointController, RequestType, Avaliacao } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('Avaliacao', 'Controller');

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

export const AvaliacaoController: EndpointController = {
    name: 'avaliacoes',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { data, error } = await supabase
                .from('avaliacoes')
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `);

            if (error) {
                logger.error(`Error fetching avaliacoes: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;

            // check if id is present
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { data, error } = await supabase
                .from('avaliacoes')
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .eq('id_avaliacao', id)
                .single();

            if (error) {
                logger.error(`Error fetching avaliacao ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Avaliacao not found' });
            }

            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_problema, id_aluno_avaliador, id_aluno_avaliado, notas } = req.body;

            // check if data is present
            if (!id_problema || !id_aluno_avaliador || !id_aluno_avaliado || !notas) {
                return res.status(400).json({ error: 'ID do problema, ID do avaliador, ID do avaliado e notas são obrigatórios' });
            }

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
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .single();

            if (error) {
                logger.error(`Error creating avaliacao: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            // Update problema media_geral
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

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id } = req.params;

            // check if id is present
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { notas } = req.body;
            
            const { data, error } = await supabase
                .from('avaliacoes')
                .update({ notas })
                .eq('id_avaliacao', id)
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .single();

            if (error) {
                logger.error(`Error updating avaliacao ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Avaliacao not found' });
            }

            // Update problema media_geral
            const { data: avaliacoes, error: avaliacoesError } = await supabase
                .from('avaliacoes')
                .select('notas')
                .eq('id_problema', data.id_problema);

            if (!avaliacoesError && avaliacoes) {
                const notas = avaliacoes.map(a => calculateAverageNota(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', data.id_problema);
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id } = req.params;

            // check if id is present
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            // Get the problema_id before deleting
            const { data: avaliacao } = await supabase
                .from('avaliacoes')
                .select('id_problema')
                .eq('id_avaliacao', id)
                .single();

            const { error } = await supabase
                .from('avaliacoes')
                .delete()
                .eq('id_avaliacao', id);

            if (error) {
                logger.error(`Error deleting avaliacao ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            // Update problema media_geral if we found the avaliacao
            if (avaliacao) {
                const { data: avaliacoes, error: avaliacoesError } = await supabase
                    .from('avaliacoes')
                    .select('notas')
                    .eq('id_problema', avaliacao.id_problema);

                if (!avaliacoesError && avaliacoes && avaliacoes.length > 0) {
                    const notas = avaliacoes.map(a => calculateAverageNota(a.notas));
                    const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                    await supabase
                        .from('problemas')
                        .update({ media_geral: media })
                        .eq('id_problema', avaliacao.id_problema);
                } else if (!avaliacoesError) {
                    // If no avaliacoes left, set media_geral to 0
                    await supabase
                        .from('problemas')
                        .update({ media_geral: 0 })
                        .eq('id_problema', avaliacao.id_problema);
                }
            }

            return res.status(204).send();
        })
    }
}; 