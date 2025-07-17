<script lang="ts">
    export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
    export let color: 'primary' | 'secondary' | 'white' | 'gray' = 'primary';
    export let text = '';
    export let center = false;
    export let overlay = false;
</script>

{#if overlay}
    <div class="overlay">
        <div class="spinner-container {size} {color}" class:center>
            <div class="spinner"></div>
            {#if text}
                <p class="text">{text}</p>
            {/if}
        </div>
    </div>
{:else}
    <div class="spinner-container {size} {color}" class:center>
        <div class="spinner"></div>
        {#if text}
            <p class="text">{text}</p>
        {/if}
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    
    .spinner-container.center {
        justify-content: center;
        min-height: 200px;
    }
    
    .spinner {
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    /* Size Variants */
    .sm .spinner {
        width: 20px;
        height: 20px;
        border-width: 2px;
    }
    
    .md .spinner {
        width: 32px;
        height: 32px;
        border-width: 3px;
    }
    
    .lg .spinner {
        width: 48px;
        height: 48px;
        border-width: 4px;
    }
    
    .xl .spinner {
        width: 64px;
        height: 64px;
        border-width: 5px;
    }
    
    /* Color Variants */
    .primary .spinner {
        border: solid rgba(102, 126, 234, 0.2);
        border-top-color: #667eea;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
    }
    
    .secondary .spinner {
        border: solid rgba(118, 75, 162, 0.2);
        border-top-color: #764ba2;
        box-shadow: 0 4px 20px rgba(118, 75, 162, 0.2);
    }
    
    .white .spinner {
        border: solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
    }
    
    .gray .spinner {
        border: solid rgba(74, 85, 104, 0.2);
        border-top-color: #4a5568;
        box-shadow: 0 4px 20px rgba(74, 85, 104, 0.2);
    }
    
    .text {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        color: #4a5568;
        text-align: center;
    }
    
    .primary .text {
        color: #667eea;
    }
    
    .secondary .text {
        color: #764ba2;
    }
    
    .white .text {
        color: white;
    }
    
    .gray .text {
        color: #4a5568;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
        .xl .spinner {
            width: 48px;
            height: 48px;
            border-width: 4px;
        }
        
        .lg .spinner {
            width: 40px;
            height: 40px;
            border-width: 3px;
        }
    }
</style> 