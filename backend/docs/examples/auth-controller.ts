import { EndpointController, RequestType } from '../../src/config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../../src/config/utils';
import { supabase } from '../../src/config/supabase_wrapper';
import { createControllerLogger } from '../../src/utils/controller_logger';
import { Utils } from '../../src/config/utils';

const logger = createControllerLogger('AuthExample', 'Controller');

export const AuthExampleController: EndpointController = {
    name: 'auth-example',
    routes: {
        // Public endpoint - no authentication required
        'public': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                logger.info('Public endpoint accessed');
                return res.json({ message: 'This is a public endpoint' });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Any authenticated user
        'authenticated': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require any authenticated user
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                logger.info(`Authenticated user ${authUser.id} (${authUser.type}) accessed endpoint`);
                return res.json({
                    message: 'Authenticated endpoint',
                    user: {
                        id: authUser.id,
                        email: authUser.email,
                        type: authUser.type
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Professor-only endpoint
        'professor-only': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require professor authentication
                const professor = await Utils.validateProfessor(req);
                if (!professor) {
                    return res.status(401).json({ error: 'Professor access required' });
                }

                logger.info(`Professor ${professor.id} accessed professor-only endpoint`);
                return res.json({
                    message: 'Professor-only endpoint',
                    professor: {
                        id: professor.id,
                        email: professor.email,
                        nome_completo: professor.nome_completo
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Student-only endpoint
        'student-only': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require student authentication
                const aluno = await Utils.validateAluno(req);
                if (!aluno) {
                    return res.status(401).json({ error: 'Student access required' });
                }

                logger.info(`Student ${aluno.id} accessed student-only endpoint`);
                return res.json({
                    message: 'Student-only endpoint',
                    student: {
                        id: aluno.id,
                        email: aluno.email,
                        nome_completo: aluno.nome_completo
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Coordinator-only endpoint
        'coordinator-only': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require coordinator authentication
                const coordenador = await Utils.validateCoordenador(req);
                if (!coordenador) {
                    return res.status(401).json({ error: 'Coordinator access required' });
                }

                logger.info(`Coordinator ${coordenador.id} accessed coordinator-only endpoint`);
                return res.json({
                    message: 'Coordinator-only endpoint',
                    coordinator: {
                        id: coordenador.id,
                        email: coordenador.email
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Role-based access control
        'role-based': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require any authenticated user
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                // Check specific permissions based on user type
                let allowedActions: string[] = [];
                let userData: any = {};

                switch (authUser.type) {
                    case 'aluno':
                        allowedActions = ['view_own_data', 'submit_evaluations'];
                        userData = {
                            id: authUser.id,
                            email: authUser.email,
                            nome_completo: authUser.nome_completo,
                            type: 'student'
                        };
                        break;
                    case 'professor':
                        allowedActions = ['view_all_data', 'manage_classes', 'generate_reports'];
                        userData = {
                            id: authUser.id,
                            email: authUser.email,
                            nome_completo: authUser.nome_completo,
                            type: 'professor'
                        };
                        break;
                    case 'coordenador':
                        allowedActions = ['view_all_data', 'manage_users', 'system_admin'];
                        userData = {
                            id: authUser.id,
                            email: authUser.email,
                            type: 'coordinator'
                        };
                        break;
                    default:
                        return res.status(403).json({ error: 'Unknown user type' });
                }

                logger.info(`User ${authUser.id} (${authUser.type}) accessed role-based endpoint`);
                return res.json({
                    message: 'Role-based endpoint',
                    user: userData,
                    allowedActions
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Resource-based access control
        'resource-access': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Require any authenticated user
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                // Get resource ID from params
                const { resourceId } = req.params;
                if (!resourceId) {
                    return res.status(400).json({ error: 'Resource ID is required' });
                }

                // Fetch resource from database
                const { data: resource, error } = await supabase
                    .from('resources')
                    .select('*')
                    .eq('id', resourceId)
                    .single();

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                if (!resource) {
                    return res.status(404).json({ error: 'Resource not found' });
                }

                // Check if user can access this resource
                let canAccess = false;
                let accessLevel = 'none';

                switch (authUser.type) {
                    case 'coordenador':
                        // Coordinators can access all resources
                        canAccess = true;
                        accessLevel = 'admin';
                        break;
                    case 'professor':
                        // Professors can access resources in their classes
                        if (resource.professor_id === authUser.id) {
                            canAccess = true;
                            accessLevel = 'owner';
                        } else if (resource.is_public) {
                            canAccess = true;
                            accessLevel = 'viewer';
                        }
                        break;
                    case 'aluno':
                        // Students can access resources in their classes
                        if (resource.student_id === authUser.id) {
                            canAccess = true;
                            accessLevel = 'owner';
                        } else if (resource.is_public) {
                            canAccess = true;
                            accessLevel = 'viewer';
                        }
                        break;
                }

                if (!canAccess) {
                    logger.warn(`User ${authUser.id} attempted unauthorized access to resource ${resourceId}`);
                    return res.status(403).json({ error: 'Access denied' });
                }

                logger.info(`User ${authUser.id} accessed resource ${resourceId} with level ${accessLevel}`);
                return res.json({
                    message: 'Resource access granted',
                    resource: {
                        id: resource.id,
                        name: resource.name,
                        accessLevel
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Multi-role endpoint
        'multi-role': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Allow multiple user types
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                // Check if user type is allowed
                const allowedTypes = ['professor', 'coordenador'];
                if (!allowedTypes.includes(authUser.type)) {
                    logger.warn(`User ${authUser.id} (${authUser.type}) attempted access to professor/coordinator endpoint`);
                    return res.status(403).json({ error: 'Professor or coordinator access required' });
                }

                logger.info(`User ${authUser.id} (${authUser.type}) accessed multi-role endpoint`);
                return res.json({
                    message: 'Multi-role endpoint',
                    user: {
                        id: authUser.id,
                        email: authUser.email,
                        type: authUser.type
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })
    }
}; 