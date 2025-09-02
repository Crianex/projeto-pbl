<script lang="ts">
    import { onMount } from "svelte";

    export let variant: "default" | "compact" | "text-only" = "default";
    export let animated: boolean = true;
    export let showSlogan: boolean = true;

    let displayText = "PBL.sys";
    let originalText = "PBL.sys";
    let animationInterval: ReturnType<typeof setInterval>;
    let autoAnimationInterval: ReturnType<typeof setInterval>;

    function animateText() {
        if (!animated) return;
        
        let pblText = "PBL";
        let sysText = "sys";
        let pblIndex = pblText.length;
        let sysIndex = sysText.length;
        
        clearInterval(animationInterval);
        
        animationInterval = setInterval(() => {
            // Apagar uma letra de cada palavra simultaneamente
            if (pblIndex > 0 || sysIndex > 0) {
                if (pblIndex > 0) {
                    pblText = pblText.slice(0, pblIndex - 1);
                    pblIndex--;
                }
                if (sysIndex > 0) {
                    sysText = sysText.slice(0, sysIndex - 1);
                    sysIndex--;
                }
                displayText = pblText + "." + sysText;
            } else {
                clearInterval(animationInterval);
                displayText = ".";
            }
        }, 120);
    }

    function animateTextReverse() {
        if (!animated) return;
        
        let pblText = "";
        let sysText = "";
        let pblIndex = 0;
        let sysIndex = 0;
        const targetPbl = "PBL";
        const targetSys = "sys";
        
        clearInterval(animationInterval);
        
        animationInterval = setInterval(() => {
            // Adicionar uma letra de cada palavra simultaneamente
            if (pblIndex < targetPbl.length || sysIndex < targetSys.length) {
                if (pblIndex < targetPbl.length) {
                    pblText += targetPbl[pblIndex];
                    pblIndex++;
                }
                if (sysIndex < targetSys.length) {
                    sysText += targetSys[sysIndex];
                    sysIndex++;
                }
                displayText = pblText + "." + sysText;
            } else {
                clearInterval(animationInterval);
                displayText = originalText;
            }
        }, 120);
    }

    function startAutoAnimation() {
        if (!animated) return;
        
        // Primeira animação: fechar
        animateText();
        
        // Após alguns segundos, abrir novamente
        setTimeout(() => {
            animateTextReverse();
        }, 3500);
    }

    function resetText() {
        clearInterval(animationInterval);
        displayText = originalText;
    }

    onMount(() => {
        if (animated) {
            // Iniciar animação automática após 2 segundos
            setTimeout(() => {
                startAutoAnimation();
            }, 2000);

            // Configurar animação automática a cada 12 segundos
            autoAnimationInterval = setInterval(() => {
                startAutoAnimation();
            }, 12000);
        }

        return () => {
            if (animationInterval) {
                clearInterval(animationInterval);
            }
            if (autoAnimationInterval) {
                clearInterval(autoAnimationInterval);
            }
        };
    });
</script>

