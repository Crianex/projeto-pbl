import { createClient } from '@supabase/supabase-js'
import { supabase } from './config/supabase_wrapper'
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from "dotenv";
import { Utils } from './config/utils';
import { EndpointController, RequestType } from './config/interfaces';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from "cors";
import logger from './utils/logger';
import path from 'path';

// Import controllers
import { AlunoController } from './controllers/AlunoController';
import { ProfessorController } from './controllers/ProfessorController';
import { TurmaController } from './controllers/TurmaController';
import { ProblemaController } from './controllers/ProblemaController';
import { AvaliacaoController } from './controllers/AvaliacaoController';

dotenv.config();

logger.info('Supabase client initialized');

// Enhanced error logging function
const logError = (error: Error, context: string = '', additionalInfo: any = {}) => {
    logger.error({
        message: `Error in ${context}:`,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        ...additionalInfo,
        timestamp: new Date().toISOString()
    });
};

// Handle Node.js process termination
const cleanup = () => {
    logger.info('Server cleanup initiated');
    // Add any cleanup logic here
};

// Handle normal exit
process.on('exit', (code) => {
    logger.info(`Process exit with code: ${code}`);
    cleanup();
});

// Handle CTRL+C
process.on('SIGINT', () => {
    logger.info('Received SIGINT signal');
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal');
    cleanup();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logError(err, 'Uncaught Exception', {
        processMemory: process.memoryUsage(),
        processUptime: process.uptime()
    });
    cleanup();
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise) => {
    logError(
        reason instanceof Error ? reason : new Error(String(reason)),
        'Unhandled Promise Rejection',
        {
            promise: promise.toString(),
            processMemory: process.memoryUsage(),
            processUptime: process.uptime()
        }
    );
    cleanup();
    process.exit(1);
});



const router = express.Router();

const controllers: EndpointController[] = [
    AlunoController,
    ProfessorController,
    TurmaController,
    ProblemaController,
    AvaliacaoController
];
router.get('/', (req: Request, res: Response) => {
    logger.info(`\b[GET][/]`);

    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        serverInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        },
        endpoints: controllers.map(controller => ({
            name: controller.name,
            description: `${controller.name} API endpoints`,
            routes: Object.keys(controller.routes).map(route => ({
                path: `/${controller.name}/${route}`,
                method: controller.routes[route].key,
                fullPath: `${req.protocol}://${req.get('host')}/${controller.name}/${route}`
            })),
            totalRoutes: Object.keys(controller.routes).length
        })),
        documentation: {
            swagger: `${req.protocol}://${req.get('host')}/api-docs`,
            postman: `${req.protocol}://${req.get('host')}/postman-collection`
        }
    });
});

// Enhanced error handling middleware for route callbacks
const handleRouteError = (error: any, req: Request, res: Response, routePath: string) => {
    const errorContext = {
        route: routePath,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: {
            ...req.headers,
            authorization: req.headers.authorization ? '[REDACTED]' : undefined
        },
        timestamp: new Date().toISOString()
    };

    logError(
        error instanceof Error ? error : new Error(String(error)),
        `Route Handler Error: ${routePath}`,
        errorContext
    );

    const isOperationalError = error.isOperational || error.status;
    const statusCode = error.status || 500;
    const message = isOperationalError ? error.message : 'Internal server error';

    res.status(statusCode).json({
        error: message,
        path: routePath,
        timestamp: new Date().toISOString()
    });
};

controllers.forEach(controller => {
    Object.keys(controller.routes).forEach(route_name => {
        const route = controller.routes[route_name];
        const method = route.key;
        const callback = route.value;
        const routePath = `/${controller.name}/${route_name}`;

        logger.info(`Registering route: ${method} ${routePath}`);

        switch (method) {
            case RequestType.GET:
                router.get(routePath, async (req: Request, res: Response) => {
                    try {
                        logger.http(`\b[GET][${routePath}] Request received`, {
                            params: req.params,
                            query: req.query
                        });
                        await callback(req, res);
                        logger.http(`\b[GET][${routePath}] completed successfully`);
                    } catch (error) {
                        handleRouteError(error, req, res, routePath);
                    }
                });
                break;
            case RequestType.POST:
                router.post(routePath, async (req: Request, res: Response) => {
                    try {
                        logger.http(`\b[POST][${routePath}] Request received`, {
                            params: req.params
                        });
                        await callback(req, res);
                        logger.http(`\b[POST][${routePath}] completed successfully`);
                    } catch (error) {
                        handleRouteError(error, req, res, routePath);
                    }
                });
                break;
            case RequestType.PUT:
                router.put(routePath, async (req: Request, res: Response) => {
                    try {
                        logger.http(`\b[PUT][${routePath}] Request received`, {
                            params: req.params
                        });
                        await callback(req, res);
                        logger.http(`\b[PUT][${routePath}] completed successfully`);
                    } catch (error) {
                        handleRouteError(error, req, res, routePath);
                    }
                });
                break;
            case RequestType.DELETE:
                router.delete(routePath, async (req: Request, res: Response) => {
                    try {
                        logger.http(`\b[DELETE][${routePath}] Request received`, {
                            params: req.params
                        });
                        await callback(req, res);
                        logger.http(`\b[DELETE][${routePath}] completed successfully`);
                    } catch (error) {
                        handleRouteError(error, req, res, routePath);
                    }
                });
                break;
            default:
                logger.warn(`Unhandled request type: ${method} for route ${routePath}`);
                break;
        }
    });
});

const app: Express = express();

//expressws(app);

// Configure CORS properly
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'User-ID']
}));

app.use(fileUpload())
app.use(bodyParser.json({ limit: 500 * 1024 * 1024, }));
app.use(bodyParser.urlencoded({ extended: true, limit: 500 * 1024 * 1024 }));


app.use(router);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});





