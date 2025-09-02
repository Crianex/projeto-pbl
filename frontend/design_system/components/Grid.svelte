<script lang="ts">
    export let cols: number | string = 'auto';
    export let gap: 'sm' | 'md' | 'lg' = 'md';
    export let responsive: boolean = true;
</script>

<div 
    class="grid gap-{gap}" 
    class:responsive
    style="grid-template-columns: {typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols};"
>
    <slot />
</div>

<style>
    .grid {
        display: grid;
        width: 100%;
        box-sizing: border-box;
    }
    
    .gap-sm {
        gap: 0.75rem;
    }
    
    .gap-md {
        gap: 1.5rem;
    }
    
    .gap-lg {
        gap: 2rem;
    }
    
    .grid.responsive {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    
    @media (max-width: 768px) {
        .gap-md {
            gap: 1rem;
        }
        
        .gap-lg {
            gap: 1.25rem;
        }
        
        .grid.responsive {
            grid-template-columns: 1fr;
        }
    }
</style>
