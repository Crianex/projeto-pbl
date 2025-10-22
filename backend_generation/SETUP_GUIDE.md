# Backend Setup Guide

This document provides a comprehensive technical reference for understanding and replicating this backend architecture. It covers the core patterns, components, and file structure that make this system scalable and maintainable.

## Architecture Overview

The backend follows a modular, controller-based architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Nginx Proxy   │    │   Backend       │
│   (Svelte)      │◄──►│   (SSL/HTTP)    │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   Supabase      │
                                               │   (Database)    │
                                               └─────────────────┘
```

### Core Design Principles

1. **Controller-Based Routing**: All endpoints are defined through controller objects
2. **Automatic Registration**: Routes are automatically registered from controller definitions
3. **Type Safety**: Full TypeScript support with strict interfaces
4. **Role-Based Authentication**: Built-in user type validation (aluno, professor, coordenador)
5. **Containerized Deployment**: Docker-based deployment with auto-updates

## Core Components

### 1. Controller Pattern (`EndpointController`)

Every controller implements the `EndpointController` interface:

```typescript
interface EndpointController {
    name: string;
    routes: {
        [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response | void>>
    };
}
```

**Key Features:**
- **Standardized Structure**: All controllers follow the same pattern
- **Type Safety**: Routes are strongly typed with request/response handlers
- **Automatic Registration**: Routes are automatically mounted in `index.ts`

### 2. Route Registration System

Routes are automatically registered in `index.ts` (lines 107-269):

```typescript
const controllers: EndpointController[] = [
    AlunoController,
    ProfessorController,
    TurmaController,
    ProblemaController,
    AvaliacaoController,
    CoordenadorController,
    UserController
];

controllers.forEach(controller => {
    Object.keys(controller.routes).forEach(route_name => {
        const route = controller.routes[route_name];
        const method = route.key;
        const callback = route.value;
        const routePath = `/${controller.name}/${route_name}`;
        
        // Register route with Express router
        router[method.toLowerCase()](routePath, async (req, res) => {
            try {
                await callback(req, res);
            } catch (error) {
                handleRouteError(error, req, res, routePath);
            }
        });
    });
});
```

### 3. Authentication System

The authentication system provides role-based access control:

```typescript
// Available authentication functions
Utils.validateAuthToken(req)     // Basic token validation
Utils.validateUser(req)          // Any authenticated user
Utils.validateAluno(req)         // Student authentication
Utils.validateProfessor(req)     // Professor authentication
Utils.validateCoordenador(req)   // Coordinator authentication
```

**Authentication Flow:**
1. Extract JWT token from `Authorization` header
2. Validate token with Supabase Auth
3. Look up user by email in database
4. Determine user type (aluno/professor/coordenador)
5. Attach user data to request object

### 4. Database Integration (Supabase)

The system uses Supabase as the database provider with a wrapper for consistent access:

```typescript
// Supabase client configuration
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

**Database Operations Pattern:**
```typescript
// Query with joins
const { data, error } = await supabase
    .from('table_name')
    .select(`
        *,
        related_table(*)
    `)
    .eq('column', value);

// Insert with return
const { data, error } = await supabase
    .from('table_name')
    .insert([data])
    .select()
    .single();
```

### 5. Logging System

Structured logging with Winston and controller-specific loggers:

```typescript
// Controller logger creation
const logger = createControllerLogger('ControllerName', 'Controller');

// Usage in controllers
logger.info('Operation started');
logger.error('Error occurred', error);
logger.debug('Debug information');
```

**Logger Configuration:**
- **Console Output**: Development logging with colors
- **File Output**: Persistent logs with rotation
- **Controller Context**: Each controller gets its own logger instance
- **Log Levels**: error, warn, info, http, debug

## Technology Stack

### Runtime & Framework
- **Node.js 18**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe JavaScript development

### Database & Storage
- **Supabase**: PostgreSQL database with real-time features
- **Supabase Auth**: JWT-based authentication
- **Supabase Storage**: File upload and management

### Infrastructure
- **Docker**: Application containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and SSL termination

### Development Tools
- **Winston**: Structured logging
- **express-fileupload**: File upload handling
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── interfaces.ts          # TypeScript interfaces and types
│   │   ├── supabase_wrapper.ts    # Database connection wrapper
│   │   └── utils.ts               # Authentication and utility functions
│   ├── controllers/
│   │   ├── AlunoController.ts     # Student management endpoints
│   │   ├── ProfessorController.ts # Professor management endpoints
│   │   ├── TurmaController.ts     # Class management endpoints
│   │   ├── ProblemaController.ts  # Problem management endpoints
│   │   ├── AvaliacaoController.ts # Evaluation endpoints
│   │   ├── CoordenadorController.ts # Coordinator endpoints
│   │   └── UserController.ts      # User management endpoints
│   ├── utils/
│   │   ├── logger.ts              # Winston logger configuration
│   │   ├── controller_logger.ts   # Controller-specific logging
│   │   ├── media_utils.ts         # Media calculation utilities
│   │   └── parsers.ts             # Data parsing and validation
│   └── index.ts                   # Main application entry point
├── docs/                          # Existing documentation
├── logs/                          # Application logs
├── start_and_monitor.py          # Auto-update monitoring script
├── package.json                   # Node.js dependencies
├── tsconfig.json                  # TypeScript configuration
└── nodemon.json                   # Development server configuration
```

## Key Interfaces

### EndpointController Interface
```typescript
export interface EndpointController {
    name: string;
    routes: {
        [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response | void>>
    };
}
```

### Authentication User Interface
```typescript
export interface AuthUser {
    id: number;
    email: string;
    nome_completo: string;
    type: 'aluno' | 'professor' | 'coordenador';
}
```

### Request Type Enum
```typescript
export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}
```

## Application Entry Point

The main application (`src/index.ts`) handles:

1. **Environment Setup**: Loading environment variables and configuration
2. **Controller Registration**: Automatic route registration from controllers
3. **Middleware Configuration**: CORS, file upload, body parsing
4. **Error Handling**: Global error handling middleware
5. **Server Startup**: Express server initialization and health checks

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm run start
```

### Docker Development
```bash
# Build and run containers
docker-compose up --build

# Follow logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## Best Practices

### 1. Controller Development
- Always implement the `EndpointController` interface
- Use consistent route naming (list, get, create, update, delete)
- Include proper authentication checks
- Handle errors gracefully with appropriate HTTP status codes

### 2. Authentication
- Always validate user authentication before processing requests
- Use appropriate validation functions based on required user type
- Handle authentication failures with consistent error responses

### 3. Database Operations
- Use Supabase wrapper for all database operations
- Include proper error handling for database failures
- Use joins to fetch related data efficiently
- Validate input data before database operations

### 4. Logging
- Use controller-specific loggers for better traceability
- Include relevant context in log messages
- Use appropriate log levels (error, warn, info, debug)
- Log both successful operations and errors

### 5. Error Handling
- Use consistent error response formats
- Include proper HTTP status codes
- Log errors with sufficient context
- Handle both operational and system errors appropriately

## Next Steps

1. **Read Controller Development Guide**: [CONTROLLERS.md](./CONTROLLERS.md)
2. **Set Up Infrastructure**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
3. **Configure Monitoring**: [MONITORING.md](./MONITORING.md)
4. **Quick Start Setup**: [QUICKSTART.md](./QUICKSTART.md)

This architecture provides a solid foundation for building scalable, maintainable backend services with proper authentication, logging, and deployment capabilities.
