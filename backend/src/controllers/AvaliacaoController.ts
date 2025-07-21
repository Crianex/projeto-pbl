import { EndpointController, RequestType, Avaliacao } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { MediaCalculator } from '../utils/utils';

const logger = createControllerLogger('Avaliacao', 'Controller');

export const AvaliacaoController: EndpointController = {
    name: 'avaliacoes',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_problema, id_aluno } = req.query;

            var query = supabase
                .from('avaliacoes')
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `);

            if (id_problema) {
                query = query.eq('id_problema', id_problema);
            }

            if (id_aluno) {
                query = query.eq('id_aluno_avaliador', id_aluno);
            }

            const { data, error } = await query;

            if (error) {
                logger.error(`Error fetching avaliacoes: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_avaliacao } = req.params;

            // check if id_avaliacao is present
            if (!id_avaliacao) {
                return res.status(400).json({ error: 'id_avaliacao is required' });
            }

            const { data, error } = await supabase
                .from('avaliacoes')
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .eq('id_avaliacao', id_avaliacao)
                .single();

            if (error) {
                logger.error(`Error fetching avaliacao ${id_avaliacao}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Avaliacao not found' });
            }

            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_problema, id_aluno_avaliador, id_aluno_avaliado, notas, id_professor } = req.body;

            // Must provide either id_aluno_avaliador or id_professor, but not both
            if (!id_problema || !id_aluno_avaliado || !notas) {
                return res.status(400).json({ error: 'ID do problema, ID do avaliado e notas são obrigatórios' });
            }
            if ((id_aluno_avaliador && id_professor) || (!id_aluno_avaliador && !id_professor)) {
                return res.status(400).json({ error: 'Envie apenas um: id_aluno_avaliador OU id_professor' });
            }

            const insertObj: any = {
                id_problema,
                id_aluno_avaliado,
                notas: notas || '{}',
            };
            if (id_aluno_avaliador) insertObj.id_aluno_avaliador = id_aluno_avaliador;
            if (id_professor) insertObj.id_professor = id_professor;

            const { data, error } = await supabase
                .from('avaliacoes')
                .insert([insertObj])
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
                const notas = avaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', id_problema);
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id_avaliacao } = req.params;

            // check if id_avaliacao is present
            if (!id_avaliacao) {
                return res.status(400).json({ error: 'id_avaliacao is required' });
            }

            const { notas, id_aluno_avaliador, id_professor } = req.body;

            // Must provide either id_aluno_avaliador or id_professor, but not both
            if ((id_aluno_avaliador && id_professor) || (!id_aluno_avaliador && !id_professor)) {
                return res.status(400).json({ error: 'Envie apenas um: id_aluno_avaliador OU id_professor' });
            }

            const updateObj: any = { notas };
            if (id_aluno_avaliador) updateObj.id_aluno_avaliador = id_aluno_avaliador;
            if (id_professor) updateObj.id_professor = id_professor;

            const { data, error } = await supabase
                .from('avaliacoes')
                .update(updateObj)
                .eq('id_avaliacao', id_avaliacao)
                .select(`
                    *,
                    problema:problemas(*),
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .single();

            if (error) {
                logger.error(`Error updating avaliacao ${id_avaliacao}: ${error.message}`);
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
                const notas = avaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', data.id_problema);
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_avaliacao } = req.params;

            // check if id_avaliacao is present
            if (!id_avaliacao) {
                return res.status(400).json({ error: 'id_avaliacao is required' });
            }

            // Get the problema_id before deleting
            const { data: avaliacao } = await supabase
                .from('avaliacoes')
                .select('id_problema')
                .eq('id_avaliacao', id_avaliacao)
                .single();

            const { error } = await supabase
                .from('avaliacoes')
                .delete()
                .eq('id_avaliacao', id_avaliacao);

            if (error) {
                logger.error(`Error deleting avaliacao ${id_avaliacao}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            // Update problema media_geral if we found the avaliacao
            if (avaliacao) {
                const { data: avaliacoes, error: avaliacoesError } = await supabase
                    .from('avaliacoes')
                    .select('notas')
                    .eq('id_problema', avaliacao.id_problema);

                if (!avaliacoesError && avaliacoes && avaliacoes.length > 0) {
                    const notas = avaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
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