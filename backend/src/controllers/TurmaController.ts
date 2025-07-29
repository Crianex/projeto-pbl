import { EndpointController, RequestType, Turma } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { MediaCalculator } from '../utils/utils';

const logger = createControllerLogger('Turma', 'Controller');

export const TurmaController: EndpointController = {
    name: 'turmas',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { data, error } = await supabase
                .from('turmas')
                .select(`
                    *,
                    professor:professores(*),
                    alunos(*)
                `);

            if (error) {
                logger.error(`Error fetching turmas: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Fetched ${data.length} turmas`);

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_turma } = req.query;

            if (!id_turma) {
                logger.error('No ID provided');
                return res.status(400).json({ error: 'No ID provided' });
            }

            logger.info(`Fetching turma ${id_turma}`);
            const { data, error } = await supabase
                .from('turmas')
                .select(`
                    *,
                    professor:professores(*),
                    alunos:alunos(*)
                `)
                .eq('id_turma', id_turma)
                .single();

            if (error) {
                logger.error(`Error fetching turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                logger.error(`Turma ${id_turma} not found`);
                return res.status(404).json({ error: 'Turma not found' });
            }

            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { nome_turma, id_professor } = req.body;
            const { data, error } = await supabase
                .from('turmas')
                .insert([{ nome_turma, id_professor }])
                .select(`
                    *,
                    professor:professores(*)
                `)
                .single();

            if (error) {
                logger.error(`Error creating turma: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id_turma } = req.query;
            const { nome_turma, id_professor, alunos } = req.body;
            const { data, error } = await supabase
                .from('turmas')
                .update({ nome_turma, id_professor })
                .eq('id_turma', id_turma)
                .select(`
                    *,
                    professor:professores(*)
                `)
                .single();


            if (error) {
                logger.error(`Error updating turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Turma not found' });
            }

            for (const aluno of alunos) {
                const { data: alunoData, error: alunoError } = await supabase
                    .from('alunos')
                    .update({ id_turma })
                    .eq('id_aluno', aluno).select("id_aluno");

                if (alunoError) {
                    logger.error(`Error updating aluno ${aluno}: ${alunoError.message}`);
                    return res.status(500).json({ error: alunoError.message });
                }

                if (!alunoData) {
                    logger.error(`Aluno ${aluno} not found`);
                    return res.status(404).json({ error: 'Aluno not found' });
                }
            }



            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_turma } = req.query;
            const { error } = await supabase
                .from('turmas')
                .delete()
                .eq('id_turma', id_turma);

            if (error) {
                logger.error(`Error deleting turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        }),

        'add-aluno': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_turma, id_aluno } = req.body;
            const { data, error } = await supabase
                .from('alunos')
                .update({ id_turma })
                .eq('id_aluno', id_aluno)
                .select(`
                    *
                `)
                .single();

            if (error) {
                logger.error(`Error adding aluno ${id_aluno} to turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'remove-aluno': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_turma, id_aluno } = req.query;

            try {
                // First, get all problems in this turma
                const { data: problemas, error: problemasError } = await supabase
                    .from('problemas')
                    .select('id_problema')
                    .eq('id_turma', id_turma);

                if (problemasError) {
                    logger.error(`Error fetching problemas for turma ${id_turma}: ${problemasError.message}`);
                    return res.status(500).json({ error: problemasError.message });
                }

                // Delete all evaluations where this student was involved in problems of this turma
                if (problemas && problemas.length > 0) {
                    const problemaIds = problemas.map(p => p.id_problema);

                    // Delete evaluations where the student was the evaluator
                    const { error: deleteEvaluatorError } = await supabase
                        .from('avaliacoes')
                        .delete()
                        .eq('id_aluno_avaliador', id_aluno)
                        .in('id_problema', problemaIds);

                    if (deleteEvaluatorError) {
                        logger.error(`Error deleting evaluations where aluno ${id_aluno} was evaluator: ${deleteEvaluatorError.message}`);
                        return res.status(500).json({ error: deleteEvaluatorError.message });
                    }

                    // Delete evaluations where the student was evaluated
                    const { error: deleteEvaluatedError } = await supabase
                        .from('avaliacoes')
                        .delete()
                        .eq('id_aluno_avaliado', id_aluno)
                        .in('id_problema', problemaIds);

                    if (deleteEvaluatedError) {
                        logger.error(`Error deleting evaluations where aluno ${id_aluno} was evaluated: ${deleteEvaluatedError.message}`);
                        return res.status(500).json({ error: deleteEvaluatedError.message });
                    }

                    logger.info(`Deleted all evaluations for aluno ${id_aluno} in problemas of turma ${id_turma}`);

                    // Update media_geral for all affected problems
                    for (const problema of problemas) {
                        const { data: remainingAvaliacoes, error: avaliacoesError } = await supabase
                            .from('avaliacoes')
                            .select('notas')
                            .eq('id_problema', problema.id_problema);

                        if (!avaliacoesError && remainingAvaliacoes) {
                            // Calculate new average if there are remaining evaluations
                            if (remainingAvaliacoes.length > 0) {
                                const notas = remainingAvaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
                                const media = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;

                                await supabase
                                    .from('problemas')
                                    .update({ media_geral: media })
                                    .eq('id_problema', problema.id_problema);
                            } else {
                                // No evaluations left, set media_geral to 0
                                await supabase
                                    .from('problemas')
                                    .update({ media_geral: 0 })
                                    .eq('id_problema', problema.id_problema);
                            }
                        }
                    }
                }

                // Finally, remove the student from the turma
                const { error } = await supabase
                    .from('alunos')
                    .update({ id_turma: null })
                    .eq('id_aluno', id_aluno);

                if (error) {
                    logger.error(`Error removing aluno ${id_aluno} from turma ${id_turma}: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully removed aluno ${id_aluno} from turma ${id_turma} and deleted all related evaluations`);
                return res.status(204).send();

            } catch (error) {
                logger.error(`Unexpected error removing aluno ${id_aluno} from turma ${id_turma}: ${error}`);
                return res.status(500).json({ error: 'Unexpected error occurred' });
            }
        })
    }
}; 