# Logging System Guide

This guide explains the logging system used in the backend, including log levels, controller logging, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Logger Configuration](#logger-configuration)
3. [Log Levels](#log-levels)
4. [Controller Logger](#controller-logger)
5. [Best Practices](#best-practices)
6. [Monitoring and Debugging](#monitoring-and-debugging)
7. [Production Considerations](#production-considerations)

## Overview

The logging system uses Winston for structured logging with multiple transports and configurable log levels. It provides:

- **Structured Logging**: Consistent log format with timestamps
- **Multiple Transports**: Console and file-based logging
- **Log Levels**: Different levels for different types of information
- **Controller-Specific Logging**: Contextual logging for each controller
- **Environment-Based Configuration**: Different settings for development and production

## Logger Configuration

### Main Logger Setup

```typescript
import winston from 'winston';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'production';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston that we want to link the colors
winston.addColors(colors);

// Custom format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf((info) => {
        const colorizer = winston.format.colorize();
        const levelColored = colorizer.colorize(info.level, info.level.toUpperCase());
        return `[${info.timestamp}][${levelColored}] ${info.message}`;
    }),
);

// Define transports
const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
```

### Environment-Based Configuration

```typescript
// Development environment
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
    // More verbose logging in development
    logger.level = 'debug';
} else {
    // Less verbose logging in production
    logger.level = 'warn';
}
```

## Log Levels

### Error (0)

Critical errors that require immediate attention:

```typescript
logger.error(`Database connection failed: ${error.message}`);
logger.error(`Authentication failed for user ${userId}: ${error.message}`);
logger.error(`Unexpected error in controller: ${error}`);
```

**Use for:**
- Database connection failures
- Authentication errors
- Unhandled exceptions
- System failures

### Warn (1)

Warning conditions that should be monitored:

```typescript
logger.warn(`User ${userId} attempted unauthorized access to ${resource}`);
logger.warn(`Slow query detected: ${duration}ms`);
logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
```

**Use for:**
- Security warnings
- Performance issues
- Rate limiting
- Deprecated feature usage

### Info (2)

General information about application flow:

```typescript
logger.info(`User ${userId} (${userType}) accessed ${endpoint}`);
logger.info(`Successfully processed ${count} records`);
logger.info(`Server started on port ${port}`);
```

**Use for:**
- Successful operations
- User actions
- System events
- Business logic flow

### HTTP (3)

HTTP request/response logging:

```typescript
logger.http(`${req.method} ${req.path} - ${res.statusCode} ${duration}ms`);
logger.http(`Request from ${req.ip} to ${req.path}`);
logger.http(`Response time: ${duration}ms for ${req.path}`);
```

**Use for:**
- HTTP request logging
- Response time monitoring
- API usage tracking

### Debug (4)

Detailed debugging information:

```typescript
logger.debug(`Processing request data: ${JSON.stringify(req.body)}`);
logger.debug(`Database query: ${query}`);
logger.debug(`Cache hit for key: ${cacheKey}`);
```

**Use for:**
- Detailed debugging
- Request/response data
- Database queries
- Cache operations

## Controller Logger

### Creating Controller Loggers

```typescript
import { createControllerLogger } from '../utils/controller_logger';

const logger = createControllerLogger('Avaliacao', 'Controller');
```

### Controller Logger Class

```typescript
export class ControllerLogger {
    private controller: string;
    private endpoint: string;

    constructor(controller: string, endpoint: string) {
        this.controller = controller;
        this.endpoint = endpoint;
    }

    private formatMessage(message: string): string {
        return `[${this.controller}][${this.endpoint}] ${message}`;
    }

    info(message: string): void {
        logger.info(this.formatMessage(message));
    }

    error(message: string): void {
        logger.error(this.formatMessage(message));
    }

    warn(message: string): void {
        logger.warn(this.formatMessage(message));
    }

    http(message: string): void {
        logger.http(this.formatMessage(message));
    }

    debug(message: string): void {
        logger.debug(this.formatMessage(message));
    }
}
```

### Usage in Controllers

```typescript
const logger = createControllerLogger('Avaliacao', 'Controller');

export const AvaliacaoController: EndpointController = {
    name: 'avaliacoes',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                logger.info(`Fetching avaliações for user ${req.user?.id}`);
                
                const { data, error } = await supabase
                    .from('avaliacoes')
                    .select('*');

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully fetched ${data?.length || 0} avaliações`);
                return res.json(data || []);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),
    }
};
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Good: Use appropriate levels
logger.info(`User ${userId} logged in successfully`);
logger.warn(`Slow query detected: ${duration}ms`);
logger.error(`Database connection failed: ${error.message}`);

// Avoid: Using wrong levels
logger.error(`User ${userId} logged in successfully`); // Should be info
logger.info(`Database connection failed: ${error.message}`); // Should be error
```

### 2. Include Context in Log Messages

```typescript
// Good: Include relevant context
logger.info(`User ${userId} (${userType}) accessed ${endpoint}`);
logger.error(`Failed to process request for user ${userId}: ${error.message}`);

// Avoid: Generic messages
logger.info('Request processed');
logger.error('Error occurred');
```

### 3. Log Performance Metrics

```typescript
const startTime = Date.now();

// ... perform operation

const duration = Date.now() - startTime;
logger.info(`Operation completed in ${duration}ms`);

if (duration > 1000) {
    logger.warn(`Slow operation detected: ${duration}ms`);
}
```

### 4. Log Security Events

```typescript
// Log authentication attempts
logger.info(`Authentication attempt for email: ${email}`);

// Log failed attempts
logger.warn(`Failed authentication attempt for email: ${email}`);

// Log successful authentication
logger.info(`Successful authentication for user: ${userId} (${userType})`);

// Log unauthorized access attempts
logger.warn(`Unauthorized access attempt by user ${userId} to ${resource}`);
```

### 5. Handle Sensitive Data

```typescript
// Good: Log without sensitive data
logger.info(`User ${userId} updated profile`);

// Avoid: Logging sensitive information
logger.info(`User ${userId} updated password to ${password}`);

// Good: Mask sensitive data
logger.info(`User ${userId} updated email to ${maskEmail(email)}`);
```

### 6. Use Structured Logging

```typescript
// Good: Structured logging
logger.info(`Database operation`, {
    operation: 'select',
    table: 'users',
    userId: userId,
    duration: duration
});

// Avoid: String concatenation
logger.info(`Database operation: select from users for user ${userId} took ${duration}ms`);
```

### 7. Log Errors with Stack Traces

```typescript
try {
    // ... operation
} catch (error) {
    logger.error(`Operation failed: ${error.message}`, {
        stack: error.stack,
        userId: req.user?.id,
        endpoint: req.path
    });
}
```

## Monitoring and Debugging

### Performance Monitoring

```typescript
// Monitor slow operations
const startTime = Date.now();
const { data, error } = await supabase.from('table').select('*');
const duration = Date.now() - startTime;

if (duration > 500) {
    logger.warn(`Slow database query: ${duration}ms`, {
        table: 'table',
        operation: 'select',
        duration: duration
    });
}
```

### Error Tracking

```typescript
// Track errors with context
if (error) {
    logger.error(`Database error`, {
        code: error.code,
        message: error.message,
        table: 'table_name',
        operation: 'select',
        userId: req.user?.id
    });
}
```

### Request Tracking

```typescript
// Log all requests
logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    duration: Date.now() - startTime
});
```

### Debug Information

```typescript
// Enable debug logging for troubleshooting
if (process.env.NODE_ENV === 'development') {
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
    logger.debug(`Query parameters: ${JSON.stringify(req.query)}`);
    logger.debug(`Database query: ${query}`);
}
```

## Production Considerations

### Log Rotation

```typescript
// Configure log rotation
const transports = [
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    new winston.transports.File({
        filename: 'logs/all.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
```

### Log Aggregation

```typescript
// Send logs to external service in production
if (process.env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.Http({
            host: 'log-aggregator.example.com',
            port: 80,
            path: '/logs'
        })
    );
}
```

### Environment-Specific Logging

```typescript
// Different log levels for different environments
const getLogLevel = () => {
    switch (process.env.NODE_ENV) {
        case 'development':
            return 'debug';
        case 'staging':
            return 'info';
        case 'production':
            return 'warn';
        default:
            return 'info';
    }
};
```

### Security Logging

```typescript
// Log security events
const logSecurityEvent = (event: string, details: any) => {
    logger.warn(`Security event: ${event}`, {
        ...details,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
};

// Usage
logSecurityEvent('Failed login attempt', {
    email: email,
    reason: 'Invalid credentials'
});
```

### Health Check Logging

```typescript
// Log system health
const logHealthCheck = () => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    logger.info('Health check', {
        memoryUsage: {
            rss: memoryUsage.rss,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal
        },
        uptime: uptime,
        timestamp: new Date().toISOString()
    });
};
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check log level configuration
2. **Performance issues**: Reduce log verbosity in production
3. **Disk space**: Configure log rotation
4. **Missing context**: Ensure controller loggers are properly initialized

### Debug Commands

```bash
# View all logs
tail -f logs/all.log

# View error logs only
tail -f logs/error.log

# Search for specific user
grep "user_123" logs/all.log

# Search for errors
grep "ERROR" logs/all.log

# Monitor real-time logs
tail -f logs/all.log | grep "Avaliacao"
```

### Log Analysis

```typescript
// Analyze log patterns
const analyzeLogs = (logFile: string) => {
    const fs = require('fs');
    const logs = fs.readFileSync(logFile, 'utf8').split('\n');
    
    const errorCount = logs.filter(log => log.includes('ERROR')).length;
    const warnCount = logs.filter(log => log.includes('WARN')).length;
    const infoCount = logs.filter(log => log.includes('INFO')).length;
    
    console.log(`Errors: ${errorCount}, Warnings: ${warnCount}, Info: ${infoCount}`);
};
``` 