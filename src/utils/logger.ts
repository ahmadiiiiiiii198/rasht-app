// Development logging utility
// Only logs in development mode, silent in production

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
    log: (...args: any[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        if (isDevelopment) {
            console.error(...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    info: (...args: any[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    }
};

// For production errors that should always be logged
export const prodLog = {
    error: (...args: any[]) => {
        console.error(...args);
    }
};
