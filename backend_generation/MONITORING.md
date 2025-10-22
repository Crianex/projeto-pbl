# Monitoring & Auto-Update System

This guide covers the monitoring, auto-update, and logging systems that make this backend architecture self-maintaining and production-ready. The system includes Git-based automatic updates, process monitoring, crash recovery, and comprehensive logging.

## System Overview

The monitoring system consists of several components working together:

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring System                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Git Monitor   │    │   Process       │                │
│  │   (Python)      │◄──►│   Manager       │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Auto-Update   │    │   Logging       │                │
│  │   System        │    │   System        │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Auto-Update Mechanism

### 1. start_and_monitor.py Overview

The `start_and_monitor.py` script is the core of the auto-update system:

```python
#!/usr/bin/env python3
"""
Auto-Update and Process Monitoring Script
Handles git monitoring, process management, and crash recovery
"""

import os
import subprocess
import signal
import time
import logging
import argparse
from pathlib import Path
from dotenv import load_dotenv
import threading
import gc
import psutil

# Load environment variables
load_dotenv()

# Set up logging with rotation
log_dir = Path(__file__).parent / "logs"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "process.log"

# File handler for persistent logs
file_handler = RotatingFileHandler(
    log_file, 
    maxBytes=10*1024*1024,  # 10MB max file size
    backupCount=5  # Keep 5 backup files
)

# Console handler for Docker logs visibility
console_handler = logging.StreamHandler()

logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler]
)
```

### 2. Git Monitoring System

The system continuously monitors the Git repository for updates:

```python
def check_for_updates(repo_dir, branch):
    """Check if the remote repository has new commits."""
    original_dir = os.getcwd()
    try:
        os.chdir(repo_dir)
        
        # Check git setup first
        if not os.path.exists('.git'):
            log_message("Git repository not found - auto-updates disabled")
            return False
            
        # Test basic git operations
        test_result = run_git_command_safely(["git", "rev-parse", "--git-dir"], cwd=repo_dir)
        if test_result is None or test_result.returncode != 0:
            log_message("Git repository not accessible - auto-updates disabled")
            return False
            
        # Fetch latest changes
        fetch_result = run_git_command_safely(["git", "fetch", "origin"], cwd=repo_dir)
        if fetch_result is None or fetch_result.returncode != 0:
            log_message(f"Failed to fetch from origin: {fetch_result.stderr}")
            return False
            
        # Compare local and remote commits
        local_result = run_git_command_safely(["git", "rev-parse", "HEAD"], cwd=repo_dir)
        remote_result = run_git_command_safely(["git", "rev-parse", f"origin/{branch}"], cwd=repo_dir)
        
        if local_result is None or remote_result is None:
            log_message("Failed to get commit hashes")
            return False
            
        local_commit = local_result.stdout.strip()
        remote_commit = remote_result.stdout.strip()
        
        return local_commit != remote_commit
        
    except Exception as e:
        log_message(f"Error checking for updates: {e}")
        return False
    finally:
        os.chdir(original_dir)
```

### 3. Update Process

When updates are detected, the system performs a safe update:

```python
def pull_updates(repo_dir, branch):
    """Pull the latest changes from the remote repository."""
    original_dir = os.getcwd()
    try:
        os.chdir(repo_dir)
        log_message(f"Pulling updates from {branch}.")
        
        # Stash any local changes to avoid conflicts
        stash_result = run_git_command_safely(["git", "stash", "push", "-m", "Auto-stash before update"], cwd=repo_dir)
        if stash_result and stash_result.returncode != 0:
            log_message("Warning - Could not stash changes, continuing with pull...")
        
        # Pull the latest changes
        pull_result = run_git_command_safely(["git", "pull", "origin", branch], cwd=repo_dir)
        if pull_result is None or pull_result.returncode != 0:
            # If pull fails, try a hard reset to force update
            log_message("Pull failed, attempting hard reset...")
            reset_result = run_git_command_safely(["git", "reset", "--hard", f"origin/{branch}"], cwd=repo_dir)
            if reset_result is None or reset_result.returncode != 0:
                log_message("Warning - Could not update repository, continuing with existing files")
            else:
                log_message("Successfully updated via hard reset")
        else:
            log_message("Successfully pulled updates")
            
    except Exception as e:
        log_message(f"Error pulling updates: {e}")
        log_message("Continuing with existing code despite update failure")
    finally:
        os.chdir(original_dir)
```

### 4. Process Management

The system manages the Node.js process with automatic restart capabilities:

```python
def start_process(command):
    """Start a subprocess with the given command and print logs in real time."""
    log_message(f"Starting subprocess with command: {command}")
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
        text=True,
        preexec_fn=os.setsid
    )
    # Print the logs in a separate thread
    print_logs_in_real_time(process)
    return process

def restart_process_if_crashed(process, command):
    """Check if the process has crashed and restart it."""
    try:
        if process.poll() is not None:  # If process is not running
            log_message("Process crashed. Restarting...")
            return start_process(command)
    except Exception as e:
        log_message(f"Error occurred: {e}")
        return None
    return process
```

