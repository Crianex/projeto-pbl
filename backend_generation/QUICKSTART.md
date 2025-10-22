# Quick Start Guide

This guide provides step-by-step instructions for setting up the backend architecture with your own controllers. Follow these steps to get a working system quickly.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **Docker & Docker Compose**: [Download from docker.com](https://docker.com/)
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **Supabase Account**: [Sign up at supabase.com](https://supabase.com/)

## Step 1: Environment Setup

### 1.1 Create Project Directory

```bash
mkdir my-backend-project
cd my-backend-project
```

### 1.2 Initialize Git Repository

```bash
git init
git remote add origin <your-repository-url>
```

### 1.3 Create Environment File

Create `backend/.env` with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=development
GIT_BRANCH=main

# Python Configuration (for Docker)
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8

# Git Configuration
GIT_DISCOVERY_ACROSS_FILESYSTEM=1
```

**Important**: Replace the Supabase values with your actual project credentials.

## Step 2: Database Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project name and database password
5. Select region
6. Click "Create new project"

### 2.2 Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Service Role Key**: `your-service-role-key`

### 2.3 Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    nome_completo TEXT,
    user_type TEXT CHECK (user_type IN ('aluno', 'professor', 'coordenador')),
    link_avatar TEXT
);

-- Create example table
CREATE TABLE IF NOT EXISTS examples (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE examples ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = email);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = email);

CREATE POLICY "Examples are viewable by all authenticated users" ON examples
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Examples are insertable by authenticated users" ON examples
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Step 3: Project Structure Setup

### 3.1 Create Directory Structure

```bash
mkdir -p backend/src/{config,controllers,utils}
mkdir -p backend/logs
mkdir -p scripts
```

### 3.2 Create package.json

Create `backend/package.json`:

```json
{
    "name": "backend",
    "version": "1.0.0",
    "description": "Backend server with TypeScript and Express",
    "main": "dist/index.js",
    "scripts": {
        "start": "node dist/index.js",
        "start:ts": "ts-node src/index.ts",
        "dev": "nodemon src/index.ts",
        "build": "tsc",
        "clean": "rm -rf dist",
        "start-and-monitor": "python3 start_and_monitor.py"
    },
    "dependencies": {
        "@supabase/supabase-js": "^2.39.3",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "express": "^4.18.2",
        "express-fileupload": "^1.5.2",
        "winston": "^3.17.0"
    },
    "devDependencies": {
        "@types/cors": "^2.8.17",
        "@types/express": "^4.17.21",
        "@types/express-fileupload": "^1.5.1",
        "@types/node": "^20.10.5",
        "nodemon": "^3.0.2",
        "ts-node": "^10.9.2",
        "typescript": "^5.3.3"
    }
}
```

### 3.3 Create TypeScript Configuration

Create `backend/tsconfig.json`:

```json
{
    "compilerOptions": {
        "target": "es2018",
        "module": "commonjs",
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "sourceMap": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        "dist"
    ]
}
```

## Step 4: Core Files Setup

### 4.1 Create Interfaces

Create `backend/src/config/interfaces.ts`:

```typescript
import { Request, Response } from 'express';

export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export interface AuthUser {
    id: number;
    email: string;
    nome_completo: string;
    type: 'aluno' | 'professor' | 'coordenador';
}

export interface EndpointController {
    name: string;
    routes: {
        [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response | void>>
    };
}

export class Pair<K, V> {
    key: K;
    value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

export interface User {
    id: number;
    created_at: Date;
    email: string;
    nome_completo: string | null;
    user_type: 'aluno' | 'professor' | 'coordenador';
    link_avatar: string | null;
}

export interface Example {
    id: number;
    created_at: Date;
    name: string;
    description: string | null;
    created_by: number | null;
}
```

### 4.2 Create Supabase Wrapper

Create `backend/src/config/supabase_wrapper.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
        }
    }
);
```

### 4.3 Create Authentication Utils

Create `backend/src/config/utils.ts`:

```typescript
import { Request } from "express";
import { supabase } from "./supabase_wrapper";
import { AuthUser } from "./interfaces";

export const Utils = {
    validateAuthToken: async (req: Request): Promise<{ user: any; email: string } | null> => {
        const authorization = req.headers["authorization"];
        
        if (!authorization || typeof authorization !== "string") {
            return null;
        }

        let token = authorization;
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        try {
            const { data, error } = await supabase.auth.getUser(token);
            
            if (error || !data.user || !data.user.email) {
                return null;
            }

            return { user: data.user, email: data.user.email };
        } catch (error) {
            return null;
        }
    },

    validateUser: async (req: Request): Promise<AuthUser | null> => {
        const authResult = await Utils.validateAuthToken(req);
        if (!authResult) {
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', authResult.email)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            nome_completo: data.nome_completo,
            type: data.user_type
        };
    }
};
```

### 4.4 Create Logger

Create `backend/src/utils/logger.ts`:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/all.log' })
    ]
});

export default logger;
```

## Step 5: Create Your First Controller

### 5.1 Create Example Controller

Create `backend/src/controllers/ExampleController.ts`:

```typescript
import { EndpointController, RequestType, Pair } from '../config/interfaces';
import { Request, Response } from 'express';
import { supabase } from '../config/supabase_wrapper';
import { Utils } from '../config/utils';
import logger from '../utils/logger';

export const ExampleController: EndpointController = {
    name: 'examples',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { data, error } = await supabase
                .from('examples')
                .select('*');

            if (error) {
                logger.error(`Error fetching examples: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { data, error } = await supabase
                .from('examples')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error(`Error fetching example ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Example not found' });
            }

            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const { data, error } = await supabase
                .from('examples')
                .insert([{ name, description, created_by: authUser.id }])
                .select()
                .single();

            if (error) {
                logger.error(`Error creating example: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;
            const { name, description } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { data, error } = await supabase
                .from('examples')
                .update({ name, description })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error(`Error updating example ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                return res.status(404).json({ error: 'Example not found' });
            }

            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const { error } = await supabase
                .from('examples')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error(`Error deleting example ${id}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            return res.status(204).send();
        })
    }
};
```

### 5.2 Create Main Application

Create `backend/src/index.ts`:

```typescript
import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from "cors";
import logger from './utils/logger';
import { EndpointController } from './config/interfaces';
import { Utils } from './config/utils';

