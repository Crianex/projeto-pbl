import { EndpointController, RequestType, Coordenador } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { Utils } from '../config/utils';

const logger = createControllerLogger('Coordenador', 'Controller');

export const CoordenadorController: EndpointController = {
    name: 'coordenadores',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Require authentication for listing coordenadores
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { data, error } = await supabase
                .from('coordenadores')
                .select('*');

            if (error) {
                logger.error(`Error fetching coordenadores: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Require authentication for getting coordenador details
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_coordenador } = req.query;

            // check if id_coordenador is present
            if (!id_coordenador) {
                return res.status(400).json({ error: 'id_coordenador is required' });
            }

            const { data, error } = await supabase
                .from('coordenadores')
                .select('*')
                .eq('id_coordenador', id_coordenador);

            if (error) {
                logger.error(`Error fetching coordenador ${id_coordenador}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Coordenador not found' });
            }

            return res.json(data[0]);
        }),

        'getByEmail': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Allow unauthenticated access for user lookup during auth flow
            // This is needed because users don't exist yet when they first sign up
            const authUser = await Utils.validateUser(req);

            // If authentication fails, we still allow the request to proceed
            // This is specifically for user lookup during the auth flow
            if (!authUser) {
                logger.info('No authentication provided for user lookup - allowing for auth flow');
            }

            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const { data, error } = await supabase
                .from('coordenadores')
                .select('*')
                .eq('email', email);

            if (error) {
                logger.error(`Error fetching coordenador by email ${email}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Coordenador not found' });
            }

            return res.json(data[0]);
        }),

        'checkEmail': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Require authentication for checking email
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const { data, error } = await supabase
                .from('coordenadores')
                .select('id_coordenador, email')
                .eq('email', email);

            if (error) {
                logger.error(`Error checking email ${email}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json({
                exists: data.length > 0,
                email: email
            });
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            // Require authentication for updating coordenadores
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_coordenador } = req.query;
            const { nome_completo, email } = req.body;
            const { data, error } = await supabase
                .from('coordenadores')
                .update({ nome_completo, email })
                .eq('id_coordenador', id_coordenador)
                .select()
                .single();

            if (error) {
                logger.error(`Error updating coordenador ${id_coordenador}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Coordenador not found' });
            }

            return res.json(data);
        }),

        'uploadAvatar': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            // Require authentication for uploading avatar
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_coordenador } = req.query;

            if (!id_coordenador) {
                return res.status(400).json({ error: 'id_coordenador is required' });
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
                const fileName = `coordenadores/avatar_${id_coordenador}_${Date.now()}.${fileExtension}`;

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
                    .from('coordenadores')
                    .update({ link_avatar: urlData.publicUrl })
                    .eq('id_coordenador', id_coordenador)
                    .select()
                    .single();

                if (updateError) {
                    logger.error(`Error updating coordenador avatar ${id_coordenador}: ${updateError.message}`);
                    return res.status(500).json({ error: updateError.message });
                }

                return res.json({
                    success: true,
                    avatar_url: urlData.publicUrl,
                    coordenador: data
                });

            } catch (error) {
                logger.error(`Error uploading avatar for coordenador ${id_coordenador}: ${error}`);
                return res.status(500).json({ error: 'Error uploading avatar' });
            }
        })
    }
};