## Memory Management

### 1. Memory Monitoring

The system continuously monitors memory usage:

```python
def log_memory_usage():
    """Log current memory usage for monitoring."""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        log_message(f"Memory usage: {memory_mb:.2f} MB, Active threads: {len(active_threads)}")
    except Exception as e:
        log_message(f"Error getting memory info: {e}")

def cleanup_threads():
    """Clean up any active threads."""
    global active_threads
    shutdown_event.set()
    
    for thread in active_threads[:]:  # Create a copy of the list
        if thread.is_alive():
            thread.join(timeout=2.0)  # Wait up to 2 seconds for thread to finish
        active_threads.remove(thread)
    
    shutdown_event.clear()
    gc.collect()  # Force garbage collection
```

### 2. Thread Management

The system manages threads for log streaming and monitoring:

```python
def print_logs_in_real_time(process):
    """Print logs from the subprocess in real time with proper resource management."""
    def stream_output(stream, prefix):
        try:
            while not shutdown_event.is_set():
                line = stream.readline()
                if not line:  # End of stream
                    break
                if line.strip():  # Only log non-empty lines
                    message = f"{prefix}: {line.strip()}"
                    log_message(message)
        except Exception as e:
            log_message(f"Error reading from {prefix}: {e}")
        finally:
            try:
                stream.close()
            except:
                pass
    
    # Create threads for stdout and stderr with proper management
    stdout_thread = threading.Thread(target=stream_output, args=(process.stdout, "STDOUT"), daemon=True)
    stderr_thread = threading.Thread(target=stream_output, args=(process.stderr, "STDERR"), daemon=True)
    
    stdout_thread.start()
    stderr_thread.start()
    
    active_threads.extend([stdout_thread, stderr_thread])
```

## Helper Scripts

### 1. run_docker_and_follow.py

This script manages Docker containers and provides log streaming:

```python
#!/usr/bin/env python3
"""
Docker Management Script for Backend Project
Handles stopping, building, running, and following logs for Docker containers.
"""

import subprocess
import sys
import time
import signal
import os
import threading
from pathlib import Path

class DockerManager:
    def __init__(self):
        self.project_containers = ['projeto-pbl-backend', 'projeto-pbl-nginx']
        self.compose_file = 'docker-compose.yml'
        self.project_root = Path(__file__).parent.parent
        
    def run_command_with_live_output(self, command, description):
        """Run a command showing live output without clearing."""
        print(f"⏳ {description}...")
        
        try:
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=self.project_root
            )
            
            # Store all output lines
            output_lines = []
            
            # Read and display output in real-time
            for line in iter(process.stdout.readline, ''):
                line = line.rstrip()
                if line:  # Only process non-empty lines
                    print(f"  📋 {line}")
                    output_lines.append(line)
                    sys.stdout.flush()
            
            # Wait for process to complete
            process.wait()
            
            return process.returncode == 0, output_lines
            
        except Exception as e:
            print(f"❌ Error running command '{command}': {e}")
            return False, []
```

### 2. follow_logs.py

This script provides log aggregation and monitoring:

```python
#!/usr/bin/env python3
"""
Log Following Script for Backend Project
Aggregates and displays logs from multiple sources.
"""

import subprocess
import sys
import time
import signal
import os
from pathlib import Path

class LogFollower:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.log_sources = [
            'backend/logs/all.log',
            'backend/logs/error.log',
            'backend/logs/process.log'
        ]
        
    def follow_docker_logs(self):
        """Follow Docker container logs."""
        print("🐳 Following Docker container logs...")
        
        try:
            process = subprocess.Popen(
                ["docker-compose", "logs", "-f"],
                cwd=self.project_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            # Read and display logs in real-time
            for line in iter(process.stdout.readline, ''):
                line = line.rstrip()
                if line:
                    print(f"  📋 {line}")
                    sys.stdout.flush()
                    
        except KeyboardInterrupt:
            print("\n🛑 Log following stopped by user")
        except Exception as e:
            print(f"❌ Error following logs: {e}")
        finally:
            if process:
                process.terminate()
```

## Logging System

### 1. Winston Logger Configuration

The backend uses Winston for structured logging:

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

// Define which transports the logger must use
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

export default logger;
```

### 2. Controller Logger

Each controller gets its own logger instance:

```typescript
import logger from './logger';

export class ControllerLogger {
    private controller: string;
    private endpoint: string;

    constructor(controller: string, endpoint: string) {
        this.controller = controller;
        this.endpoint = endpoint;
    }