{#if variant === "text-only"}
    <div class="brand-text-only">
        <span class="logo-text">{displayText}</span>
    </div>
{:else if variant === "compact"}
    <div class="brand-compact">
        <span class="logo-bracket">[</span>
        <span class="logo-text">{displayText}</span>
        <span class="logo-bracket">]</span>
    </div>
{:else}
    <div class="brand-container" class:with-slogan={showSlogan}>
        {#if showSlogan}
            <div class="brand-slogan">Sistema de Avaliação PBL</div>
        {/if}
        <div class="brand-logo">
            <span class="logo-bracket logo-open">[</span>
            <span class="logo-text">{displayText}</span>
            <span class="logo-bracket logo-close">]</span>
        </div>
        {#if showSlogan}
            <div class="brand-subtitle">Problem-Based Learning</div>
        {/if}
    </div>
{/if}

<style>
    /* Container principal */
    .brand-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        transition: all 0.3s ease;
    }

    .brand-container.with-slogan {
        gap: 0.5rem;
    }

    /* Slogan e subtitle */
    .brand-slogan {
        font-size: 0.875rem;
        color: var(--color-nature-main, #168F41);
        font-weight: 600;
        font-family: var(--font-body);
        text-align: center;
        opacity: 0.9;
        letter-spacing: 0.025em;
        text-transform: uppercase;
    }

    .brand-subtitle {
        font-size: 0.75rem;
        color: var(--color-font-caption, #a0aec0);
        font-weight: 400;
        font-family: var(--font-body);
        text-align: center;
        opacity: 0.8;
        font-style: italic;
        letter-spacing: 0.05em;
    }

    /* Logo principal */
    .brand-logo {
        font-size: 2rem;
        color: var(--color-nature-main, #168F41);
        font-weight: 800;
        font-family: var(--font-mono, 'Fira Mono');
        letter-spacing: 0.1em;
        position: relative;
        transition: all 0.4s ease;
        display: flex;
        align-items: center;
        gap: 0.05rem;
        text-shadow: 0 2px 4px rgba(22, 143, 65, 0.1);
    }

    .brand-logo:hover {
        transform: scale(1.05);
        color: var(--color-nature-light, #22C55E);
        text-shadow: 0 4px 8px rgba(22, 143, 65, 0.2);
    }

    /* Elementos do logo */
    .logo-bracket {
        transition: all 0.2s ease;
        color: var(--color-nature-dark, #014619);
        font-weight: 900;
        opacity: 0.8;
    }

    .logo-text {
        transition: all 0.2s ease;
        position: relative;
        background: linear-gradient(
            135deg, 
            var(--color-nature-main, #168F41) 0%, 
            var(--color-nature-light, #22C55E) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .brand-logo:hover .logo-bracket {
        color: var(--color-nature-light, #22C55E);
        opacity: 1;
        transform: scale(1.1);
    }

    .brand-logo:hover .logo-text {
        background: linear-gradient(
            135deg, 
            var(--color-nature-light, #22C55E) 0%, 
            var(--color-nature-lighter, #4ADE80) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Variante compacta */
    .brand-compact {
        display: flex;
        align-items: center;
        gap: 0.05rem;
        font-size: 1.25rem;
        color: var(--color-nature-main, #168F41);
        font-weight: 700;
        font-family: var(--font-mono, 'Fira Mono');
        letter-spacing: 0.1em;
        transition: all 0.3s ease;
    }

    .brand-compact:hover {
        color: var(--color-nature-light, #22C55E);
        transform: scale(1.02);
    }

    /* Variante text-only */
    .brand-text-only {
        display: inline-flex;
        align-items: center;
        font-size: 1rem;
        color: var(--color-nature-main, #168F41);
        font-weight: 600;
        font-family: var(--font-mono, 'Fira Mono');
        letter-spacing: 0.05em;
        transition: all 0.3s ease;
    }

    .brand-text-only:hover {
        color: var(--color-nature-light, #22C55E);
    }

    /* Animações específicas */
    @keyframes pulse-nature {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.02);
        }
    }

    .brand-logo:focus {
        animation: pulse-nature 2s ease-in-out infinite;
        outline: 2px solid var(--color-nature-border, rgba(22, 143, 65, 0.2));
        outline-offset: 4px;
        border-radius: 4px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .brand-logo {
            font-size: 1.5rem;
            letter-spacing: 0.05em;
        }

        .brand-slogan {
            font-size: 0.75rem;
        }

        .brand-subtitle {
            font-size: 0.7rem;
        }

        .brand-compact {
            font-size: 1rem;
        }

        .brand-text-only {
            font-size: 0.875rem;
        }
    }

    @media (max-width: 480px) {
        .brand-logo {
            font-size: 1.25rem;
        }

        .brand-container.with-slogan {
            gap: 0.375rem;
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .brand-slogan {
            color: var(--color-nature-light, #22C55E);
        }
        
        .brand-subtitle {
            color: var(--color-font-caption-light, #cbd5e0);
        }
        
        .logo-bracket {
            color: var(--color-nature-light, #22C55E);
        }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
        .brand-logo {
            text-shadow: none;
            font-weight: 900;
        }
        
        .logo-text {
            background: none;
            -webkit-text-fill-color: var(--color-nature-main, #168F41);
            color: var(--color-nature-main, #168F41);
        }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .brand-logo,
        .brand-compact,
        .brand-text-only,
        .logo-bracket,
        .logo-text {
            transition: none;
        }
        
        .brand-logo:focus {
            animation: none;
        }
    }
</style> 