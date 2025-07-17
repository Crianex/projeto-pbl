<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
    export let title = '';
    export let message = '';
    export let duration = 5000; // Auto-dismiss after 5 seconds
    export let dismissible = true;
    export let persistent = false; // If true, won't auto-dismiss
    export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' = 'top-right';
    
    const dispatch = createEventDispatcher();
    
    let visible = true;
    let timeoutId: NodeJS.Timeout;
    
    $: if (visible && !persistent && duration > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            dismiss();
        }, duration);
    }
    
    function dismiss() {
        visible = false;
        setTimeout(() => {
            dispatch('dismiss');
        }, 300);
    }
    
    function getIcon(type: string) {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return 'ℹ';
        }
    }
</script>

{#if visible}
    <div 
        class="toast {type} {position}"
        transition:fly={{ 
            x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
            y: position.includes('top') ? -100 : position.includes('bottom') ? 100 : 0,
            duration: 300 
        }}
    >
        <div class="toast-content">
            <div class="icon">
                {getIcon(type)}
            </div>
            
            <div class="content">
                {#if title}
                    <h4 class="title">{title}</h4>
                {/if}
                {#if message}
                    <p class="message">{message}</p>
                {/if}
                <slot />
            </div>
            
            {#if dismissible}
                <button class="close" on:click={dismiss} aria-label="Fechar notificação">
                    ✕
                </button>
            {/if}
        </div>
        
        {#if !persistent && duration > 0}
            <div class="progress">
                <div class="progress-bar" style="animation-duration: {duration}ms"></div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        z-index: 10000;
        max-width: 400px;
        min-width: 320px;
        margin: 1rem;
        border-radius: 16px;
        overflow: hidden;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 10px 25px rgba(0, 0, 0, 0.1),
            0 5px 12px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
    }
    
    /* Positioning */
    .top-right {
        top: 0;
        right: 0;
    }
    
    .top-left {
        top: 0;
        left: 0;
    }
    
    .bottom-right {
        bottom: 0;
        right: 0;
    }
    
    .bottom-left {
        bottom: 0;
        left: 0;
    }
    
    .top-center {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem;
        position: relative;
    }
    
    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        font-size: 14px;
        font-weight: bold;
        flex-shrink: 0;
        color: white;
    }
    
    .content {
        flex: 1;
        min-width: 0;
    }
    
    .title {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.3;
    }
    
    .message {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.4;
        opacity: 0.9;
    }
    
    .close {
        background: none;
        border: none;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        opacity: 0.7;
    }
    
    .close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }
    
    .progress {
        position: relative;
        height: 3px;
        background: rgba(255, 255, 255, 0.2);
        overflow: hidden;
    }
    
    .progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: rgba(255, 255, 255, 0.6);
        animation: progress linear;
        transform-origin: left;
    }
    
    @keyframes progress {
        from {
            transform: scaleX(1);
        }
        to {
            transform: scaleX(0);
        }
    }
    
    /* Type Variants */
    .success {
        background: linear-gradient(135deg, rgba(72, 187, 120, 0.95) 0%, rgba(56, 178, 172, 0.95) 100%);
        color: white;
    }
    
    .success .icon {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .error {
        background: linear-gradient(135deg, rgba(245, 101, 101, 0.95) 0%, rgba(229, 62, 62, 0.95) 100%);
        color: white;
    }
    
    .error .icon {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .warning {
        background: linear-gradient(135deg, rgba(246, 173, 85, 0.95) 0%, rgba(237, 137, 54, 0.95) 100%);
        color: white;
    }
    
    .warning .icon {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .info {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
        color: white;
    }
    
    .info .icon {
        background: rgba(255, 255, 255, 0.2);
    }
    
    /* Responsive */
    @media (max-width: 640px) {
        .toast {
            margin: 0.5rem;
            min-width: unset;
            max-width: calc(100vw - 1rem);
            border-radius: 12px;
        }
        
        .toast-content {
            padding: 1rem;
        }
        
        .title {
            font-size: 0.95rem;
        }
        
        .message {
            font-size: 0.85rem;
        }
    }
</style> 