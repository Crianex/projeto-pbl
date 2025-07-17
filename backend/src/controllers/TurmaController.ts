import { EndpointController, RequestType, Turma } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';

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
                    alunos:alunos_por_turma(alunos(*))
                `);

            if (error) {
                logger.error(`Error fetching turmas: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('turmas')
                .select(`
                    *,
                    professor:professores(*),
                    alunos:alunos_por_turma(alunos(*))
                `)
                .eq('id_turma', id)
                .single();

            if (error) {
                logger.error(`Error fetching turma ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
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
            const { id } = req.params;
            const { nome_turma, id_professor } = req.body;
            const { data, error } = await supabase
                .from('turmas')
                .update({ nome_turma, id_professor })
                .eq('id_turma', id)
                .select(`
                    *,
                    professor:professores(*)
                `)
                .single();

            if (error) {
                logger.error(`Error updating turma ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Turma not found' });
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id } = req.params;
            const { error } = await supabase
                .from('turmas')
                .delete()
                .eq('id_turma', id);

            if (error) {
                logger.error(`Error deleting turma ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        }),

        'add-aluno': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_turma, id_aluno } = req.body;
            const { data, error } = await supabase
                .from('alunos_por_turma')
                .insert([{ id_turma, id_aluno }])
                .select(`
                    *,
                    aluno:alunos(*)
                `)
                .single();

            if (error) {
                logger.error(`Error adding aluno ${id_aluno} to turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'remove-aluno': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_turma, id_aluno } = req.params;
            const { error } = await supabase
                .from('alunos_por_turma')
                .delete()
                .eq('id_turma', id_turma)
                .eq('id_aluno', id_aluno);

            if (error) {
                logger.error(`Error removing aluno ${id_aluno} from turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        })
    }
}; 