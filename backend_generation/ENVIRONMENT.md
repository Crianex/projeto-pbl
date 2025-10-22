# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in the backend architecture. Proper configuration of these variables is essential for the system to function correctly.

## Required Variables

### Supabase Configuration

These variables are required for database connectivity and authentication.

#### SUPABASE_URL
- **Description**: The URL of your Supabase project
- **Format**: `https://your-project-ref.supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Where to find**: Supabase Dashboard → Project Settings → API → Project URL
- **Required**: Yes

#### SUPABASE_SERVICE_ROLE_KEY
- **Description**: The service role key for Supabase authentication
- **Format**: Long string starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Project Settings → API → Service Role Key
- **Required**: Yes
- **Security**: Keep this secret - it has admin privileges

## Optional Variables

### Application Configuration

#### NODE_ENV
- **Description**: Application environment mode
- **Values**: `development`, `production`, `test`
- **Default**: `production`
- **Usage**: Controls logging levels, error handling, and optimizations
- **Example**: `NODE_ENV=development`

#### PORT
- **Description**: Port number for the Express server
- **Default**: `5919`
- **Example**: `PORT=3000`
- **Usage**: Override the default port if needed

### Git Configuration

#### GIT_BRANCH
- **Description**: Git branch to monitor for auto-updates
- **Default**: `main`
- **Example**: `GIT_BRANCH=develop`
- **Usage**: Specifies which branch the auto-update system should monitor

#### GIT_DISCOVERY_ACROSS_FILESYSTEM
- **Description**: Allows git to work across filesystem boundaries
- **Values**: `1`, `0`
- **Default**: `1`
- **Usage**: Required for git operations in Docker containers with mounted volumes

### Python Configuration (Docker)

#### PYTHONUNBUFFERED
- **Description**: Ensures Python output is not buffered
- **Values**: `1`, `0`
- **Default**: `1`
- **Usage**: Required for real-time log output in Docker containers

#### PYTHONIOENCODING
- **Description**: Sets proper encoding for Python output
- **Default**: `utf-8`
- **Usage**: Ensures proper character encoding for log output

#### PYTHONUSERBASE
- **Description**: Base directory for Python user packages
- **Default**: `/app/.local`
- **Usage**: Docker-specific Python package installation directory

#### PIP_USER
- **Description**: Install Python packages to user directory
- **Values**: `1`, `0`
- **Default**: `1`
- **Usage**: Docker-specific Python package installation

## Docker-Specific Variables

### Container Configuration

#### DOCKER_ENV
- **Description**: Indicates if running inside Docker container
- **Values**: `1`, `0`
- **Usage**: Automatically set by Docker, used for conditional logic

### Volume Configuration

#### LOGS_DIR
- **Description**: Directory for application logs
- **Default**: `/app/backend/logs`
- **Usage**: Docker volume mount point for logs

#### DIST_DIR
- **Description**: Directory for compiled TypeScript
- **Default**: `/app/backend/dist`
- **Usage**: Docker volume mount point for compiled code

## Environment File Structure

### Development Environment (.env)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=development
PORT=5919

# Git Configuration
GIT_BRANCH=main
GIT_DISCOVERY_ACROSS_FILESYSTEM=1

# Python Configuration
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

### Production Environment (.env)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=production
PORT=5919

# Git Configuration
GIT_BRANCH=main
GIT_DISCOVERY_ACROSS_FILESYSTEM=1

# Python Configuration
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
PYTHONUSERBASE=/app/.local
PIP_USER=1
```

### Docker Compose Environment

```yaml
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=production
      - PYTHONUNBUFFERED=1
      - PYTHONIOENCODING=utf-8
      - GIT_DISCOVERY_ACROSS_FILESYSTEM=1
    env_file:
      - backend/.env
```

## Environment Variable Loading

### Node.js Application

The application loads environment variables using dotenv:

```typescript
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Access variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### Docker Container

Environment variables are loaded in the Docker entrypoint:

```bash
#!/bin/bash

# Load environment variables
source /app/backend/.env

