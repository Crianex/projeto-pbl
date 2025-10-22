// Define log levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    HTTP: 'http',
    DEBUG: 'debug'
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Define colors for console output
const COLORS = {
    [LOG_LEVELS.ERROR]: '#FF4444',
    [LOG_LEVELS.WARN]: '#FFBB33',
    [LOG_LEVELS.INFO]: '#00C851',
    [LOG_LEVELS.HTTP]: '#AA66CC',
    [LOG_LEVELS.DEBUG]: '#808080'
};

// Get current log level based on environment
const getCurrentLogLevel = (): LogLevel => {
    const isDevelopment = import.meta.env.DEV;
    return isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
};

// Format timestamp
const getTimestamp = (): string => {
    return new Date().toISOString();
};

class Logger {
    private currentLogLevel: LogLevel;

    constructor() {
        this.currentLogLevel = getCurrentLogLevel();
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = Object.values(LOG_LEVELS);
        return levels.indexOf(level) <= levels.indexOf(this.currentLogLevel);
    }

    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = getTimestamp();
        return `[${timestamp}][${level.toUpperCase()}] ${message}`;
    }

    private log(level: LogLevel, message: string, ...args: any[]) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, ...args);
        const color = COLORS[level];

        // Console output with styling
        console.log(
            `%c${formattedMessage}`,
            `color: ${color}; font-weight: bold;`,
            ...args
        );

        // In production, you might want to send important logs to your backend
        if (!import.meta.env.DEV && (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN)) {
            this.sendToBackend(level, message, args);
        }
    }

    private async sendToBackend(level: LogLevel, message: string, args: any[]) {
        try {
            // You can implement this to send logs to your backend
            // await fetch('/api/logs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         level,
            //         message,
            //         timestamp: new Date().toISOString(),
            //         args
            //     })
            // });
        } catch (error) {
            // Silently fail - we don't want to cause an infinite loop of error logging
            console.error('Failed to send log to backend:', error);
        }
    }

    error(message: string, ...args: any[]) {
        this.log(LOG_LEVELS.ERROR, message, ...args);
    }

    warn(message: string, ...args: any[]) {
        this.log(LOG_LEVELS.WARN, message, ...args);
    }

    info(message: string, ...args: any[]) {
        this.log(LOG_LEVELS.INFO, message, ...args);
    }

    http(message: string, ...args: any[]) {
        this.log(LOG_LEVELS.HTTP, message, ...args);
    }

    debug(message: string, ...args: any[]) {
        this.log(LOG_LEVELS.DEBUG, message, ...args);
    }
}

export const logger = new Logger(); 