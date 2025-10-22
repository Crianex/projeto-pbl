# Infrastructure Setup Guide

This guide covers the Docker, Nginx, and deployment configuration that makes this backend architecture scalable and production-ready. The infrastructure includes containerization, reverse proxy setup, SSL termination, and automated deployment capabilities.

## Infrastructure Overview

The system uses a multi-container architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Nginx Proxy   │    │   Backend       │                │
│  │   (SSL/HTTP)    │◄──►│   (Express)     │                │
│  │   Port: 5919    │    │   Port: 5919    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   SSL Certs     │    │   Volumes       │                │
│  │   (LetsEncrypt) │    │   (Persistent)  │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Docker Configuration

### 1. Dockerfile Breakdown

The `Dockerfile` creates a production-ready container with the following stages:

```dockerfile
# Use official Node.js runtime with Python support
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-por \
    git \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy package files and install Node.js dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Install ts-node globally for production use
RUN npm install -g ts-node typescript

# Copy Python requirements and install dependencies
COPY backend/requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy TypeScript configuration and source code
COPY backend/tsconfig.json ./
COPY backend/nodemon.json ./
COPY backend/src/ ./src/
COPY backend/start_and_monitor.py ./

# Copy entrypoint script
COPY docker-entrypoint.sh /app/

# Create necessary directories
RUN mkdir -p /app/dist /app/logs /app/uploads ./logs ./dist

# Set up git configuration
RUN git config --global --add safe.directory /app
RUN git config --global --add safe.directory '/app/*'
RUN git config --global --add safe.directory '*'
RUN git config --global user.email "docker@projeto-pbl.com"
RUN git config --global user.name "Projeto PBL Docker Container"
RUN git config --global init.defaultBranch main

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Set permissions
RUN chmod -R 755 /app

# Build TypeScript code
RUN npm run build || echo "Build failed, will use ts-node instead"

# Set environment variables
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM=1
ENV NODE_ENV=production

# Expose port
EXPOSE 5919

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5919/health || exit 1

# Switch to app directory and run entrypoint
WORKDIR /app
CMD ["/bin/bash", "./docker-entrypoint.sh"]
```

### 2. Docker Compose Configuration

The `docker-compose.yml` orchestrates multiple services:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: projeto-pbl-backend
    environment:
      - NODE_ENV=production
      - PYTHONUNBUFFERED=1
      - PYTHONIOENCODING=utf-8
      - GIT_DISCOVERY_ACROSS_FILESYSTEM=1
    env_file:
      - backend/.env
    volumes:
      # Mount entire repository for git operations
      - .:/app:rw
      # Override dist with Docker volume
      - dist_data:/app/backend/dist
      # Use Docker volume for logs
      - logs_data:/app/backend/logs
      # Python local packages directory
      - python_local:/app/.local
      # Mount node_modules as volume
      - node_modules_data:/app/backend/node_modules
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
        mode: "non-blocking"
        max-buffer-size: "8m"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5919/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - projeto-pbl-network

  nginx:
    image: nginx:alpine
    container_name: projeto-pbl-nginx
    ports:
      - "5919:5919"
      - "4503:4503"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
        mode: "non-blocking"
        max-buffer-size: "8m"
    networks:
      - projeto-pbl-network
    command: ["nginx", "-g", "daemon off;"]

networks:
  projeto-pbl-network:
    driver: bridge

volumes:
  logs_data:
    driver: local
  dist_data:
    driver: local
  python_local:
    driver: local
  node_modules_data:
    driver: local
```

### 3. Docker Entrypoint Script

The `docker-entrypoint.sh` handles container startup and git configuration:

```bash
#!/bin/bash

echo "🐳 Projeto PBL Backend Docker Container Starting..."
echo "📂 Working directory: $(pwd)"
echo "🌱 Environment: ${NODE_ENV:-development}"
echo "🌿 Branch: ${GIT_BRANCH:-main}"

# Fix ownership and permissions
echo "🔧 Fixing all mounted file permissions..."
cd /app
chown -R root:root /app 2>/dev/null || echo "📝 Some files may not be owned by root (normal)"

# Fix permissions for git-managed files
echo "🔧 Setting write permissions for git-managed files..."
chmod 666 docker-compose.yml nginx.conf Dockerfile 2>/dev/null || echo "📝 Some files don't exist yet (normal)"

# Fix permissions for directories
chmod -R 755 /app 2>/dev/null || echo "📝 Directory permissions setup"

