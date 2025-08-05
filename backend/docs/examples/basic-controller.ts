import { EndpointController, RequestType } from '../../src/config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../../src/config/utils';
import { supabase } from '../../src/config/supabase_wrapper';
import { createControllerLogger } from '../../src/utils/controller_logger';
import { Utils } from '../../src/config/utils';

const logger = createControllerLogger('Example', 'Controller');

export const ExampleController: EndpointController = {
    name: 'example',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Get query parameters
                const { status, limit = '10' } = req.query;

                // Build query
                let query = supabase.from('example_table').select('*');

                // Apply filters
                if (status) {
                    query = query.eq('status', status);
                }

                // Apply limit
                const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
                query = query.limit(limitNum);

                // Execute query
                const { data, error } = await query;

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully fetched ${data?.length || 0} records for user ${authUser.id}`);
                return res.json(data || []);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Get ID from params
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID is required' });
                }

                // Fetch single record
                const { data, error } = await supabase
                    .from('example_table')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    logger.error(`Database error for record ${id}: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                if (!data) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                logger.info(`Successfully fetched record ${id} for user ${authUser.id}`);
                return res.json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Get request body
                const { name, description, status = 'active' } = req.body;

                // Validation
                if (!name) {
                    return res.status(400).json({ error: 'Name is required' });
                }

                // Prepare data
                const insertData = {
                    name,
                    description: description || null,
                    status,
                    created_by: authUser.id
                };

                // Insert record
                const { data, error } = await supabase
                    .from('example_table')
                    .insert([insertData])
                    .select()
                    .single();

                if (error) {
                    logger.error(`Error creating record: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully created record ${data.id} for user ${authUser.id}`);
                return res.status(201).json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Get ID from params
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID is required' });
                }

                // Get request body
                const { name, description, status } = req.body;

                // Prepare update data
                const updateData: any = {};
                if (name !== undefined) updateData.name = name;
                if (description !== undefined) updateData.description = description;
                if (status !== undefined) updateData.status = status;

                // Update record
                const { data, error } = await supabase
                    .from('example_table')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    logger.error(`Error updating record ${id}: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                if (!data) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                logger.info(`Successfully updated record ${id} for user ${authUser.id}`);
                return res.json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Get ID from query
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ error: 'ID is required' });
                }

                // Delete record
                const { error } = await supabase
                    .from('example_table')
                    .delete()
                    .eq('id', id);

                if (error) {
                    logger.error(`Error deleting record ${id}: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully deleted record ${id} for user ${authUser.id}`);
                return res.status(204).send();
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })
    }
}; 