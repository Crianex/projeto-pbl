import type { Action } from 'svelte/action';

interface TooltipParams {
    title: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
}

export const tooltip: Action<HTMLElement, TooltipParams> = (node, params) => {
    let visible = false;
    let tooltipElement: HTMLElement | null = null;

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'tooltip-action';
        tooltipElement.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: normal;
            white-space: pre-wrap;
            max-width: 300px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            line-height: 1.4;
            pointer-events: none;
            transform: translate(10px, -100%);
            display: none;
        `;
        document.body.appendChild(tooltipElement);
    }

    function showTooltip(event: MouseEvent) {
        if (!tooltipElement || !params?.title) return;

        tooltipElement.innerHTML = params.title;
        tooltipElement.style.left = `${event.clientX}px`;
        tooltipElement.style.top = `${event.clientY}px`;
        tooltipElement.style.display = 'block';
        visible = true;
    }

    function hideTooltip() {
        if (!tooltipElement) return;

        tooltipElement.style.display = 'none';
        visible = false;
    }

    function handleMouseEnter(event: MouseEvent) {
        showTooltip(event);
    }

    function handleMouseLeave() {
        hideTooltip();
    }

    // Create tooltip element
    createTooltip();

    // Add event listeners
    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return {
        update(newParams: TooltipParams) {
            params = newParams;
        },
        destroy() {
            node.removeEventListener('mouseenter', handleMouseEnter);
            node.removeEventListener('mouseleave', handleMouseLeave);
            if (tooltipElement) {
                document.body.removeChild(tooltipElement);
            }
        }
    };
}; 