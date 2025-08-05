# Database Operations Guide

This guide explains how to work with the database using the Supabase wrapper and best practices for database operations.

## Table of Contents

1. [Overview](#overview)
2. [Supabase Wrapper](#supabase-wrapper)
3. [Basic Operations](#basic-operations)
4. [Complex Queries](#complex-queries)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)
7. [Security Considerations](#security-considerations)
8. [Best Practices](#best-practices)

## Overview

The application uses Supabase as the primary database provider. The `supabase_wrapper.ts` provides a centralized client with proper configuration and error handling.

### Key Features

- **Type Safety**: Full TypeScript support
- **Real-time**: Built-in real-time subscriptions
- **Row Level Security**: Database-level security policies
- **Auto-generated APIs**: RESTful API generation
- **Built-in Auth**: JWT-based authentication

## Supabase Wrapper

### Configuration

```typescript
import { createClient } from '@supabase/supabase-js';

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

### Environment Variables

Required environment variables:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Validation

```typescript
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
```

## Basic Operations

### Select Operations

#### Simple Select

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*');
```

#### Select Specific Columns

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('id, name, email');
```

#### Select with Filtering

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('status', 'active')
    .gte('created_at', '2024-01-01');
```

#### Select Single Record

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', recordId)
    .single();
```

### Insert Operations

#### Simple Insert

```typescript
const { data, error } = await supabase
    .from('table_name')
    .insert([{ name: 'John', email: 'john@example.com' }]);
```

#### Insert with Return

```typescript
const { data, error } = await supabase
    .from('table_name')
    .insert([{ name: 'John', email: 'john@example.com' }])
    .select()
    .single();
```

#### Insert Multiple Records

```typescript
const { data, error } = await supabase
    .from('table_name')
    .insert([
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' }
    ]);
```

### Update Operations

#### Simple Update

```typescript
const { data, error } = await supabase
    .from('table_name')
    .update({ status: 'inactive' })
    .eq('id', recordId);
```

#### Update with Return

```typescript
const { data, error } = await supabase
    .from('table_name')
    .update({ status: 'inactive' })
    .eq('id', recordId)
    .select()
    .single();
```

#### Update Multiple Records

```typescript
const { data, error } = await supabase
    .from('table_name')
    .update({ status: 'inactive' })
    .in('id', [1, 2, 3]);
```

### Delete Operations

#### Simple Delete

```typescript
const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', recordId);
```

#### Delete Multiple Records

```typescript
const { error } = await supabase
    .from('table_name')
    .delete()
    .in('id', [1, 2, 3]);
```

## Complex Queries

### Joins

#### Inner Join

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

#### Left Join

```typescript
const { data, error } = await supabase
    .from('turmas')
    .select(`
        *,
        professor:professores(*),
        alunos:alunos(*)
    `);
```

### Filtering

#### Multiple Conditions

```typescript
let query = supabase.from('table_name').select('*');

if (status) {
    query = query.eq('status', status);
}

if (startDate) {
    query = query.gte('created_at', startDate);
}

if (endDate) {
    query = query.lte('created_at', endDate);
}

const { data, error } = await query;
```

#### Text Search

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .ilike('name', `%${searchTerm}%`);
```

#### Range Queries

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .gte('price', minPrice)
    .lte('price', maxPrice);
```

### Sorting

#### Simple Sort

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false });
```

#### Multiple Sort Columns

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });
```

### Pagination

#### Basic Pagination

```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
    .from('table_name')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
```

#### Cursor-based Pagination

```typescript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .gt('id', lastId)
    .order('id', { ascending: true })
    .limit(limit);
```

## Error Handling

### Database Errors

```typescript
const { data, error } = await supabase.from('table_name').select('*');

if (error) {
    logger.error(`Database error: ${error.message}`);
    
    // Handle specific error types
    switch (error.code) {
        case 'PGRST116':
            return res.status(404).json({ error: 'Record not found' });
        case '23505':
            return res.status(409).json({ error: 'Duplicate record' });
        case '23503':
            return res.status(400).json({ error: 'Foreign key constraint violation' });
        default:
            return res.status(500).json({ error: 'Database error' });
    }
}
```

### Validation Errors

```typescript
// Validate required fields
if (!requiredField) {
    return res.status(400).json({ error: 'Required field missing' });
}

// Validate data types
if (typeof numericField !== 'number') {
    return res.status(400).json({ error: 'Invalid data type' });
}

// Validate data ranges
if (numericField < 0 || numericField > 100) {
    return res.status(400).json({ error: 'Value out of range' });
}
```

### Transaction Handling

```typescript
try {
    // Start transaction
    const { data: result1, error: error1 } = await supabase
        .from('table1')
        .insert([data1]);

    if (error1) throw error1;

    const { data: result2, error: error2 } = await supabase
        .from('table2')
        .insert([data2]);

    if (error2) throw error2;

    logger.info('Transaction completed successfully');
    return res.json({ success: true });
} catch (error) {
    logger.error(`Transaction failed: ${error.message}`);
    return res.status(500).json({ error: 'Transaction failed' });
}
```

## Performance Optimization

### Indexing

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_table_name_status ON table_name(status);
CREATE INDEX idx_table_name_created_at ON table_name(created_at);
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
```

### Query Optimization

#### Select Only Needed Columns

```typescript
// Good: Select only needed columns
const { data, error } = await supabase
    .from('table_name')
    .select('id, name, email');

// Avoid: Select all columns when not needed
const { data, error } = await supabase
    .from('table_name')
    .select('*');
```

#### Use Appropriate Filters

```typescript
// Use indexed columns for filtering
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', userId)  // Indexed column
    .eq('status', 'active'); // Indexed column
```

#### Limit Results

```typescript
// Always limit large result sets
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .limit(100);
```

### Caching

```typescript
// Implement caching for frequently accessed data
const cacheKey = `user_${userId}`;
let userData = cache.get(cacheKey);

if (!userData) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (!error && data) {
        cache.set(cacheKey, data, 300); // Cache for 5 minutes
        userData = data;
    }
}
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON table_name
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON table_name
    FOR UPDATE USING (auth.uid() = user_id);
```

### Input Sanitization

```typescript
// Sanitize user inputs
const sanitizedInput = input.replace(/[<>]/g, '');

// Use parameterized queries (handled by Supabase)
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('name', sanitizedInput);
```

### Access Control

```typescript
// Check user permissions before database operations
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}

// Verify user can access the resource
if (authUser.type === 'aluno' && resource.userId !== authUser.id) {
    return res.status(403).json({ error: 'Access denied' });
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
const { data, error } = await supabase.from('table_name').select('*');

if (error) {
    logger.error(`Database error: ${error.message}`);
    return res.status(500).json({ error: error.message });
}

if (!data) {
    return res.status(404).json({ error: 'No data found' });
}
```

### 2. Use TypeScript Interfaces

```typescript
import { Aluno } from '../config/interfaces';

const { data, error } = await supabase
    .from('alunos')
    .select('*');

if (!error && data) {
    const alunos: Aluno[] = data.map(item => ({
        id_aluno: item.id_aluno,
        nome_completo: item.nome_completo,
        email: item.email,
        // ... other fields
    }));
}
```

### 3. Log Database Operations

```typescript
logger.info(`Fetching data for user ${authUser.id}`);
const { data, error } = await supabase.from('table_name').select('*');

if (error) {
    logger.error(`Database error for user ${authUser.id}: ${error.message}`);
} else {
    logger.info(`Successfully fetched ${data?.length || 0} records for user ${authUser.id}`);
}
```

### 4. Use Transactions for Related Operations

```typescript
// Use transactions for operations that must succeed together
const { data: result1, error: error1 } = await supabase
    .from('table1')
    .insert([data1]);

if (error1) {
    logger.error(`Failed to insert into table1: ${error1.message}`);
    return res.status(500).json({ error: 'Operation failed' });
}

const { data: result2, error: error2 } = await supabase
    .from('table2')
    .insert([data2]);

if (error2) {
    logger.error(`Failed to insert into table2: ${error2.message}`);
    // Consider rolling back the first operation
    return res.status(500).json({ error: 'Operation failed' });
}
```

### 5. Implement Proper Pagination

```typescript
const page = Math.max(1, parseInt(req.query.page as string) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
    .from('table_name')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

return res.json({
    data,
    pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
    }
});
```

### 6. Use Environment-Specific Configuration

```typescript
const supabaseConfig = {
    auth: {
        autoRefreshToken: true,
        persistSession: process.env.NODE_ENV === 'development',
    },
    db: {
        schema: process.env.NODE_ENV === 'production' ? 'public' : 'test'
    }
};
```

### 7. Implement Connection Pooling

```typescript
// Supabase handles connection pooling automatically
// But you can configure it for specific needs
const supabase = createClient(url, key, {
    db: {
        pool: {
            min: 2,
            max: 10
        }
    }
});
```

## Monitoring and Debugging

### Query Performance

```typescript
const startTime = Date.now();
const { data, error } = await supabase.from('table_name').select('*');
const duration = Date.now() - startTime;

if (duration > 1000) {
    logger.warn(`Slow query detected: ${duration}ms`);
}
```

### Error Tracking

```typescript
// Track database errors for monitoring
const { data, error } = await supabase.from('table_name').select('*');

if (error) {
    logger.error(`Database error: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        table: 'table_name',
        operation: 'select'
    });
}
```

### Connection Health

```typescript
// Check database connection health
const { data, error } = await supabase
    .from('health_check')
    .select('1')
    .limit(1);

if (error) {
    logger.error(`Database connection failed: ${error.message}`);
    // Implement fallback or alerting
}
``` 