# Backend Documentation

This document provides comprehensive documentation for the backend architecture, controllers, and utilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Controller Pattern](#controller-pattern)
3. [Authentication System](#authentication-system)
4. [Database Integration](#database-integration)
5. [Logging System](#logging-system)
6. [Data Parsing](#data-parsing)
7. [Best Practices](#best-practices)

## Architecture Overview

The backend follows a modular architecture with clear separation of concerns:

```
backend/
├── src/
│   ├── config/           # Configuration and interfaces
│   ├── controllers/      # Business logic controllers
│   ├── utils/           # Utility functions and helpers
│   └── index.ts         # Main application entry point
├── docs/                # Documentation
└── logs/               # Application logs
```

### Key Components

- **Controllers**: Handle HTTP requests and business logic
- **Interfaces**: Define TypeScript types and data structures
- **Utils**: Provide authentication, logging, and data parsing utilities
- **Supabase Wrapper**: Database connection and operations
- **Logger**: Centralized logging system

## Controller Pattern

Controllers follow a standardized pattern using the `EndpointController` interface. Each controller:

1. Implements the `EndpointController` interface
2. Defines routes as key-value pairs
3. Uses the `Pair` utility for type-safe route definitions
4. Includes proper authentication and error handling
5. Uses structured logging

### Controller Structure

```typescript
import { EndpointController, RequestType } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('ControllerName', 'Controller');

export const ControllerName: EndpointController = {
    name: 'controller-name',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Implementation
        }),
        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            // Implementation
        }),
        // ... more routes
    }
};
```

### Standard Routes

Each controller typically implements these standard routes:

- **list**: GET - Retrieve multiple records with optional filtering
- **get**: GET - Retrieve a single record by ID
- **create**: POST - Create a new record
- **update**: PUT - Update an existing record
- **delete**: DELETE - Delete a record

## Authentication System

The authentication system supports three user types:

- **Aluno** (Student)
- **Professor** (Professor)
- **Coordenador** (Coordinator)

### Authentication Flow

1. **Token Validation**: Extract and validate JWT tokens from Authorization header
2. **User Lookup**: Query database to find user by email
3. **Type Validation**: Verify user type matches required permissions
4. **Request Enhancement**: Attach user data to request object

### Usage in Controllers

```typescript
// Require any authenticated user
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}

// Require specific user type
const professor = await Utils.validateProfessor(req);
if (!professor) {
    return res.status(401).json({ error: 'Professor access required' });
}
```

## Database Integration

The application uses Supabase as the database provider with a wrapper for consistent access patterns.

### Supabase Wrapper

- Centralized client configuration
- Environment variable validation
- Consistent error handling
- Type-safe operations

### Database Operations

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

## Logging System

The logging system provides structured logging with different levels and controllers.

### Logger Levels

- **error**: Critical errors that require immediate attention
- **warn**: Warning conditions that should be monitored
- **info**: General information about application flow
- **http**: HTTP request/response logging
- **debug**: Detailed debugging information

### Controller Logger

Each controller gets its own logger instance with contextual information:

```typescript
const logger = createControllerLogger('ControllerName', 'Controller');

logger.info('Operation started');
logger.error('Error occurred', error);
logger.debug('Debug information');
```

## Data Parsing

The parsing system ensures type safety when working with database responses.

### Parser Functions

- **parseAluno**: Parse student data
- **parseProfessor**: Parse professor data
- **parseProblema**: Parse problem data
- **parseTurma**: Parse class data

### Usage

```typescript
import { Parsers } from '../utils/parsers';

// Parse single record
const aluno = Parsers.parseAluno(rawData);

// Parse multiple records
const alunos = Parsers.parseAlunos(rawDataArray);
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) {
        logger.error(`Database error: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    return res.json(data);
} catch (err) {
    logger.error(`Unexpected error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
}
```

### 2. Authentication

Always validate user authentication:

```typescript
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### 3. Logging

Use appropriate log levels and include context:

```typescript
logger.info(`Processing request for user ${authUser.id}`);
logger.error(`Failed to process request: ${error.message}`);
```

### 4. Type Safety

Use TypeScript interfaces and parsers:

```typescript
import { Aluno } from '../config/interfaces';
import { Parsers } from '../utils/parsers';

const alunos: Aluno[] = Parsers.parseAlunos(rawData);
```

### 5. Response Consistency

Maintain consistent response formats:

```typescript
// Success response
return res.json(data);

// Error response
return res.status(400).json({ error: 'Validation error' });

// Not found
return res.status(404).json({ error: 'Resource not found' });
```

## File Structure

```
backend/docs/
├── README.md                    # This file - Main documentation
├── controllers.md               # Controller development guide
├── authentication.md            # Authentication system guide
├── database.md                 # Database operations guide
├── logging.md                  # Logging system guide
├── interfaces.md               # TypeScript interfaces guide
└── examples/                   # Code examples
    ├── basic-controller.ts     # Basic controller example
    ├── auth-controller.ts      # Controller with authentication
    └── complex-controller.ts   # Complex controller example
```

## Getting Started

1. Read this documentation thoroughly
2. Review the existing controllers for patterns
3. Use the provided examples as templates
4. Follow the best practices outlined
5. Test thoroughly before deployment

## Contributing

When adding new controllers or modifying existing ones:

1. Follow the established patterns
2. Include proper authentication
3. Add comprehensive logging
4. Use type-safe operations
5. Update documentation as needed
6. Test all endpoints thoroughly 