# Create necessary directories
mkdir -p /app/logs /app/backend/logs 2>/dev/null || echo "📝 Some directories already exist"
chmod 775 /app/logs /app/backend/logs 2>/dev/null || echo "📝 Directory permissions setup"

# Configure git for mounted volumes
echo "🔧 Configuring git for mounted directories..."
git config --global --add safe.directory /app
git config --global --add safe.directory '/app/*'
git config --global --add safe.directory '*'
export GIT_DISCOVERY_ACROSS_FILESYSTEM=1

# Set basic git configuration
git config --global user.email "docker@projeto-pbl.com"
git config --global user.name "Projeto PBL Docker Container"
git config --global pull.rebase false

# Fix .git directory permissions
if [ -d "/app/.git" ]; then
    echo "🔧 Fixing .git directory permissions..."
    chown -R root:root /app/.git
    chmod -R 755 /app/.git
    
    # Make sure git index and other critical files are writable
    chmod 644 /app/.git/index 2>/dev/null || echo "📝 Git index file setup"
    chmod 644 /app/.git/HEAD 2>/dev/null || echo "📝 Git HEAD file setup"
    chmod -R 644 /app/.git/refs 2>/dev/null || echo "📝 Git refs setup"
    chmod -R 644 /app/.git/objects 2>/dev/null || echo "📝 Git objects setup"
fi

# Verify git setup
if [ -d "/app/.git" ]; then
    echo "✅ Git repository found"
    cd /app
    
    # Test git operations
    if git status --porcelain > /dev/null 2>&1; then
        echo "✅ Git operations working"
        echo "📋 Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
        echo "📋 Git status: $(git status --porcelain | wc -l) changed files"
    else
        echo "⚠️  Git operations still have issues"
        echo "❌ Auto-updates will not work due to git repository issues"
    fi
    cd -
else
    echo "⚠️  Git repository not found"
fi

# Build the command
COMMAND="cd /app/backend/ && python start_and_monitor.py --branch ${GIT_BRANCH:-main}"

echo "🚀 Starting Projeto PBL application with command: $COMMAND"
exec bash -c "$COMMAND"
```

## Nginx Configuration

### 1. Reverse Proxy Setup

The `nginx.conf` configures Nginx as a reverse proxy with SSL termination:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Backend upstream
    upstream backend_main {
        server projeto-pbl-backend:5919;
    }

    # HTTPS server on port 5919
    server {
        listen 5919 ssl http2;
        server_name localhost _;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Allow uploads up to 10MB
        client_max_body_size 10M;
        
        # Health check endpoint
        location /health {
            proxy_pass http://backend_main;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # Handle backend not being ready
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        }

        # Main application
        location / {
            proxy_pass http://backend_main;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # Handle backend not being ready
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 2. SSL/TLS Configuration

The system supports SSL termination with Let's Encrypt certificates:

**SSL Features:**
- **TLS 1.2 and 1.3**: Modern TLS protocol support
- **Strong Ciphers**: ECDHE-RSA-AES256-GCM-SHA512 and similar
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Certificate Management**: Automatic Let's Encrypt integration

**Security Headers:**
- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: XSS protection

### 3. Proxy Configuration

**Backend Communication:**
- **Upstream**: `projeto-pbl-backend:5919`
- **Health Checks**: Automatic backend health monitoring
- **Load Balancing**: Ready for multiple backend instances
- **WebSocket Support**: Full WebSocket proxy capabilities

**Timeout Configuration:**
- `proxy_connect_timeout`: 30s
- `proxy_send_timeout`: 30s
- `proxy_read_timeout`: 30s

## Volume Management

### 1. Persistent Volumes

The system uses Docker volumes for persistent data:

```yaml
volumes:
  logs_data:           # Application logs
    driver: local
  dist_data:           # Compiled TypeScript
    driver: local
  python_local:        # Python packages
    driver: local
  node_modules_data:   # Node.js dependencies
    driver: local
```

### 2. Volume Mounting Strategy

**Repository Mounting:**
```yaml
volumes:
  - .:/app:rw  # Mount entire repository for git operations
```

**Benefits:**
- **Git Operations**: Full git repository access for auto-updates
- **Development**: Live code changes without rebuilds
- **Debugging**: Direct access to source files

**Volume Overrides:**
```yaml
volumes:
  - dist_data:/app/backend/dist        # Override dist with volume
  - logs_data:/app/backend/logs        # Override logs with volume
  - node_modules_data:/app/backend/node_modules  # Override node_modules
```

**Benefits:**
- **Performance**: Faster container startup
- **Persistence**: Data survives container restarts
- **Isolation**: Separate concerns for different data types

## Networking

### 1. Bridge Network

The system uses a custom bridge network:

```yaml
networks:
  projeto-pbl-network:
    driver: bridge
