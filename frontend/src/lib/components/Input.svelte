<script lang="ts">
    export let type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
    export let value = '';
    export let placeholder = '';
    export let label = '';
    export let error = '';
    export let disabled = false;
    export let required = false;
    export let id = '';
    export let autocomplete = '';
    export let maxlength: number | undefined = undefined;
    
    let inputElement: HTMLInputElement;
    let focused = false;
    
    export function focus() {
        inputElement?.focus();
    }
    
    function handleFocus() {
        focused = true;
    }
    
    function handleBlur() {
        focused = false;
    }
</script>

<div class="input-container" class:focused class:error={!!error} class:disabled>
    {#if label}
        <label for={id} class="label">{label}</label>
    {/if}
    
    <div class="input-wrapper">
{#if type === 'email'}
            <input
                type="email"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {:else if type === 'password'}
            <input
                type="password"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {:else if type === 'number'}
            <input
                type="number"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {:else if type === 'tel'}
            <input
                type="tel"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {:else if type === 'url'}
            <input
                type="url"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {:else}
            <input
                type="text"
                bind:this={inputElement}
                bind:value
                {placeholder}
                {disabled}
                {required}
                {id}
                {autocomplete}
                {maxlength}
                class="input"
                on:focus={handleFocus}
                on:blur={handleBlur}
                on:input
                on:change
                on:keydown
                on:keyup
            />
        {/if}
        
        {#if $$slots.icon}
            <div class="icon">
                <slot name="icon" />
            </div>
        {/if}
    </div>
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
</div>

<style>
    .input-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }
    
    .label {
        font-weight: 600;
        font-size: 0.95rem;
        color: #4a5568;
        margin-bottom: 0.25rem;
        transition: color 0.2s ease;
    }
    
    .input-container.focused .label {
        color: #667eea;
    }
    
    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }
    
    .input {
        width: 100%;
        padding: 1rem 1.25rem;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        box-sizing: border-box;
    }
    
    .input:focus {
        outline: none;
        border-color: #667eea;
        background: rgba(255, 255, 255, 1);
        box-shadow: 
            0 0 0 3px rgba(102, 126, 234, 0.1),
            0 4px 12px rgba(102, 126, 234, 0.08);
        transform: translateY(-1px);
    }
    
    .input:disabled {
        background: #f7fafc;
        cursor: not-allowed;
        opacity: 0.6;
        transform: none;
    }
    
    .input-container.error .input {
        border-color: #e53e3e;
        background: rgba(255, 245, 245, 0.8);
    }
    
    .input-container.error .input:focus {
        border-color: #e53e3e;
        box-shadow: 
            0 0 0 3px rgba(229, 62, 62, 0.1),
            0 4px 12px rgba(229, 62, 62, 0.08);
    }
    
    .icon {
        position: absolute;
        right: 1rem;
        color: #a0aec0;
        pointer-events: none;
        display: flex;
        align-items: center;
    }
    
    .input-container.focused .icon {
        color: #667eea;
    }
    
    .error-message {
        font-size: 0.875rem;
        color: #e53e3e;
        margin-top: 0.25rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .error-message::before {
        content: "⚠";
        font-size: 0.75rem;
    }
    
    /* Placeholder styling */
    .input::placeholder {
        color: #a0aec0;
        transition: color 0.2s ease;
    }
    
    .input:focus::placeholder {
        color: #cbd5e0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .input {
            padding: 0.875rem 1rem;
            font-size: 1rem;
            border-radius: 10px;
        }

        .label {
            font-size: 0.9rem;
        }

        .error-message {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .input {
            padding: 1rem 1.125rem;
            font-size: 1.1rem;
            border-radius: 8px;
        }

        .label {
            font-size: 1rem;
            margin-bottom: 0.375rem;
        }

        .error-message {
            font-size: 0.875rem;
        }

        .icon {
            right: 0.875rem;
        }
    }
</style> 