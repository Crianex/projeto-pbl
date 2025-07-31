<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let scaleFormat: string = "0-3";
    export let zoomLevel: number = 1;

    const dispatch = createEventDispatcher();

    function handleScaleToggle() {
        const newScale = scaleFormat === "0-3" ? "0-10" : "0-3";
        dispatch("scaleChange", newScale);
    }

    function handleZoomChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const newZoom = parseFloat(target.value);
        dispatch("zoomChange", newZoom);
    }
</script>

<div class="matrix-controls">
    <!-- Scale Format Switch -->
    <!-- <div class="scale-switch-container">
        <span class="scale-label">Escala de Notas:</span>
        <div class="scale-switch-wrapper">
            <span class="scale-text {scaleFormat === '0-3' ? 'active' : ''}"
                >0-3</span
            >
            <button
                class="scale-switch {scaleFormat === '0-10' ? 'active' : ''}"
                on:click={handleScaleToggle}
                aria-label="Alternar escala de notas"
            >
                <span class="scale-switch-slider"></span>
            </button>
            <span class="scale-text {scaleFormat === '0-10' ? 'active' : ''}"
                >0-10</span
            >
        </div>
    </div> -->

    <!-- Zoom Controls -->
    <div class="zoom-controls">
        <label for="zoom-slider" class="zoom-label">Zoom:</label>
        <div class="zoom-slider-wrapper">
            <input
                type="range"
                id="zoom-slider"
                min="0.5"
                max="1.5"
                step="0.05"
                value={zoomLevel}
                on:input={handleZoomChange}
                class="zoom-slider"
                title="Ajustar zoom da matriz"
            />
            <span class="zoom-value">{Math.round(zoomLevel * 100)}%</span>
        </div>
    </div>
</div>

<style>
    .matrix-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1.5rem;
        margin: 1rem 0;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid #e3e6ed;
        border-radius: 8px;
        flex-wrap: wrap;
    }

    .scale-switch-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .scale-label {
        font-weight: 600;
        color: #22223b;
        font-size: 0.95rem;
        white-space: nowrap;
    }

    .scale-switch-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .scale-text {
        font-size: 0.9rem;
        font-weight: 600;
        color: #6c757d;
        transition: color 0.3s ease;
        user-select: none;
    }

    .scale-text.active {
        color: #6c63ff;
    }

    .scale-switch {
        position: relative;
        width: 50px;
        height: 24px;
        background: #e3e6ed;
        border: 2px solid #e3e6ed;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        overflow: hidden;
    }

    .scale-switch:hover {
        background: #d1d5db;
        border-color: #d1d5db;
        transform: scale(1.02);
    }

    .scale-switch:focus {
        box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.2);
    }

    .scale-switch.active {
        background: linear-gradient(135deg, #6c63ff 0%, #5a52d5 100%);
        border-color: #6c63ff;
        box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
    }

    .scale-switch.active:hover {
        background: linear-gradient(135deg, #5a52d5 0%, #4c44c7 100%);
        transform: scale(1.02);
        box-shadow: 0 6px 16px rgba(108, 99, 255, 0.4);
    }

    .scale-switch-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .scale-switch.active .scale-switch-slider {
        transform: translateX(26px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    }

    .scale-switch:hover .scale-switch-slider {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }

    .zoom-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        max-width: 300px;
    }

    .zoom-label {
        font-weight: 600;
        color: #22223b;
        font-size: 0.95rem;
        white-space: nowrap;
    }

    .zoom-slider-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .zoom-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        outline: none;
        opacity: 0.7;
        transition: opacity 0.2s;
        /* Improve touch handling on mobile */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }

    .zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
    }

    .zoom-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #667eea;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        /* Improve touch target size */
        min-height: 20px;
        min-width: 20px;
    }

    .zoom-slider:hover {
        opacity: 1;
    }

    .zoom-slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .zoom-slider::-moz-range-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .zoom-value {
        min-width: 2rem;
        text-align: center;
        font-weight: 500;
        color: #495057;
        font-size: 1rem;
        padding: 0.25rem 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid rgba(206, 212, 218, 0.4);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 768px) {
        .matrix-controls {
            flex-direction: column;
            gap: 1rem;
            padding: 0.75rem;
        }

        .scale-switch-container {
            justify-content: center;
        }

        .scale-label {
            font-size: 0.9rem;
        }

        .zoom-controls {
            max-width: none;
            width: 100%;
        }

        .zoom-slider-wrapper {
            gap: 0.5rem;
            padding: 0.2rem;
        }
    }
</style>
