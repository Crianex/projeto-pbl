<script lang="ts">
    export let status: "pending" | "completed" | "online" | "offline" | "submitted" | "reviewing" | "approved" | "rejected" = "pending";
    export let text: string = "";
    export let size: "sm" | "md" | "lg" = "md";
    export let variant: "default" | "outlined" | "filled" = "default";
    export let showIcon: boolean = true;

    // Determinar texto automaticamente se não fornecido
    $: displayText = text || getDefaultText(status);
    
    function getDefaultText(status: string): string {
        const statusTexts = {
            pending: "Pendente",
            completed: "Concluído",
            online: "Online",
            offline: "Offline",
            submitted: "Enviado",
            reviewing: "Em Análise",
            approved: "Aprovado",
            rejected: "Rejeitado"
        };
        return statusTexts[status] || status;
    }

    function getStatusIcon(status: string): string {
        const icons = {
            pending: "⏳",
            completed: "✓",
            online: "●",
            offline: "●",
            submitted: "📤",
            reviewing: "👁",
            approved: "✓",
            rejected: "✗"
        };
        return icons[status] || "●";
    }
</script>

<span 
    class="status-badge {status} {size} {variant}"
    class:with-icon={showIcon}
    role="status"
    aria-label="Status: {displayText}"
>
    {#if showIcon}
        <span class="icon">{getStatusIcon(status)}</span>
    {/if}
    <span class="text">{displayText}</span>
</span>

<style>
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-radius: 12px;
        font-weight: 500;
        font-family: var(--font-body);
        transition: all 0.2s ease;
        white-space: nowrap;
        border: 1px solid transparent;
    }

    /* Tamanhos */
    .sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        line-height: 1.2;
    }

    .sm .icon {
        font-size: 0.75rem;
    }

    .md {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.3;
    }

    .md .icon {
        font-size: 0.875rem;
    }

    .lg {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        line-height: 1.4;
    }

    .lg .icon {
        font-size: 1rem;
    }

    /* Status cores - variante default */
    .pending.default {
        background: var(--color-feedback-pending, #f59e0b);
        color: var(--color-text-white);
    }

    .completed.default {
        background: var(--color-feedback-completed, #10b981);
        color: var(--color-text-white);
    }

    .online.default {
        background: var(--color-feedback-online, #22c55e);
        color: var(--color-text-white);
    }

    .offline.default {
        background: var(--color-feedback-offline, #6b7280);
        color: var(--color-text-white);
    }

    .submitted.default {
        background: var(--color-info-main, #3b82f6);
        color: var(--color-text-white);
    }

    .reviewing.default {
        background: var(--color-warning-main, #f6ad55);
        color: var(--color-text-white);
    }

    .approved.default {
        background: var(--color-success-main, #48bb78);
        color: var(--color-text-white);
    }

    .rejected.default {
        background: var(--color-error-main, #ef4444);
        color: var(--color-text-white);
    }

    /* Status cores - variante outlined */
    .pending.outlined {
        background: transparent;
        color: var(--color-feedback-pending, #f59e0b);
        border-color: var(--color-feedback-pending, #f59e0b);
    }

    .completed.outlined {
        background: transparent;
        color: var(--color-feedback-completed, #10b981);
        border-color: var(--color-feedback-completed, #10b981);
    }

    .online.outlined {
        background: transparent;
        color: var(--color-feedback-online, #22c55e);
        border-color: var(--color-feedback-online, #22c55e);
    }

    .offline.outlined {
        background: transparent;
        color: var(--color-feedback-offline, #6b7280);
        border-color: var(--color-feedback-offline, #6b7280);
    }

    .submitted.outlined {
        background: transparent;
        color: var(--color-info-main, #3b82f6);
        border-color: var(--color-info-main, #3b82f6);
    }

    .reviewing.outlined {
        background: transparent;
        color: var(--color-warning-main, #f6ad55);
        border-color: var(--color-warning-main, #f6ad55);
    }

    .approved.outlined {
        background: transparent;
        color: var(--color-success-main, #48bb78);
        border-color: var(--color-success-main, #48bb78);
    }

    .rejected.outlined {
        background: transparent;
        color: var(--color-error-main, #ef4444);
        border-color: var(--color-error-main, #ef4444);
    }

    /* Status cores - variante filled */
    .pending.filled {
        background: rgba(245, 158, 11, 0.1);
        color: var(--color-feedback-pending, #f59e0b);
        border-color: rgba(245, 158, 11, 0.2);
    }

    .completed.filled {
        background: rgba(16, 185, 129, 0.1);
        color: var(--color-feedback-completed, #10b981);
        border-color: rgba(16, 185, 129, 0.2);
    }

    .online.filled {
        background: rgba(34, 197, 94, 0.1);
        color: var(--color-feedback-online, #22c55e);
        border-color: rgba(34, 197, 94, 0.2);
    }

    .offline.filled {
        background: rgba(107, 114, 128, 0.1);
        color: var(--color-feedback-offline, #6b7280);
        border-color: rgba(107, 114, 128, 0.2);
    }

    .submitted.filled {
        background: rgba(59, 130, 246, 0.1);
        color: var(--color-info-main, #3b82f6);
        border-color: rgba(59, 130, 246, 0.2);
    }

    .reviewing.filled {
        background: rgba(246, 173, 85, 0.1);
        color: var(--color-warning-main, #f6ad55);
        border-color: rgba(246, 173, 85, 0.2);
    }

    .approved.filled {
        background: rgba(72, 187, 120, 0.1);
        color: var(--color-success-main, #48bb78);
        border-color: rgba(72, 187, 120, 0.2);
    }

    .rejected.filled {
        background: rgba(239, 68, 68, 0.1);
        color: var(--color-error-main, #ef4444);
        border-color: rgba(239, 68, 68, 0.2);
    }

    /* Efeitos de hover */
    .status-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .status-badge.default:hover {
        filter: brightness(1.1);
    }

    .status-badge.outlined:hover,
    .status-badge.filled:hover {
        background: var(--color-bg-light, #f8f9fa);
    }

    /* Ícone */
    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    }

    .status-badge:hover .icon {
        transform: scale(1.1);
    }

    /* Pulsing animation para online */
    .online .icon {
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.6;
        }
    }

    /* Responsividade */
    @media (max-width: 768px) {
        .lg {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
        }

        .md {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }

        .sm {
            padding: 0.2rem 0.4rem;
            font-size: 0.7rem;
        }
    }

    /* Acessibilidade */
    @media (prefers-reduced-motion: reduce) {
        .status-badge,
        .icon {
            transition: none;
        }

        .status-badge:hover {
            transform: none;
        }

        .online .icon {
            animation: none;
        }
    }

    /* Alto contraste */
    @media (prefers-contrast: high) {
        .status-badge {
            border-width: 2px;
            font-weight: 600;
        }
    }
</style>