// Import controllers
import { ExampleController } from './controllers/ExampleController';

dotenv.config();

const app: Express = express();
const port = 5919;

// Middleware
app.use(cors());
app.use(express.json());

// Controllers
const controllers: EndpointController[] = [
    ExampleController
];

// Register routes
controllers.forEach(controller => {
    Object.keys(controller.routes).forEach(route_name => {
        const route = controller.routes[route_name];
        const method = route.key;
        const callback = route.value;
        const routePath = `/${controller.name}/${route_name}`;

        logger.info(`Registering route: ${method} ${routePath}`);

        switch (method) {
            case 'GET':
                app.get(routePath, callback);
                break;
            case 'POST':
                app.post(routePath, callback);
                break;
            case 'PUT':
                app.put(routePath, callback);
                break;
            case 'DELETE':
                app.delete(routePath, callback);
                break;
        }
    });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: controllers.map(controller => ({
            name: controller.name,
            routes: Object.keys(controller.routes).map(route => ({
                path: `/${controller.name}/${route}`,
                method: controller.routes[route].key
            }))
        }))
    });
});

// Start server
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
});
```

## Step 6: Local Development

### 6.1 Install Dependencies

```bash
cd backend
npm install
```

### 6.2 Start Development Server

```bash
npm run dev
```

### 6.3 Test the API

```bash
# Health check
curl http://localhost:5919/health

# List examples (requires authentication)
curl http://localhost:5919/examples/list

# Create example (requires authentication)
curl -X POST http://localhost:5919/examples/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"name": "Test Example", "description": "This is a test"}'
```

## Step 7: Docker Setup (Optional)

### 7.1 Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Install ts-node globally
RUN npm install -g ts-node typescript

# Copy source code
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 5919

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5919/health || exit 1

# Start application
CMD ["ts-node", "src/index.ts"]
```

### 7.2 Create Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: my-backend
    ports:
      - "5919:5919"
    environment:
      - NODE_ENV=production
    env_file:
      - backend/.env
    volumes:
      - ./backend/logs:/app/backend/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5919/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### 7.3 Run with Docker

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Step 8: Testing

### 8.1 Test Health Endpoint

```bash
curl http://localhost:5919/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 8.2 Test Root Endpoint

```bash
curl http://localhost:5919/
```

Expected response:
```json
{
  "status": "online",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "endpoints": [
    {
      "name": "examples",
      "routes": [
        {
          "path": "/examples/list",
          "method": "GET"
        },
        {
          "path": "/examples/get",
          "method": "GET"
        },
        {
          "path": "/examples/create",
          "method": "POST"
        },
        {
          "path": "/examples/update",
          "method": "PUT"
        },
        {
          "path": "/examples/delete",
          "method": "DELETE"
        }
      ]
    }
  ]
}
```

### 8.3 Test Authentication

```bash
# This should return 401 Unauthorized
curl http://localhost:5919/examples/list
```

Expected response:
```json
{
  "error": "Unauthorized"
}
```

## Common Issues and Solutions

### Issue 1: Supabase Connection Error

**Problem**: `Missing required environment variables`

**Solution**: 
1. Check your `.env` file exists in `backend/` directory
2. Verify Supabase URL and service role key are correct
3. Ensure no extra spaces or quotes in the values

### Issue 2: Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::5919`

**Solution**:
```bash
# Find process using port 5919
lsof -i :5919

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3000 npm run dev
```

### Issue 3: TypeScript Compilation Error

**Problem**: TypeScript compilation fails

**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Install missing types
npm install --save-dev @types/node @types/express
```

### Issue 4: Database Connection Error

**Problem**: Supabase connection fails

**Solution**:
1. Verify Supabase project is active
2. Check service role key has correct permissions
3. Ensure database tables exist
4. Test connection in Supabase dashboard

## Next Steps

1. **Add More Controllers**: Create additional controllers following the same pattern
2. **Implement Authentication**: Set up proper user authentication flow
3. **Add File Uploads**: Implement file upload functionality
4. **Set Up Monitoring**: Configure logging and monitoring systems
5. **Deploy to Production**: Set up production deployment with Docker

## Additional Resources

- **Controller Development**: [CONTROLLERS.md](./CONTROLLERS.md)
- **Infrastructure Setup**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- **Monitoring System**: [MONITORING.md](./MONITORING.md)
- **Environment Configuration**: [ENVIRONMENT.md](./ENVIRONMENT.md)

This quick start guide provides a working foundation for building scalable backend services with the architecture pattern. You can now extend it with additional controllers, authentication, and features as needed.
