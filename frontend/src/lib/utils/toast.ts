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

    function show(toast: ToastMessage) {
        set(toast);
    }

    function hide() {
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