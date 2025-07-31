import { logger } from './logger';

const API_URL = import.meta.env.DEV
    ? 'http://localhost:5919'
    : import.meta.env.VITE_API_URL; // Make sure to set this in your production environment

if (!API_URL) {
    throw new Error('API URL is not defined');
}

type RequestOptions = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
};

export class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

async function fetchWithLogging(url: string, options: RequestOptions): Promise<any> {
    const fullUrl = `${API_URL}${url}`;
    const startTime = Date.now();

    logger.http(`API Request: ${options.method} ${url}`, {
        body: options.body,
        headers: options.headers
    });

    try {
        // Prepare headers and body
        const headers: Record<string, string> = { ...options.headers };
        let body: any = options.body;

        // Only set Content-Type and stringify if body is not FormData
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const response = await fetch(fullUrl, {
            ...options,
            headers,
            body,
        });

        const duration = Date.now() - startTime;
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            logger.error(`API Error: ${options.method} ${url}`, {
                status: response.status,
                duration,
                data
            });
            throw new APIError(
                data?.error || 'An error occurred',
                response.status,
                data
            );
        }

        logger.http(`API Response: ${options.method} ${url}`, {
            status: response.status,
            duration,
            data
        });

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        logger.error(`API Request failed: ${options.method} ${url}`, { error });
        throw new APIError('Failed to fetch', 500, error);
    }
}

export const api = {
    get: (url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
        fetchWithLogging(url, { ...options, method: 'GET' }),

    post: (url: string, body: any, options: Omit<RequestOptions, 'method'> = {}) =>
        fetchWithLogging(url, { ...options, method: 'POST', body }),

    put: (url: string, body: any, options: Omit<RequestOptions, 'method'> = {}) =>
        fetchWithLogging(url, { ...options, method: 'PUT', body }),

    delete: (url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
        fetchWithLogging(url, { ...options, method: 'DELETE' }),
}; 