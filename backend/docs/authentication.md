# Authentication System Guide

This guide explains the authentication system used in the backend, including user types, token validation, and security considerations.

## Table of Contents

1. [Overview](#overview)
2. [User Types](#user-types)
3. [Authentication Flow](#authentication-flow)
4. [Token Validation](#token-validation)
5. [User Validation Functions](#user-validation-functions)
6. [Security Considerations](#security-considerations)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

The authentication system supports three user types with different permission levels:

- **Aluno** (Student): Can access student-specific features
- **Professor** (Professor): Can access professor-specific features
- **Coordenador** (Coordinator): Has administrative access

The system uses JWT tokens from Supabase for authentication and validates users against the database.

## User Types

### Aluno (Student)

```typescript
interface AuthUser {
    id: number;           // aluno.id_aluno
    email: string;        // aluno.email
    nome_completo: string; // aluno.nome_completo
    type: 'aluno';
}
```

**Permissions:**
- Access student-specific endpoints
- View their own data
- Submit evaluations
- Access assigned problems

### Professor

```typescript
interface AuthUser {
    id: number;           // professor.id_professor
    email: string;        // professor.email
    nome_completo: string; // professor.nome_completo
    type: 'professor';
}
```

**Permissions:**
- Access professor-specific endpoints
- Manage classes and problems
- View student evaluations
- Generate reports

### Coordenador (Coordinator)

```typescript
interface AuthUser {
    id: number;           // coordenador.id_coordenador
    email: string;        // coordenador.email
    nome_completo: string; // Always empty string
    type: 'coordenador';
}
```

**Permissions:**
- Administrative access
- System-wide operations
- User management

## Authentication Flow

### 1. Token Extraction

```typescript
const authorization = req.headers["authorization"];
if (!authorization) {
    return null; // No token provided
}

let token = authorization;
if (token.startsWith("Bearer ")) {
    token = token.slice(7);
}
```

### 2. Token Validation

```typescript
// Try Supabase auth validation
const { data, error } = await supabase.auth.getUser(token);

if (error) {
    // Fallback to JWT decode
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        return { user: { id: payload.sub, email: payload.email }, email: payload.email };
    }
}
```

### 3. User Lookup

```typescript
// Check in database by email
const { data: user, error } = await supabase
    .from('table_name')
    .select('id, email, nome_completo')
    .eq('email', email)
    .single();
```

### 4. Type Validation

```typescript
// Verify user type matches required permissions
if (user) {
    return {
        id: user.id,
        email: user.email,
        nome_completo: user.nome_completo,
        type: 'user_type'
    };
}
```

## Token Validation

### Primary Method: Supabase Auth

```typescript
const { data, error } = await supabase.auth.getUser(token);

if (error) {
    logger.error(`Supabase auth error: ${error.message}`);
    return null;
}

if (!data.user || !data.user.email) {
    logger.error('No user or email found in token');
    return null;
}

return { user: data.user, email: data.user.email };
```

### Fallback Method: JWT Decode

```typescript
try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        if (payload.email) {
            logger.info(`Token validated via JWT decode - email: ${payload.email}`);
            return {
                user: { id: payload.sub, email: payload.email },
                email: payload.email
            };
        }
    }
} catch (decodeError) {
    logger.error(`Failed to decode JWT token: ${decodeError}`);
    return null;
}
```

## User Validation Functions

### validateAuthToken

Validates the authentication token and returns user information:

```typescript
const authResult = await Utils.validateAuthToken(req);
if (!authResult) {
    return res.status(401).json({ error: 'Invalid token' });
}

const { user, email } = authResult;
```

### validateUser

Validates any authenticated user (aluno, professor, or coordenador):

```typescript
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}

// Check user type
if (authUser.type === 'aluno') {
    // Handle student logic
} else if (authUser.type === 'professor') {
    // Handle professor logic
}
```

### validateAluno

Validates that the user is specifically a student:

```typescript
const aluno = await Utils.validateAluno(req);
if (!aluno) {
    return res.status(401).json({ error: 'Student access required' });
}
```

### validateProfessor

Validates that the user is specifically a professor:

```typescript
const professor = await Utils.validateProfessor(req);
if (!professor) {
    return res.status(401).json({ error: 'Professor access required' });
}
```

### validateCoordenador

Validates that the user is specifically a coordinator:

```typescript
const coordenador = await Utils.validateCoordenador(req);
if (!coordenador) {
    return res.status(401).json({ error: 'Coordinator access required' });
}
```

## Security Considerations

### Token Security

```typescript
// Validate token format
if (typeof authorization !== "string") {
    logger.error(`Authorization header is not a string: ${authorization}`);
    return null;
}

// Check token structure
if (!token || token.length < 10) {
    logger.error('Token too short or invalid');
    return null;
}
```

### Rate Limiting

```typescript
// Implement rate limiting for authentication attempts
const authAttempts = getAuthAttempts(ipAddress);
if (authAttempts > MAX_AUTH_ATTEMPTS_PER_MINUTE) {
    logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
    return res.status(429).json({ error: 'Too many authentication attempts' });
}
```

### Logging Security Events

```typescript
// Log authentication attempts
logger.info(`Authentication attempt for email: ${email}`);

// Log failed attempts
logger.warn(`Failed authentication attempt for email: ${email}`);

// Log successful authentication
logger.info(`Successful authentication for user: ${user.id} (${user.type})`);
```

## Error Handling

### Common Authentication Errors

```typescript
// Missing token
if (!authorization) {
    return res.status(401).json({ error: 'Authorization header required' });
}

// Invalid token format
if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid token format' });
}

// Token validation failed
if (!authResult) {
    return res.status(401).json({ error: 'Invalid or expired token' });
}

// User not found in database
if (!user) {
    return res.status(401).json({ error: 'User not found' });
}

// Insufficient permissions
if (user.type !== requiredType) {
    return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Database Errors

```typescript
try {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        logger.error(`Database error during authentication: ${error.message}`);
        return res.status(500).json({ error: 'Authentication service unavailable' });
    }
} catch (err) {
    logger.error(`Unexpected error during authentication: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
}
```

## Best Practices

### 1. Always Validate Authentication

```typescript
// In every protected endpoint
const authUser = await Utils.validateUser(req);
if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### 2. Use Specific Validation When Needed

```typescript
// For professor-only endpoints
const professor = await Utils.validateProfessor(req);
if (!professor) {
    return res.status(401).json({ error: 'Professor access required' });
}
```

### 3. Log Authentication Events

```typescript
logger.info(`User ${authUser.id} (${authUser.type}) accessed ${req.path}`);
logger.error(`Authentication failed for ${email}: ${error.message}`);
```

### 4. Handle Token Expiration

```typescript
// Check token expiration
const tokenExp = payload.exp * 1000; // Convert to milliseconds
if (Date.now() > tokenExp) {
    return res.status(401).json({ error: 'Token expired' });
}
```

### 5. Implement Proper Error Messages

```typescript
// Don't expose internal details
return res.status(401).json({ error: 'Authentication failed' });

// Instead of
return res.status(401).json({ error: `Database error: ${error.message}` });
```

### 6. Use HTTPS in Production

```typescript
// Ensure tokens are transmitted securely
if (process.env.NODE_ENV === 'production' && !req.secure) {
    logger.warn('Insecure authentication attempt');
    return res.status(400).json({ error: 'HTTPS required' });
}
```

### 7. Implement Session Management

```typescript
// Track active sessions
const sessionId = generateSessionId();
activeSessions.set(authUser.id, sessionId);

// Validate session
const currentSession = activeSessions.get(authUser.id);
if (currentSession !== sessionId) {
    return res.status(401).json({ error: 'Session expired' });
}
```

## Middleware Usage

### Express Middleware

```typescript
// Require any authenticated user
app.use('/protected', Utils.requireAuth);

// Require specific user type
app.use('/professor', Utils.requireProfessorAuth);
app.use('/aluno', Utils.requireAlunoAuth);
```

### Custom Middleware

```typescript
const requireCoordinatorAuth = (req: Request, res: Response, next: NextFunction) => {
    Utils.validateCoordenador(req).then(user => {
        if (!user) {
            return res.status(401).json({ error: 'Coordinator access required' });
        }
        req.user = user;
        next();
    }).catch(error => {
        logger.error(`Error in requireCoordinatorAuth: ${error}`);
        return res.status(500).json({ error: 'Internal server error' });
    });
};
```

## Testing Authentication

### Unit Tests

```typescript
describe('Authentication', () => {
    it('should validate valid tokens', async () => {
        // Test implementation
    });
    
    it('should reject invalid tokens', async () => {
        // Test implementation
    });
    
    it('should handle expired tokens', async () => {
        // Test implementation
    });
});
```

### Integration Tests

```typescript
describe('Protected Endpoints', () => {
    it('should require authentication', async () => {
        // Test implementation
    });
    
    it('should enforce role-based access', async () => {
        // Test implementation
    });
});
```

## Troubleshooting

### Common Issues

1. **Token not found**: Check Authorization header format
2. **Invalid token**: Verify token is properly formatted JWT
3. **User not found**: Check database for user with matching email
4. **Permission denied**: Verify user type matches required permissions
5. **Database errors**: Check Supabase connection and table structure

### Debug Logging

```typescript
// Enable debug logging for authentication issues
logger.debug(`Token validation attempt: ${token.substring(0, 20)}...`);
logger.debug(`User lookup for email: ${email}`);
logger.debug(`Authentication result: ${JSON.stringify(authUser)}`);
``` 