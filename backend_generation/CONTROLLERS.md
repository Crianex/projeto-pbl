# Controller Development Guide

This guide explains how to create controllers using the standardized pattern in this backend architecture. Controllers handle HTTP requests, implement business logic, and interact with the database through a consistent interface.

## Controller Pattern Overview

All controllers implement the `EndpointController` interface and follow a standardized structure:

```typescript
import { EndpointController, RequestType } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { Utils } from '../config/utils';

const logger = createControllerLogger('ControllerName', 'Controller');

export const ControllerName: EndpointController = {
    name: 'controller-name',
    routes: {
        // Route definitions here
    }
};
```

## Core Components

### 1. Controller Structure

Every controller must have:
- **Name**: The controller name used in URL paths
- **Routes**: Object containing all route definitions
- **Logger**: Controller-specific logger instance
- **Imports**: Required dependencies and utilities

### 2. Route Definition Pattern

Routes are defined using the `Pair` utility with request type and handler function:

```typescript
'route-name': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    // Route implementation
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Business logic here
    return res.json(data);
})
```

### 3. Standard CRUD Operations

Most controllers implement these standard operations:

#### List (GET /controller-name/list)
Retrieve multiple records with optional filtering:

```typescript
'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filter_param } = req.query;
    
    let query = supabase.from('table_name').select('*');
    
    if (filter_param) {
        query = query.eq('column', filter_param);
    }

    const { data, error } = await query;
    
    if (error) {
        logger.error(`Error fetching records: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
})
```

#### Get (GET /controller-name/get)
Retrieve a single record by ID:

```typescript
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
        .from('table_name')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        logger.error(`Error fetching record ${id}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    if (!data) {
        return res.status(404).json({ error: 'Record not found' });
    }

    return res.json(data);
})
```

#### Create (POST /controller-name/create)
Create a new record:

```typescript
'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { field1, field2 } = req.body;
    
    if (!field1 || !field2) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const { data, error } = await supabase
        .from('table_name')
        .insert([{ field1, field2 }])
        .select()
        .single();

    if (error) {
        logger.error(`Error creating record: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
})
```

#### Update (PUT /controller-name/update)
Update an existing record:

```typescript
'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const { field1, field2 } = req.body;
    
    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    const { data, error } = await supabase
        .from('table_name')
        .update({ field1, field2 })
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

    return res.json(data);
})
```

#### Delete (DELETE /controller-name/delete)
Delete a record:

```typescript
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
        .from('table_name')
        .delete()
        .eq('id', id);

    if (error) {
        logger.error(`Error deleting record ${id}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    return res.status(204).send();
})
```

## Authentication Integration

### Role-Based Authentication

Use different validation functions based on required access level:

```typescript
// Any authenticated user
const authUser = await Utils.validateUser(req);

// Specific user types
const aluno = await Utils.validateAluno(req);
const professor = await Utils.validateProfessor(req);
const coordenador = await Utils.validateCoordenador(req);
```

### Authentication Patterns

#### Public Endpoints (Auth Flow)
Some endpoints allow unauthenticated access for authentication flow:

```typescript
'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
    // Allow unauthenticated access for user creation during auth flow
    const authUser = await Utils.validateUser(req);
    
    if (!authUser) {
        logger.info('No authentication provided - allowing for auth flow');
    }
    
    // Implementation continues...
})
```

#### Role-Based Access Control
Implement different access levels based on user type:

```typescript
'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let query = supabase.from('turmas').select('*');
    
    if (authUser.type === 'aluno') {
        // Students can only see their own classes
        query = query.eq('id_aluno', authUser.id);
    } else if (authUser.type === 'professor') {
        // Professors can see all classes
        // No additional filtering needed
    }
    
    // Continue with query execution...
})
```

## File Upload Handling

### Basic File Upload
Handle file uploads using `express-fileupload`:

```typescript
'uploadFile': new Pair(RequestType.POST, async (req: Request, res: Response) => {
    const authUser = await Utils.validateUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'File is required' });
    }

    const file = req.files.file as any;
    
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'File must be an image' });
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    try {
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `uploads/file_${Date.now()}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('bucket_name')
            .upload(fileName, file.data, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) {
            logger.error(`Error uploading file: ${uploadError.message}`);
            return res.status(500).json({ error: 'Error uploading file' });
        }

        // Generate public URL
        const { data: urlData } = supabase.storage
            .from('bucket_name')
            .getPublicUrl(fileName);

        return res.json({
            success: true,
            file_url: urlData.publicUrl,
            file_name: fileName
        });

    } catch (error) {
        logger.error(`Error uploading file: ${error}`);
        return res.status(500).json({ error: 'Error uploading file' });
    }
})
```

## Error Handling Patterns

### Consistent Error Responses
Use consistent error response formats:

```typescript
// Validation errors
return res.status(400).json({ error: 'Validation error message' });

// Authentication errors
return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });

// Authorization errors
return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });

// Not found errors
return res.status(404).json({ error: 'Resource not found' });

// Server errors
return res.status(500).json({ error: 'Internal server error' });
```

### Database Error Handling
Handle database errors consistently:

```typescript
const { data, error } = await supabase.from('table').select('*');

if (error) {
    logger.error(`Database error: ${error.message}`);
    return res.status(500).json({ error: error.message });
}

if (!data || data.length === 0) {
    return res.status(404).json({ error: 'No records found' });
}
```

## Complete Controller Example

Here's a complete controller example implementing all standard operations:

```typescript
import { EndpointController, RequestType } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { Utils } from '../config/utils';

const logger = createControllerLogger('Example', 'Controller');

export const ExampleController: EndpointController = {
    name: 'examples',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { filter } = req.query;
            
            let query = supabase.from('examples').select('*');
            
            if (filter) {
                query = query.ilike('name', `%${filter}%`);
            }

            const { data, error } = await query;
            
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

## Best Practices

### 1. Controller Structure
- Always implement the `EndpointController` interface
- Use descriptive controller names (plural form)
- Include proper imports and logger initialization
- Follow consistent naming conventions

### 2. Route Implementation
- Use standard CRUD operations when applicable
- Implement proper authentication checks
- Handle errors gracefully with appropriate HTTP status codes
- Include input validation for all endpoints
- Use consistent parameter names (id, filter, etc.)

### 3. Authentication
- Always validate user authentication before processing requests
- Use appropriate validation functions based on required user type
- Handle authentication failures consistently
- Consider role-based access control for sensitive operations

### 4. Database Operations
- Use Supabase wrapper for all database operations
- Include proper error handling for database failures
- Use joins to fetch related data efficiently
- Validate input data before database operations
- Use appropriate query methods (select, insert, update, delete)

### 5. Logging
- Use controller-specific loggers for better traceability
- Include relevant context in log messages
- Log both successful operations and errors
- Use appropriate log levels (error, warn, info, debug)

### 6. Error Handling
- Use consistent error response formats
- Include proper HTTP status codes
- Log errors with sufficient context
- Handle both operational and system errors appropriately

## Next Steps

1. **Set Up Infrastructure**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
2. **Configure Monitoring**: [MONITORING.md](./MONITORING.md)
3. **Quick Start Setup**: [QUICKSTART.md](./QUICKSTART.md)
4. **Environment Configuration**: [ENVIRONMENT.md](./ENVIRONMENT.md)

This controller pattern provides a consistent, scalable approach to building backend APIs with proper authentication, error handling, and database integration.
