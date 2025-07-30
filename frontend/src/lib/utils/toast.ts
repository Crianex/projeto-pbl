import { writable } from 'svelte/store';

export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    duration?: number;
    dismissible?: boolean;
    persistent?: boolean;
}

function createToastStore() {
    const { subscribe, set, update } = writable<ToastMessage | null>(null);
    let timeoutId: NodeJS.Timeout | null = null;

    function show(toast: ToastMessage) {
        // Clear any existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        set(toast);

        // Auto-hide after duration (unless persistent)
        if (!toast.persistent && toast.duration && toast.duration > 0) {
            timeoutId = setTimeout(() => {
                hide();
            }, toast.duration);
        }
    }

    function hide() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        set(null);
    }

    function success(message: string, title?: string, duration = 5000) {
        show({ message, type: 'success', title, duration });
    }

    function error(message: string, title?: string, duration = 5000) {
        show({ message, type: 'error', title, duration });
    }

    function warning(message: string, title?: string, duration = 5000) {
        show({ message, type: 'warning', title, duration });
    }

    function info(message: string, title?: string, duration = 5000) {
        show({ message, type: 'info', title, duration });
    }

    return {
        subscribe,
        show,
        hide,
        success,
        error,
        warning,
        info
    };
}

export const toastStore = createToastStore(); 