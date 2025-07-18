import { EndpointController, RequestType, Aluno } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('Aluno', 'Controller');

export const AlunoController: EndpointController = {
    name: 'alunos',
    routes: {
        'search': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { query, exclude_turma_id } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            var queryStatement = supabase.from('alunos').select('*');

            queryStatement = queryStatement.is('id_turma', null);

            queryStatement = queryStatement.ilike('nome_completo', `%${query}%`);
            // First get all alunos that match the search query
            const { data: matchingAlunos, error: searchError } = await queryStatement;


            if (searchError) {
                logger.error(`Error searching alunos: ${searchError.message}`);
                return res.status(500).json({ error: searchError.message });
            }

            // Return only the first 10 results
            return res.json(matchingAlunos?.slice(0, 10));
        }),

        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { data, error } = await supabase
                .from('alunos')
                .select('*');

            if (error) {
                logger.error(`Error fetching alunos: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_aluno } = req.query;

            // check if id_aluno is present
            if (!id_aluno) {
                return res.status(400).json({ error: 'id_aluno is required' });
            }

            const { data, error } = await supabase
                .from('alunos')
                .select('*')
                .eq('id_aluno', id_aluno);

            if (error) {
                logger.error(`Error fetching aluno ${id_aluno}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Aluno not found' });
            }

            return res.json(data);
        }),

        'getByEmail': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { email } = req.query;



            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const { data, error } = await supabase
                .from('alunos')
                .select('*')
                .eq('email', email);

            if (error) {
                logger.error(`Error fetching aluno by email ${email}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Aluno not found' });
            }

            return res.json(data[0]);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { nome_completo, email } = req.body;

            // check if data is present
            if (!nome_completo || !email) {
                return res.status(400).json({ error: 'Nome completo e email são obrigatórios' });
            }

            // First check if user already exists with this email
            const { data: existingUser, error: searchError } = await supabase
                .from('alunos')
                .select('*')
                .eq('email', email)
                .single();

            if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
                logger.error(`Error checking existing aluno: ${searchError.message}`);
                return res.status(500).json({ error: searchError.message });
            }

            if (existingUser) {
                logger.info(`Aluno with email ${email} already exists`);
                return res.json(existingUser);
            }

            // Create new user if doesn't exist
            const { data, error } = await supabase
                .from('alunos')
                .insert([{
                    nome_completo,
                    email
                }])
                .select()
                .single();

            if (error) {
                logger.error(`Error creating aluno: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id_aluno } = req.query;
            const { nome_completo, email } = req.body;
            const { data, error } = await supabase
                .from('alunos')
                .update({ nome_completo, email })
                .eq('id_aluno', id_aluno)
                .select()
                .single();

            if (error) {
                logger.error(`Error updating aluno ${id_aluno}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Aluno not found' });
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_aluno } = req.query;
            const { error } = await supabase
                .from('alunos')
                .delete()
                .eq('id_aluno', id_aluno);

            if (error) {
                logger.error(`Error deleting aluno ${id_aluno}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        })
    }
}; 