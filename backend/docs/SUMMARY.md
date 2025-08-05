# Backend Documentation Summary

This document provides an overview of the backend documentation structure and how to use it effectively.

## Documentation Structure

```
backend/docs/
├── README.md                    # Main documentation overview
├── controllers.md               # Controller development guide
├── authentication.md            # Authentication system guide
├── database.md                 # Database operations guide
├── logging.md                  # Logging system guide
├── interfaces.md               # TypeScript interfaces guide
├── SUMMARY.md                  # This file - Documentation summary
└── examples/                   # Code examples
    ├── basic-controller.ts     # Basic controller example
    ├── auth-controller.ts      # Controller with authentication
    └── complex-controller.ts   # Complex controller example
```

## Quick Start Guide

### 1. Understanding the Architecture

Start by reading the main [README.md](README.md) to understand:
- Overall architecture
- Key components
- Controller patterns
- Authentication system
- Database integration

### 2. Controller Development

When creating a new controller:

1. **Read the controllers guide** ([controllers.md](controllers.md))
2. **Review the examples** in the `examples/` folder
3. **Follow the standard patterns**:
   - Use the `EndpointController` interface
   - Implement proper authentication
   - Include comprehensive logging
   - Handle errors gracefully

### 3. Authentication Implementation

For authentication needs:

1. **Read the authentication guide** ([authentication.md](authentication.md))
2. **Choose the appropriate validation function**:
   - `Utils.validateUser()` - Any authenticated user
   - `Utils.validateProfessor()` - Professor only
   - `Utils.validateAluno()` - Student only
   - `Utils.validateCoordenador()` - Coordinator only

### 4. Database Operations

For database operations:

1. **Read the database guide** ([database.md](database.md))
2. **Use the Supabase wrapper** for consistent operations
3. **Follow the patterns** for queries, joins, and transactions

### 5. Logging Best Practices

For logging:

1. **Read the logging guide** ([logging.md](logging.md))
2. **Use controller loggers** for contextual information
3. **Choose appropriate log levels**:
   - `error` - Critical errors
   - `warn` - Warnings
   - `info` - General information
   - `debug` - Detailed debugging

## Key Patterns

### Controller Template

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
                const { data, error } = await supabase.from('table').select('*');

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully fetched ${data?.length || 0} records`);
                return res.json(data || []);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),
    }
};
```

### Authentication Patterns

```typescript
// Any authenticated user
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}

// Role-specific authentication
const professor = await Utils.validateProfessor(req);
if (!professor) {
    return res.status(401).json({ error: 'Professor access required' });
}
```

### Database Patterns

```typescript
// Simple query
const { data, error } = await supabase.from('table').select('*');

// Complex query with joins
const { data, error } = await supabase
    .from('table')
    .select(`
        *,
        related_table(*)
    `)
    .eq('column', value);

// Insert with return
const { data, error } = await supabase
    .from('table')
    .insert([data])
    .select()
    .single();
```

### Logging Patterns

```typescript
// Info for successful operations
logger.info(`Successfully processed request for user ${authUser.id}`);

// Error for failures
logger.error(`Failed to process request: ${error.message}`);

// Debug for detailed information
logger.debug(`Processing data: ${JSON.stringify(data)}`);
```

## Common Use Cases

### 1. Creating a New Controller

1. **Copy the basic template** from `examples/basic-controller.ts`
2. **Implement the required routes** (list, get, create, update, delete)
3. **Add proper authentication** based on your needs
4. **Include comprehensive logging**
5. **Test thoroughly**

### 2. Adding Authentication to Existing Controller

1. **Choose the appropriate validation function**
2. **Add validation at the start of each route**
3. **Handle authentication errors**
4. **Log authentication events**

### 3. Implementing Complex Queries

1. **Use the database guide** for query patterns
2. **Review the complex controller example**
3. **Implement proper error handling**
4. **Add performance monitoring**

### 4. Adding Logging to Existing Code

1. **Create a controller logger**
2. **Add logging at key points**
3. **Use appropriate log levels**
4. **Include relevant context**

## Best Practices Summary

### 1. Always Validate Authentication

```typescript
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### 2. Handle Errors Gracefully

```typescript
try {
    // Your code here
} catch (err) {
    logger.error(`Unexpected error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
}
```

### 3. Log Important Events

```typescript
logger.info(`User ${authUser.id} (${authUser.type}) accessed ${req.path}`);
logger.error(`Database error for user ${authUser.id}: ${error.message}`);
```

### 4. Use Type Safety

```typescript
import { Aluno } from '../config/interfaces';
const alunos: Aluno[] = data.map(item => parseAluno(item));
```

### 5. Follow Response Standards

```typescript
// Success
return res.json(data);

// Error
return res.status(400).json({ error: 'Validation error' });

// Not found
return res.status(404).json({ error: 'Resource not found' });
```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Check token format and user existence
2. **Database errors**: Verify table structure and permissions
3. **Logging issues**: Check log level configuration
4. **Type errors**: Ensure proper interface usage

### Debug Commands

```bash
# View logs
tail -f logs/all.log

# Search for errors
grep "ERROR" logs/all.log

# Monitor specific controller
tail -f logs/all.log | grep "ControllerName"
```

## Contributing

When adding new features or modifying existing code:

1. **Follow the established patterns**
2. **Update documentation as needed**
3. **Test thoroughly**
4. **Use proper logging**
5. **Maintain type safety**

## Resources

- **Main Documentation**: [README.md](README.md)
- **Controller Guide**: [controllers.md](controllers.md)
- **Authentication Guide**: [authentication.md](authentication.md)
- **Database Guide**: [database.md](database.md)
- **Logging Guide**: [logging.md](logging.md)
- **Interfaces Guide**: [interfaces.md](interfaces.md)
- **Examples**: `examples/` folder

## Getting Help

1. **Check the documentation** first
2. **Review the examples** for similar patterns
3. **Look at existing controllers** for reference
4. **Check the logs** for error information
5. **Ask for help** with specific issues

---

This documentation is designed to be comprehensive yet accessible. Start with the main README and work through the specific guides as needed. The examples provide practical implementations of the concepts discussed in the guides. 