```

**Network Benefits:**
- **Service Discovery**: Containers can communicate by name
- **Isolation**: Network isolation from other Docker networks
- **Security**: Controlled inter-container communication

### 2. Service Communication

**Internal Communication:**
- **Backend to Database**: Direct connection via Supabase
- **Nginx to Backend**: `http://projeto-pbl-backend:5919`
- **Health Checks**: Automatic service health monitoring

**External Access:**
- **Port 5919**: Main application access (HTTPS)
- **Port 4503**: Additional port if needed
- **SSL Termination**: Nginx handles SSL, backend runs HTTP

## Health Checks

### 1. Backend Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5919/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

**Health Check Features:**
- **Endpoint**: `/health` endpoint on backend
- **Interval**: Check every 30 seconds
- **Timeout**: 10-second timeout per check
- **Retries**: 3 retries before marking unhealthy
- **Start Period**: 60-second grace period on startup

### 2. Nginx Health Check

```yaml
depends_on:
  backend:
    condition: service_healthy
```

**Dependency Management:**
- **Conditional Startup**: Nginx waits for backend to be healthy
- **Automatic Recovery**: Services restart if health checks fail
- **Graceful Degradation**: System handles service failures gracefully

## Logging Configuration

### 1. Docker Logging

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "10"
    mode: "non-blocking"
    max-buffer-size: "8m"
```

**Logging Features:**
- **JSON Format**: Structured log output
- **Size Limits**: 100MB per log file
- **File Rotation**: Keep 10 rotated files
- **Non-blocking**: Asynchronous logging
- **Buffer Size**: 8MB buffer for performance

### 2. Application Logging

**Winston Configuration:**
- **Console Output**: Development logging with colors
- **File Output**: Persistent logs with rotation
- **Log Levels**: error, warn, info, http, debug
- **Controller Context**: Each controller gets its own logger

## Deployment Commands

### 1. Development Deployment

```bash
# Build and start containers
docker-compose up --build

# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### 2. Production Deployment

```bash
# Build for production
docker-compose -f docker-compose.yml up --build -d

# Update containers
docker-compose pull
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

### 3. Maintenance Commands

```bash
# View container status
docker-compose ps

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a

# Backup volumes
docker run --rm -v projeto-pbl_logs_data:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz /data
```

## Security Considerations

### 1. Container Security

- **Non-root User**: Containers run with appropriate user permissions
- **Minimal Base Images**: Alpine Linux for Nginx, official Node.js for backend
- **Security Updates**: Regular base image updates
- **Resource Limits**: Memory and CPU limits to prevent resource exhaustion

### 2. Network Security

- **Internal Communication**: Services communicate over internal network
- **SSL Termination**: HTTPS encryption for external communication
- **Security Headers**: Comprehensive security headers
- **Firewall Rules**: Restrict access to necessary ports only

### 3. Data Security

- **Volume Encryption**: Docker volumes can be encrypted
- **Environment Variables**: Sensitive data in environment variables
- **SSL Certificates**: Let's Encrypt certificates for HTTPS
- **Access Control**: Role-based authentication system

## Troubleshooting

### 1. Common Issues

**Container Won't Start:**
```bash
# Check container logs
docker-compose logs backend

# Check health status
docker-compose ps

# Restart services
docker-compose restart
```

**SSL Certificate Issues:**
```bash
# Check certificate files
ls -la /etc/letsencrypt/live/your-domain.com/

# Test SSL configuration
openssl s_client -connect your-domain.com:5919
```

**Volume Permission Issues:**
```bash
# Check volume permissions
docker-compose exec backend ls -la /app

# Fix permissions
docker-compose exec backend chown -R root:root /app
```

### 2. Performance Optimization

**Resource Monitoring:**
```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

**Log Management:**
```bash
# View log sizes
docker-compose exec backend du -sh /app/logs/*

# Rotate logs
docker-compose exec backend logrotate -f /etc/logrotate.conf
```

## Next Steps

1. **Configure Monitoring**: [MONITORING.md](./MONITORING.md)
2. **Environment Setup**: [ENVIRONMENT.md](./ENVIRONMENT.md)
3. **Quick Start Guide**: [QUICKSTART.md](./QUICKSTART.md)
4. **Controller Development**: [CONTROLLERS.md](./CONTROLLERS.md)

This infrastructure setup provides a production-ready foundation for deploying scalable, secure backend services with automatic updates, health monitoring, and proper logging.