    private formatMessage(message: string): string {
        return `\b[${this.controller}][${this.endpoint}] ${message}`;
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

export function createControllerLogger(controller: string, endpoint: string): ControllerLogger {
    return new ControllerLogger(controller, endpoint);
}
```

### 3. Log Rotation and Retention

The system implements log rotation to prevent unbounded growth:

```python
# File handler for persistent logs with rotation
file_handler = RotatingFileHandler(
    log_file, 
    maxBytes=10*1024*1024,  # 10MB max file size
    backupCount=5  # Keep 5 backup files
)
```

**Log Rotation Features:**
- **Size Limits**: 10MB per log file
- **Backup Files**: Keep 5 rotated files
- **Automatic Rotation**: Rotates when size limit is reached
- **Compression**: Optional compression of rotated files

## Docker Logging Drivers

### 1. JSON File Driver

The Docker Compose configuration uses the JSON file driver:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "10"
    mode: "non-blocking"
    max-buffer-size: "8m"
```

**Docker Logging Features:**
- **JSON Format**: Structured log output
- **Size Limits**: 100MB per log file
- **File Rotation**: Keep 10 rotated files
- **Non-blocking**: Asynchronous logging
- **Buffer Size**: 8MB buffer for performance

### 2. Log Aggregation

The system aggregates logs from multiple sources:

```bash
# Follow all Docker logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Follow application logs
tail -f backend/logs/all.log
tail -f backend/logs/error.log
tail -f backend/logs/process.log
```

## Monitoring Commands

### 1. System Monitoring

```bash
# Check container status
docker-compose ps

# View resource usage
docker stats

# Check health status
docker-compose exec backend curl -f http://localhost:5919/health

# View memory usage
docker-compose exec backend ps aux
```

### 2. Log Monitoring

```bash
# Follow all logs
python scripts/follow_logs.py

# Follow Docker logs
docker-compose logs -f

# View specific log files
tail -f backend/logs/all.log
tail -f backend/logs/error.log
tail -f backend/logs/process.log

# Search logs
grep "ERROR" backend/logs/all.log
grep "WARN" backend/logs/all.log
```

### 3. Git Monitoring

```bash
# Check git status
docker-compose exec backend git status

# Check for updates
docker-compose exec backend git fetch origin
docker-compose exec backend git log --oneline HEAD..origin/main

# Force update
docker-compose exec backend git pull origin main
```

## Troubleshooting

### 1. Common Issues

**Auto-updates not working:**
```bash
# Check git repository
docker-compose exec backend ls -la /app/.git

# Test git operations
docker-compose exec backend git status

# Check git configuration
docker-compose exec backend git config --list
```

**Process crashes:**
```bash
# Check process logs
docker-compose logs backend

# Check application logs
tail -f backend/logs/process.log

# Restart services
docker-compose restart backend
```

**Memory issues:**
```bash
# Check memory usage
docker stats

# Check memory in container
docker-compose exec backend free -m

# Restart to free memory
docker-compose restart backend
```

### 2. Performance Optimization

**Log Management:**
```bash
# Check log sizes
docker-compose exec backend du -sh /app/logs/*

# Clean old logs
docker-compose exec backend find /app/logs -name "*.log.*" -mtime +7 -delete

# Compress old logs
docker-compose exec backend gzip /app/logs/*.log.*
```

**Memory Management:**
```bash
# Check memory usage
docker stats

# Clean up unused resources
docker system prune -a

# Restart services to free memory
docker-compose restart
```

## Configuration

### 1. Environment Variables

```bash
# Git branch to monitor
GIT_BRANCH=main

# Python environment
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8

# Git configuration
GIT_DISCOVERY_ACROSS_FILESYSTEM=1
```

### 2. Monitoring Intervals

```python
# Update check interval (seconds)
CHECK_INTERVAL = 10

# Memory check interval (iterations)
MEMORY_CHECK_INTERVAL = 60

# Git cleanup interval (iterations)
GIT_CLEANUP_INTERVAL = 360
```

## Best Practices

### 1. Monitoring
- **Regular Health Checks**: Monitor system health continuously
- **Log Rotation**: Implement proper log rotation to prevent disk space issues
- **Memory Monitoring**: Track memory usage and implement cleanup strategies
- **Error Tracking**: Monitor and alert on critical errors

### 2. Auto-Updates
- **Safe Updates**: Always stash local changes before updates
- **Rollback Strategy**: Implement rollback mechanisms for failed updates
- **Testing**: Test updates in staging environment before production
- **Monitoring**: Monitor system after updates for stability

### 3. Logging
- **Structured Logs**: Use structured logging for better analysis
- **Log Levels**: Use appropriate log levels for different types of messages
- **Context**: Include sufficient context in log messages
- **Retention**: Implement proper log retention policies

## Next Steps

1. **Environment Setup**: [ENVIRONMENT.md](./ENVIRONMENT.md)
2. **Quick Start Guide**: [QUICKSTART.md](./QUICKSTART.md)
3. **Infrastructure Setup**: [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
4. **Controller Development**: [CONTROLLERS.md](./CONTROLLERS.md)

This monitoring and auto-update system provides a robust foundation for maintaining and updating backend services in production environments with minimal manual intervention.
