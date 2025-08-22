import type { Action } from 'svelte/action';
import { Utils } from './utils';

interface TooltipParams {
    title: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
}

interface DialogElement extends HTMLElement {
    _content?: HTMLElement;
    _dialogContent?: HTMLElement;
}

export const tooltip: Action<HTMLElement, TooltipParams> = (node, params) => {
    let visible = false;
    let tooltipElement: HTMLElement | null = null;
    let dialogElement: DialogElement | null = null;

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

    function createDialog() {
        const newDialogElement = document.createElement('div') as DialogElement;
        newDialogElement.className = 'tooltip-dialog';
        newDialogElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
        `;

        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 12px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        const header = document.createElement('h3');
        header.textContent = 'Informações';
        header.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #333;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            line-height: 1.5;
            color: #333;
        `;

        dialogContent.appendChild(header);
        dialogContent.appendChild(content);

        // Add a footer with an explicit OK button to close the dialog on mobile
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: center; /* centraliza o botão */
            margin-top: 16px;
        `;

        const okButton = document.createElement('button');
        okButton.type = 'button';
        okButton.textContent = 'OK';
        okButton.style.cssText = `
            
            background: #16a34a;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        `;
        okButton.addEventListener('click', () => hideTooltip());

        footer.appendChild(okButton);
        dialogContent.appendChild(footer);
        newDialogElement.appendChild(dialogContent);
        document.body.appendChild(newDialogElement);

        // Store references for updates
        newDialogElement._content = content;
        newDialogElement._dialogContent = dialogContent;

        dialogElement = newDialogElement;
    }

    function showTooltip(event: MouseEvent) {
        if (!params?.title) return;

        if (Utils.isMobile()) {
            // On mobile, show dialog
            if (dialogElement && dialogElement._content) {
                dialogElement._content.innerHTML = params.title;
                dialogElement.style.display = 'flex';
                visible = true;
            }
        } else {
            // On desktop, show tooltip
            if (tooltipElement) {
                tooltipElement.innerHTML = params.title;
                tooltipElement.style.left = `${event.clientX}px`;
                tooltipElement.style.top = `${event.clientY}px`;
                tooltipElement.style.display = 'block';
                visible = true;
            }
        }
    }

    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
        if (dialogElement) {
            dialogElement.style.display = 'none';
        }
        visible = false;
    }

    function handleMouseEnter(event: MouseEvent) {
        showTooltip(event);
    }

    function handleMouseLeave() {
        hideTooltip();
    }

    function handleClick(event: MouseEvent) {
        if (Utils.isMobile()) {
            event.preventDefault();
            event.stopPropagation();
            showTooltip(event);
        }
    }

    function handleDialogClick(event: MouseEvent) {
        if (event.target === dialogElement) {
            hideTooltip();
        }
    }

    // Create elements
    createTooltip();
    createDialog();

    // Add event listeners
    if (Utils.isMobile()) {
        // On mobile, only listen for clicks
        node.addEventListener('click', handleClick);
    } else {
        // On desktop, listen for hover events
        node.addEventListener('mouseenter', handleMouseEnter);
        node.addEventListener('mouseleave', handleMouseLeave);
    }

    // Add dialog event listener if dialog was created
    if (dialogElement) {
        (dialogElement as HTMLElement).addEventListener('click', handleDialogClick);
    }

    return {
        update(newParams: TooltipParams) {
            params = newParams;
        },
        destroy() {
            if (Utils.isMobile()) {
                // On mobile, only remove click listener
                node.removeEventListener('click', handleClick);
            } else {
                // On desktop, remove hover listeners
                node.removeEventListener('mouseenter', handleMouseEnter);
                node.removeEventListener('mouseleave', handleMouseLeave);
            }

            if (dialogElement) {
                (dialogElement as HTMLElement).removeEventListener('click', handleDialogClick);
                document.body.removeChild(dialogElement);
            }

            if (tooltipElement) {
                document.body.removeChild(tooltipElement);
            }
        }
    };
}; 