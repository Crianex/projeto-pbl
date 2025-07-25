import { EndpointController, RequestType, Professor } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('Professor', 'Controller');

export const ProfessorController: EndpointController = {
    name: 'professores',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { data, error } = await supabase
                .from('professores')
                .select('*');

            if (error) {
                logger.error(`Error fetching professores: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_professor } = req.params;
            const { data, error } = await supabase
                .from('professores')
                .select('*')
                .eq('id_professor', id_professor);

            if (error) {
                logger.error(`Error fetching professor ${id_professor}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Professor not found' });
            }

            return res.json(data[0]);
        }),

        'getByEmail': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const { data, error } = await supabase
                .from('professores')
                .select('*')
                .eq('email', email);

            if (error) {
                logger.error(`Error fetching professor by email ${email}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Professor not found' });
            }

            return res.json(data[0]);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { nome_completo, email, id_professor } = req.body;

            // First check if user already exists with this email
            const { data: existingUser, error: searchError } = await supabase
                .from('professores')
                .select('*')
                .eq('email', email);

            if (searchError) {
                logger.error(`Error checking existing professor: ${searchError.message}`);
                return res.status(500).json({ error: searchError.message });
            }

            if (existingUser && existingUser.length > 0) {
                logger.info(`Professor with email ${email} already exists`);
                return res.json(existingUser[0]);
            }

            // Create new user if doesn't exist
            const { data, error } = await supabase
                .from('professores')
                .insert([{
                    id_professor,
                    nome_completo,
                    email
                }])
                .select();

            if (error) {
                logger.error(`Error creating professor: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data[0]);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id_professor } = req.params;
            const { nome_completo, email } = req.body;
            const { data, error } = await supabase
                .from('professores')
                .update({ nome_completo, email })
                .eq('id_professor', id_professor)
                .select();

            if (error) {
                logger.error(`Error updating professor ${id_professor}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Professor not found' });
            }

            return res.json(data[0]);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_professor } = req.params;
            const { error } = await supabase
                .from('professores')
                .delete()
                .eq('id_professor', id_professor);

            if (error) {
                logger.error(`Error deleting professor ${id_professor}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        }),

        'uploadAvatar': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_professor } = req.query;
            
            if (!id_professor) {
                return res.status(400).json({ error: 'id_professor is required' });
            }

            if (!req.files || !req.files.avatar) {
                return res.status(400).json({ error: 'Avatar file is required' });
            }

            const avatarFile = req.files.avatar as any;
            
            // Validate file type
            if (!avatarFile.mimetype.startsWith('image/')) {
                return res.status(400).json({ error: 'File must be an image' });
            }

            // Validate file size (max 5MB)
            if (avatarFile.size > 5 * 1024 * 1024) {
                return res.status(400).json({ error: 'File size must be less than 5MB' });
            }

            try {
                // Generate unique filename
                const fileExtension = avatarFile.name.split('.').pop();
                const fileName = `professores/avatar_${id_professor}_${Date.now()}.${fileExtension}`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile.data, {
                        contentType: avatarFile.mimetype,
                        upsert: true
                    });

                if (uploadError) {
                    logger.error(`Error uploading to Supabase storage: ${uploadError.message}`);
                    return res.status(500).json({ error: 'Error uploading avatar to storage' });
                }

                // Generate private URL with infinite expiration
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                // Update database with avatar link
                const { data, error: updateError } = await supabase
                    .from('professores')
                    .update({ link_avatar: urlData.publicUrl })
                    .eq('id_professor', id_professor)
                    .select()
                    .single();

                if (updateError) {
                    logger.error(`Error updating professor avatar ${id_professor}: ${updateError.message}`);
                    return res.status(500).json({ error: updateError.message });
                }

                return res.json({
                    success: true,
                    avatar_url: urlData.publicUrl,
                    professor: data
                });

            } catch (error) {
                logger.error(`Error uploading avatar for professor ${id_professor}: ${error}`);
                return res.status(500).json({ error: 'Error uploading avatar' });
            }
        })
    }
}; 