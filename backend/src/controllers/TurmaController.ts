import { EndpointController, RequestType, Turma } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { MediaCalculator } from '../utils/utils';
import { Utils } from '../config/utils';

const logger = createControllerLogger('Turma', 'Controller');

export const TurmaController: EndpointController = {
    name: 'turmas',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Allow both professor and aluno authentication for listing turmas
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_professor } = req.query;

            let query = supabase
                .from('turmas')
                .select(`
                    *,
                    professor:professores(*),
                    alunos(*)
                `);

            if (authUser.type === 'professor') {
                // Professors can see all turmas or filter by professor
                if (id_professor) {
                    query = query.eq('id_professor', id_professor);
                    logger.info(`Filtering turmas by professor ${id_professor}`);
                } else {
                    logger.info('Fetching all turmas (no professor filter)');
                }
            } else if (authUser.type === 'aluno') {
                // Alunos can only see turmas they belong to
                const { data: alunoData, error: alunoError } = await supabase
                    .from('alunos')
                    .select('id_turma')
                    .eq('id_aluno', authUser.id)
                    .single();

                if (alunoError) {
                    logger.error(`Error checking aluno turma: ${alunoError.message}`);
                    return res.status(500).json({ error: alunoError.message });
                }

                if (!alunoData || !alunoData.id_turma) {
                    logger.info(`Aluno ${authUser.id} not assigned to any turma`);
                    return res.json([]);
                }

                query = query.eq('id_turma', alunoData.id_turma);
                logger.info(`Fetching turma ${alunoData.id_turma} for aluno ${authUser.id}`);
            }

            const { data, error } = await query;

            if (error) {
                logger.error(`Error fetching turmas: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Fetched ${data.length} turmas for ${authUser.type} ${authUser.id}`);

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Allow both professor and aluno authentication for getting turma details
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_turma } = req.query;

            if (!id_turma) {
                logger.error('No ID provided');
                return res.status(400).json({ error: 'No ID provided' });
            }

            // If user is an aluno, check if they belong to this turma
            if (authUser.type === 'aluno') {
                const { data: alunoData, error: alunoError } = await supabase
                    .from('alunos')
                    .select('id_turma')
                    .eq('id_aluno', authUser.id)
                    .single();

                if (alunoError) {
                    logger.error(`Error checking aluno turma: ${alunoError.message}`);
                    return res.status(500).json({ error: alunoError.message });
                }

                if (!alunoData || alunoData.id_turma !== parseInt(id_turma as string)) {
                    logger.error(`Aluno ${authUser.id} not authorized to access turma ${id_turma}`);
                    return res.status(403).json({ error: 'Forbidden: You can only access your own turma' });
                }
            }

            logger.info(`Fetching turma ${id_turma} for ${authUser.type} ${authUser.id}`);
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
            // Require professor authentication for creating turmas
            const authUser = await Utils.validateProfessor(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }

            const { nome_turma, id_professor,alunos } = req.body;
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

            // Add alunos to the turma if provided
            if (alunos && Array.isArray(alunos) && alunos.length > 0) {
                logger.info(`Adding ${alunos.length} alunos to newly created turma ${data.id_turma}`);

                for (const alunoId of alunos) {
                    const { data: alunoData, error: alunoError } = await supabase
                        .from('alunos')
                        .update({ id_turma: data.id_turma })
                        .eq('id_aluno', alunoId)
                        .select("id_aluno");

                    if (alunoError) {
                        logger.error(`Error updating aluno ${alunoId}: ${alunoError.message}`);
                        return res.status(500).json({ error: alunoError.message });
                    }

                    if (!alunoData) {
                        logger.error(`Aluno ${alunoId} not found`);
                        return res.status(404).json({ error: 'Aluno not found' });
                    }
                }

                logger.info(`Successfully added ${alunos.length} alunos to turma ${data.id_turma}`);
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            // Require professor authentication for updating turmas
            const authUser = await Utils.validateProfessor(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }

            const { id_turma } = req.query;
            const { nome_turma, id_professor, alunos } = req.body;

            // First, update the turma basic info
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

            // Get all current alunos in this turma
            const { data: currentAlunos, error: currentAlunosError } = await supabase
                .from('alunos')
                .select('id_aluno')
                .eq('id_turma', id_turma);

            if (currentAlunosError) {
                logger.error(`Error fetching current alunos for turma ${id_turma}: ${currentAlunosError.message}`);
                return res.status(500).json({ error: currentAlunosError.message });
            }

            const currentAlunoIds = currentAlunos?.map(aluno => aluno.id_aluno) || [];
            const newAlunoIds = alunos || [];

            // Remove alunos that are no longer in the list
            const alunosToRemove = currentAlunoIds.filter(id => !newAlunoIds.includes(id));
            logger.info(`Starting removal process for turma ${id_turma}: ${alunosToRemove.length} alunos to remove`);

            for (const alunoId of alunosToRemove) {
                logger.info(`Processing removal of aluno ${alunoId} from turma ${id_turma}`);

                // First, get all problems in this turma
                logger.info(`Fetching problemas for turma ${id_turma}`);
                const { data: problemas, error: problemasError } = await supabase
                    .from('problemas')
                    .select('id_problema')
                    .eq('id_turma', id_turma);

                if (problemasError) {
                    logger.error(`Error fetching problemas for turma ${id_turma}: ${problemasError.message}`);
                    return res.status(500).json({ error: problemasError.message });
                }

                logger.info(`Found ${problemas?.length || 0} problemas in turma ${id_turma}`);

                // Delete all evaluations where this student was involved in problems of this turma
                if (problemas && problemas.length > 0) {
                    const problemaIds = problemas.map(p => p.id_problema);
                    logger.info(`Processing ${problemaIds.length} problemas for aluno ${alunoId}`);

                    // Delete evaluations where the student was the evaluator
                    logger.info(`Deleting evaluations where aluno ${alunoId} was evaluator`);
                    const { error: deleteEvaluatorError } = await supabase
                        .from('avaliacoes')
                        .delete()
                        .eq('id_aluno_avaliador', alunoId)
                        .in('id_problema', problemaIds);

                    if (deleteEvaluatorError) {
                        logger.error(`Error deleting evaluations where aluno ${alunoId} was evaluator: ${deleteEvaluatorError.message}`);
                        return res.status(500).json({ error: deleteEvaluatorError.message });
                    }
                    logger.info(`Successfully deleted evaluations where aluno ${alunoId} was evaluator`);

                    // Delete evaluations where the student was evaluated
                    logger.info(`Deleting evaluations where aluno ${alunoId} was evaluated`);
                    const { error: deleteEvaluatedError } = await supabase
                        .from('avaliacoes')
                        .delete()
                        .eq('id_aluno_avaliado', alunoId)
                        .in('id_problema', problemaIds);

                    if (deleteEvaluatedError) {
                        logger.error(`Error deleting evaluations where aluno ${alunoId} was evaluated: ${deleteEvaluatedError.message}`);
                        return res.status(500).json({ error: deleteEvaluatedError.message });
                    }
                    logger.info(`Successfully deleted evaluations where aluno ${alunoId} was evaluated`);

                    logger.info(`Deleted all evaluations for aluno ${alunoId} in problemas of turma ${id_turma}`);

                    // Update media_geral for all affected problems
                    logger.info(`Updating media_geral for ${problemas.length} problemas after removing aluno ${alunoId}`);
                    for (const problema of problemas) {
                        logger.info(`Processing problema ${problema.id_problema} for media_geral update`);

                        const { data: remainingAvaliacoes, error: avaliacoesError } = await supabase
                            .from('avaliacoes')
                            .select('notas')
                            .eq('id_problema', problema.id_problema);

                        if (avaliacoesError) {
                            logger.error(`Error fetching remaining avaliacoes for problema ${problema.id_problema}: ${avaliacoesError.message}`);
                            continue;
                        }

                        logger.info(`Found ${remainingAvaliacoes?.length || 0} remaining avaliacoes for problema ${problema.id_problema}`);

                        if (remainingAvaliacoes) {
                            // Calculate new sum if there are remaining evaluations
                            if (remainingAvaliacoes.length > 0) {
                                const notas = remainingAvaliacoes.map(a => MediaCalculator.calculateRawSum(a.notas));
                                const media = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;

                                logger.info(`Calculated new media_geral for problema ${problema.id_problema}: ${media} (from ${notas.length} avaliacoes)`);

                                const { error: updateError } = await supabase
                                    .from('problemas')
                                    .update({ media_geral: media })
                                    .eq('id_problema', problema.id_problema);

                                if (updateError) {
                                    logger.error(`Error updating media_geral for problema ${problema.id_problema}: ${updateError.message}`);
                                } else {
                                    logger.info(`Successfully updated media_geral for problema ${problema.id_problema} to ${media}`);
                                }
                            } else {
                                // No evaluations left, set media_geral to 0
                                logger.info(`No avaliacoes remaining for problema ${problema.id_problema}, setting media_geral to 0`);

                                const { error: updateError } = await supabase
                                    .from('problemas')
                                    .update({ media_geral: 0 })
                                    .eq('id_problema', problema.id_problema);

                                if (updateError) {
                                    logger.error(`Error setting media_geral to 0 for problema ${problema.id_problema}: ${updateError.message}`);
                                } else {
                                    logger.info(`Successfully set media_geral to 0 for problema ${problema.id_problema}`);
                                }
                            }
                        }
                    }
                } else {
                    logger.info(`No problemas found in turma ${id_turma}, skipping avaliações deletion for aluno ${alunoId}`);
                }

                // Finally, remove the student from the turma
                logger.info(`Removing aluno ${alunoId} from turma ${id_turma}`);
                const { error: removeError } = await supabase
                    .from('alunos')
                    .update({ id_turma: null })
                    .eq('id_aluno', alunoId);

                if (removeError) {
                    logger.error(`Error removing aluno ${alunoId} from turma ${id_turma}: ${removeError.message}`);
                    return res.status(500).json({ error: removeError.message });
                }

                logger.info(`Successfully removed aluno ${alunoId} from turma ${id_turma}`);
            }

            logger.info(`Completed removal process for turma ${id_turma}: ${alunosToRemove.length} alunos removed`);

            // Add new alunos to the turma
            for (const alunoId of newAlunoIds) {
                const { data: alunoData, error: alunoError } = await supabase
                    .from('alunos')
                    .update({ id_turma })
                    .eq('id_aluno', alunoId)
                    .select("id_aluno");

                if (alunoError) {
                    logger.error(`Error updating aluno ${alunoId}: ${alunoError.message}`);
                    return res.status(500).json({ error: alunoError.message });
                }

                if (!alunoData) {
                    logger.error(`Aluno ${alunoId} not found`);
                    return res.status(404).json({ error: 'Aluno not found' });
                }
            }

            logger.info(`Updated turma ${id_turma}: removed ${alunosToRemove.length} alunos, added ${newAlunoIds.length} alunos`);

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            // Require professor authentication for deleting turmas
            const authUser = await Utils.validateProfessor(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }

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
            // Require professor authentication for adding alunos to turmas
            const authUser = await Utils.validateProfessor(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }

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
            // Require professor authentication for removing alunos from turmas
            const authUser = await Utils.validateProfessor(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor authentication required' });
            }

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
                            // Calculate new sum if there are remaining evaluations
                            if (remainingAvaliacoes.length > 0) {
                                const notas = remainingAvaliacoes.map(a => MediaCalculator.calculateRawSum(a.notas));
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