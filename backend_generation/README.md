# Backend Architecture Replication Guide

This guide provides comprehensive documentation for replicating this backend architecture with your own controllers. The system uses Express.js, TypeScript, Supabase, Docker, and Nginx to create a scalable, auto-updating backend with role-based authentication.

## Documentation Overview

### 📋 Quick Start
- **[QUICKSTART.md](./QUICKSTART.md)** - Step-by-step setup guide for getting started quickly

### 🏗️ Architecture & Development
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Comprehensive architecture overview and core components
- **[CONTROLLERS.md](./CONTROLLERS.md)** - Controller development patterns and examples
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Docker, Nginx, and deployment configuration

### 🔧 Operations & Monitoring
- **[MONITORING.md](./MONITORING.md)** - Auto-update system, logging, and process management
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variables and configuration reference

## Key Features

### 🎯 Controller Pattern
- **Standardized Structure**: All controllers follow the same `EndpointController` interface
- **Automatic Route Registration**: Routes are automatically registered based on controller definitions
- **Type Safety**: Full TypeScript support with proper interfaces
- **Authentication Integration**: Built-in role-based authentication (aluno, professor, coordenador)

### 🔐 Authentication System
- **Supabase Integration**: JWT token validation with Supabase Auth
- **Role-Based Access**: Different permission levels for different user types
- **Middleware Support**: Easy-to-use authentication middleware functions

### 🐳 Infrastructure
- **Docker Containerization**: Multi-stage Docker build with proper dependency management
- **Nginx Reverse Proxy**: SSL termination, load balancing, and security headers
- **Auto-Updates**: Git-based automatic updates with process monitoring
- **Health Checks**: Built-in health monitoring and crash recovery

### 📊 Monitoring & Logging
- **Structured Logging**: Winston-based logging with controller-specific loggers
- **Process Management**: Python-based process monitoring with auto-restart
- **Memory Management**: Automatic cleanup and memory leak prevention
- **Git Integration**: Automatic code updates from remote repositories

## Technology Stack

| Component            | Technology       | Purpose                            |
| -------------------- | ---------------- | ---------------------------------- |
| **Runtime**          | Node.js 18       | JavaScript runtime                 |
| **Framework**        | Express.js       | Web application framework          |
| **Language**         | TypeScript       | Type-safe JavaScript               |
| **Database**         | Supabase         | PostgreSQL with real-time features |
| **Authentication**   | Supabase Auth    | JWT-based authentication           |
| **Storage**          | Supabase Storage | File upload and management         |
| **Containerization** | Docker           | Application packaging              |
| **Reverse Proxy**    | Nginx            | Load balancing and SSL             |
| **Monitoring**       | Python Scripts   | Process and update management      |
| **Logging**          | Winston          | Structured application logging     |

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration and interfaces
│   │   ├── interfaces.ts    # TypeScript type definitions
│   │   ├── supabase_wrapper.ts  # Database connection
│   │   └── utils.ts          # Authentication utilities
│   ├── controllers/     # Business logic controllers
│   │   ├── AlunoController.ts
│   │   ├── ProfessorController.ts
│   │   └── ...
│   ├── utils/          # Utility functions
│   │   ├── logger.ts       # Logging configuration
│   │   ├── controller_logger.ts  # Controller-specific logging
│   │   └── parsers.ts      # Data parsing utilities
│   └── index.ts        # Main application entry point
├── docs/               # Existing documentation
└── start_and_monitor.py # Auto-update monitoring script
```

## Getting Started

1. **Read the Quick Start Guide**: Start with [QUICKSTART.md](./QUICKSTART.md) for immediate setup
2. **Understand the Architecture**: Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive overview
3. **Learn Controller Development**: Follow [CONTROLLERS.md](./CONTROLLERS.md) for implementation patterns
4. **Set Up Infrastructure**: Use [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for Docker and Nginx setup
5. **Configure Monitoring**: Implement [MONITORING.md](./MONITORING.md) for production deployment

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Supabase account and project
- Git repository for auto-updates
- Basic knowledge of Express.js and TypeScript

## Support

This documentation is designed for developers familiar with Express.js and TypeScript. Each guide includes:

- Code examples with explanations
- Step-by-step instructions
- Troubleshooting sections
- Best practices and patterns

For questions or contributions, refer to the individual documentation files for specific guidance.
