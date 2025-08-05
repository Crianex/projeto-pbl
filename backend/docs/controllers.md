# Controller Development Guide

This guide explains how to create and maintain controllers in the backend system.

## Table of Contents

1. [Controller Structure](#controller-structure)
2. [Standard Routes](#standard-routes)
3. [Authentication Patterns](#authentication-patterns)
4. [Error Handling](#error-handling)
5. [Database Operations](#database-operations)
6. [Logging Best Practices](#logging-best-practices)
7. [Testing Controllers](#testing-controllers)

## Controller Structure

### Basic Controller Template

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
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                // Authentication
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                // Business logic
                const { data, error } = await supabase
                    .from('table_name')
                    .select('*');

                if (error) {
                    logger.error(`Error fetching data: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully fetched ${data?.length || 0} records`);
                return res.json(data || []);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { id } = req.params;
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

                logger.info(`Successfully fetched record ${id}`);
                return res.json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { field1, field2 } = req.body;
                
                // Validation
                if (!field1 || !field2) {
                    return res.status(400).json({ 
                        error: 'field1 and field2 are required' 
                    });
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

                logger.info(`Successfully created record ${data.id}`);
                return res.status(201).json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { id } = req.params;
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

                logger.info(`Successfully updated record ${id}`);
                return res.json(data);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            try {
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

                logger.info(`Successfully deleted record ${id}`);
                return res.status(204).send();
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })
    }
};
```

## Standard Routes

### List Route (GET)

Retrieves multiple records with optional filtering:

```typescript
'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    const { filter1, filter2 } = req.query;
    
    let query = supabase.from('table_name').select('*');
    
    if (filter1) {
        query = query.eq('column1', filter1);
    }
    
    if (filter2) {
        query = query.eq('column2', filter2);
    }
    
    const { data, error } = await query;
    // ... handle response
})
```

### Get Route (GET)

Retrieves a single record by ID:

```typescript
'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('id', id)
        .single();
    
    // ... handle response
})
```

### Create Route (POST)

Creates a new record:

```typescript
'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
    const { field1, field2 } = req.body;
    
    const { data, error } = await supabase
        .from('table_name')
        .insert([{ field1, field2 }])
        .select()
        .single();
    
    // ... handle response
})
```

### Update Route (PUT)

Updates an existing record:

```typescript
'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { field1, field2 } = req.body;
    
    const { data, error } = await supabase
        .from('table_name')
        .update({ field1, field2 })
        .eq('id', id)
        .select()
        .single();
    
    // ... handle response
})
```

### Delete Route (DELETE)

Deletes a record:

```typescript
'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
    const { id } = req.query;
    
    const { error } = await supabase
        .from('table_name')
        .delete()
        .eq('id', id);
    
    // ... handle response
})
```

## Authentication Patterns

### Basic Authentication

```typescript
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### Role-Specific Authentication

```typescript
// Require professor access
const professor = await Utils.validateProfessor(req);
if (!professor) {
    return res.status(401).json({ error: 'Professor access required' });
}

// Require student access
const aluno = await Utils.validateAluno(req);
if (!aluno) {
    return res.status(401).json({ error: 'Student access required' });
}
```

### Conditional Authentication

```typescript
// Allow multiple user types
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}

// Check specific permissions
if (authUser.type === 'aluno' && !canStudentAccess) {
    return res.status(403).json({ error: 'Insufficient permissions' });
}
```

## Error Handling

### Database Errors

```typescript
const { data, error } = await supabase.from('table').select('*');

if (error) {
    logger.error(`Database error: ${error.message}`);
    return res.status(500).json({ error: error.message });
}
```

### Validation Errors

```typescript
const { requiredField } = req.body;
if (!requiredField) {
    return res.status(400).json({ 
        error: 'requiredField is required' 
    });
}
```

### Not Found Errors

```typescript
if (!data) {
    return res.status(404).json({ error: 'Record not found' });
}
```

### Unexpected Errors

```typescript
try {
    // Your code here
} catch (err) {
    logger.error(`Unexpected error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
}
```

## Database Operations

### Complex Queries with Joins

```typescript
const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
        *,
        problema:problemas(*),
        avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
        avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
    `)
    .eq('id_problema', problemaId);
```

### Filtered Queries

```typescript
let query = supabase.from('table_name').select('*');

if (filter1) {
    query = query.eq('column1', filter1);
}

if (filter2) {
    query = query.gte('column2', filter2);
}

const { data, error } = await query;
```

### Insert with Return

```typescript
const { data, error } = await supabase
    .from('table_name')
    .insert([insertData])
    .select()
    .single();
```

### Update with Return

```typescript
const { data, error } = await supabase
    .from('table_name')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
```

## Logging Best Practices

### Log Levels

```typescript
// Info for successful operations
logger.info(`Successfully processed request for user ${authUser.id}`);

// Error for failures
logger.error(`Failed to process request: ${error.message}`);

// Debug for detailed information
logger.debug(`Processing data: ${JSON.stringify(data)}`);

// Warn for potential issues
logger.warn(`User ${authUser.id} attempted unauthorized access`);
```

### Contextual Logging

```typescript
logger.info(`User ${authUser.id} (${authUser.type}) accessed ${req.path}`);
logger.error(`Database error for user ${authUser.id}: ${error.message}`);
```

### Performance Logging

```typescript
const startTime = Date.now();
// ... perform operation
const duration = Date.now() - startTime;
logger.info(`Operation completed in ${duration}ms`);
```

## Testing Controllers

### Unit Test Structure

```typescript
describe('ControllerName', () => {
    describe('list', () => {
        it('should return all records', async () => {
            // Test implementation
        });
        
        it('should filter records correctly', async () => {
            // Test implementation
        });
        
        it('should handle authentication errors', async () => {
            // Test implementation
        });
    });
});
```

### Integration Test Structure

```typescript
describe('ControllerName Integration', () => {
    it('should create, read, update, and delete records', async () => {
        // Test full CRUD cycle
    });
});
```

## Common Patterns

### Pagination

```typescript
const { page = 1, limit = 10 } = req.query;
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
    .from('table_name')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
```

### Search

```typescript
const { search } = req.query;
let query = supabase.from('table_name').select('*');

if (search) {
    query = query.ilike('name', `%${search}%`);
}
```

### Sorting

```typescript
const { sortBy = 'created_at', sortOrder = 'desc' } = req.query;
let query = supabase.from('table_name').select('*');

query = query.order(sortBy, { ascending: sortOrder === 'asc' });
```

## Security Considerations

### Input Validation

```typescript
// Validate required fields
if (!requiredField) {
    return res.status(400).json({ error: 'Required field missing' });
}

// Validate data types
if (typeof numericField !== 'number') {
    return res.status(400).json({ error: 'Invalid data type' });
}

// Sanitize inputs
const sanitizedInput = input.replace(/[<>]/g, '');
```

### Authorization Checks

```typescript
// Check if user can access specific resource
if (authUser.type === 'aluno' && resource.userId !== authUser.id) {
    return res.status(403).json({ error: 'Access denied' });
}
```

### Rate Limiting

```typescript
// Implement rate limiting logic
const userRequests = getUserRequestCount(authUser.id);
if (userRequests > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: 'Too many requests' });
}
``` 