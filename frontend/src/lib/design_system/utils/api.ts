import { logger } from './logger';
import { supabase } from '../../supabase';

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

/**
 * Gets the current Supabase access token for authentication
 */
async function getAuthToken(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || null;

        if (token) {
            // Only log once per session, not on every request
            logger.debug('Auth token retrieved');
        } else {
            logger.warn('No auth token found in session');
        }

        return token;
    } catch (error) {
        logger.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Prepares headers with authentication token
 */
async function prepareHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...customHeaders };

    // Get the auth token
    const token = await getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        logger.warn('No auth token available for request');
    }

    return headers;
}

async function fetchWithLogging(url: string, options: RequestOptions): Promise<any> {
    const fullUrl = `${API_URL}${url}`;
    const startTime = Date.now();

    //logger.http(`API Request: ${options.method} ${url}`);

    try {
        // Prepare headers with authentication
        const headers = await prepareHeaders(options.headers);
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

        /* logger.http(`API Response: ${options.method} ${url}`, {
            status: response.status,
            duration,
            data
        }); */

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