# Use variables in commands
COMMAND="cd /app/backend/ && python start_and_monitor.py --branch ${GIT_BRANCH:-main}"
```

### Validation

The application validates required environment variables:

```typescript
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
```

## Security Considerations

### 1. Sensitive Data Protection

**Never commit sensitive data to version control:**

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
echo "backend/.env" >> .gitignore
```

### 2. Service Role Key Security

The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges:

- **Never expose in client-side code**
- **Use only in server-side applications**
- **Rotate regularly**
- **Monitor usage in Supabase dashboard**

### 3. Environment-Specific Configuration

Use different values for different environments:

```bash
# Development
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dev-service-role-key

# Production
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
```

### 4. Docker Security

When using Docker, ensure environment variables are properly secured:

```yaml
# Use env_file instead of environment for sensitive data
services:
  backend:
    env_file:
      - backend/.env  # File-based configuration
    environment:
      - NODE_ENV=production  # Non-sensitive variables only
```

## Configuration Examples

### 1. Local Development Setup

```bash
# backend/.env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development
PORT=5919
GIT_BRANCH=main
```

### 2. Docker Development Setup

```bash
# backend/.env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development
GIT_BRANCH=main
GIT_DISCOVERY_ACROSS_FILESYSTEM=1
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

### 3. Production Setup

```bash
# backend/.env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
GIT_BRANCH=main
GIT_DISCOVERY_ACROSS_FILESYSTEM=1
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
PYTHONUSERBASE=/app/.local
PIP_USER=1
```

## Troubleshooting

### 1. Missing Environment Variables

**Error**: `Missing required environment variables: SUPABASE_URL`

**Solution**:
1. Check if `.env` file exists in `backend/` directory
2. Verify variable names are spelled correctly
3. Ensure no extra spaces or quotes around values
4. Check file permissions

### 2. Invalid Supabase URL

**Error**: `Invalid Supabase URL`

**Solution**:
1. Verify URL format: `https://project-ref.supabase.co`
2. Check if project is active in Supabase dashboard
3. Ensure URL is accessible from your network

### 3. Authentication Errors

**Error**: `Invalid service role key`

**Solution**:
1. Verify service role key is correct
2. Check if key has expired
3. Ensure key has proper permissions
4. Test connection in Supabase dashboard

### 4. Docker Environment Issues

**Error**: Environment variables not loaded in Docker

**Solution**:
1. Check `env_file` configuration in docker-compose.yml
2. Verify file path is correct
3. Ensure file exists and is readable
4. Check Docker volume mounts

## Best Practices

### 1. Environment Management

- **Use .env files for local development**
- **Use Docker secrets for production**
- **Never commit sensitive data to version control**
- **Use different configurations for different environments**

### 2. Variable Naming

- **Use UPPERCASE for environment variables**
- **Use underscores to separate words**
- **Use descriptive names**
- **Follow consistent naming conventions**

### 3. Security

- **Rotate sensitive keys regularly**
- **Use least privilege principle**
- **Monitor key usage**
- **Implement proper access controls**

### 4. Documentation

- **Document all environment variables**
- **Provide examples and defaults**
- **Explain security implications**
- **Keep documentation up to date**

## Validation Script

Create a validation script to check environment configuration:

```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating environment configuration..."

# Check required variables
required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ All required environment variables are set"
else
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

# Validate Supabase URL format
if [[ $SUPABASE_URL =~ ^https://[a-zA-Z0-9]+\.supabase\.co$ ]]; then
    echo "✅ Supabase URL format is valid"
else
    echo "❌ Invalid Supabase URL format"
    exit 1
fi

echo "🎉 Environment configuration is valid!"
```

## Next Steps

1. **Set Up Supabase**: [QUICKSTART.md](./QUICKSTART.md)
2. **Configure Infrastructure**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
3. **Set Up Monitoring**: [MONITORING.md](./MONITORING.md)
4. **Develop Controllers**: [CONTROLLERS.md](./CONTROLLERS.md)

This environment configuration provides a secure, flexible foundation for deploying the backend architecture across different environments.
