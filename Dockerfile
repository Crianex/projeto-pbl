# Use an official Node.js runtime with Python support
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies for PDF processing and other requirements
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

# Create a symbolic link for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy package files for Node.js dependencies (from backend/servidor directory)
COPY backend/package*.json ./backend/

# Install Node.js dependencies
WORKDIR /app/backend/servidor
RUN npm install

# Install ts-node globally for production use
RUN npm install -g ts-node typescript

# Copy Python requirements files
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Copy TypeScript configuration
COPY backend/tsconfig.json ./
COPY backend/nodemon.json ./

# Copy source code
COPY backend/src/ ./src/
COPY backend/start_and_monitor.py ./
# Copy docker-entrypoint.sh to /app (parent directory)
COPY docker-entrypoint.sh /app/

# Copy other necessary files
COPY backend/*.json ./

# Create necessary directories
RUN mkdir -p /app/dist /app/logs /app/uploads ./logs ./dist

# Set up git configuration for the container
RUN git config --global --add safe.directory /app
RUN git config --global --add safe.directory '/app/*'
RUN git config --global --add safe.directory '*'
RUN git config --global user.email "docker@projeto-pbl.com"
RUN git config --global user.name "Projeto PBL Docker Container"
RUN git config --global init.defaultBranch main

# Make docker-entrypoint.sh executable
RUN chmod +x /app/docker-entrypoint.sh

# Set permissions on directories
RUN chmod -R 755 /app

# Build TypeScript code (optional now since we're using ts-node)
RUN npm run build || echo "Build failed, will use ts-node instead"

# Set git environment variables for runtime
ENV GIT_DISCOVERY_ACROSS_FILESYSTEM=1

# Expose ports for HTTPS
EXPOSE 5919

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5919/health || exit 1

# Switch back to /app directory for entrypoint script
WORKDIR /app

# Run as root to avoid any permission issues with mounted files
# Use the entrypoint script that handles conditional arguments
CMD ["/bin/bash", "./docker-entrypoint.sh"] 
