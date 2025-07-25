<script lang="ts">
    import { onMount } from "svelte";

    let displayText = "cria._nex";
    let originalText = "cria._nex";
    let animationInterval: ReturnType<typeof setInterval>;
    let autoAnimationInterval: ReturnType<typeof setInterval>;

    function animateText() {
        let criaText = "cria";
        let nexText = "nex";
        let criaIndex = criaText.length;
        let nexIndex = nexText.length;
        
        clearInterval(animationInterval);
        
        animationInterval = setInterval(() => {
            // Apagar uma letra de cada palavra simultaneamente
            if (criaIndex > 0 || nexIndex > 0) {
                if (criaIndex > 0) {
                    criaText = criaText.slice(0, criaIndex - 1);
                    criaIndex--;
                }
                if (nexIndex > 0) {
                    nexText = nexText.slice(0, nexIndex - 1);
                    nexIndex--;
                }
                displayText = criaText + "._" + nexText;
            } else {
                clearInterval(animationInterval);
                displayText = "._";
            }
        }, 100);
    }

    function animateTextReverse() {
        let criaText = "";
        let nexText = "";
        let criaIndex = 0;
        let nexIndex = 0;
        const targetCria = "cria";
        const targetNex = "nex";
        
        clearInterval(animationInterval);
        
        animationInterval = setInterval(() => {
            // Adicionar uma letra de cada palavra simultaneamente
            if (criaIndex < targetCria.length || nexIndex < targetNex.length) {
                if (criaIndex < targetCria.length) {
                    criaText += targetCria[criaIndex];
                    criaIndex++;
                }
                if (nexIndex < targetNex.length) {
                    nexText += targetNex[nexIndex];
                    nexIndex++;
                }
                displayText = criaText + "._" + nexText;
            } else {
                clearInterval(animationInterval);
                displayText = originalText;
            }
        }, 100);
    }

    function startAutoAnimation() {
        // Primeira animação: fechar
        animateText();
        
        // Após 2 segundos, abrir novamente
        setTimeout(() => {
            animateTextReverse();
        }, 4000);
    }

    function resetText() {
        clearInterval(animationInterval);
        displayText = originalText;
    }

    onMount(() => {
        // Iniciar animação automática após 1 segundo
        setTimeout(() => {
            startAutoAnimation();
        }, 1000);

        // Configurar animação automática a cada 6 segundos
        autoAnimationInterval = setInterval(() => {
            startAutoAnimation();
        }, 10000);

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

<div class="footer-brand">
    <div class="brand-text">um projeto</div>
    <div class="brand-logo">
        <span class="logo-char logo-slash">/</span>
        <span class="logo-char logo-text">{displayText}</span>
        <span class="logo-char logo-greater">></span>
    </div>
</div>

<style>
    .footer-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .brand-text {
        font-size: 0.9rem;
        color: #e2e8f0;
        font-weight: 500;
        opacity: 0.9;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .brand-logo {
        font-size: 1.5rem;
        color: #10b981;
        font-weight: 800;
        font-family: 'Source Code Pro';
        letter-spacing: 0.8px;
        position: relative;
        transition: all 0.4s ease;
        display: flex;
        align-items: center;
        gap: 0.1rem;
    }

    .logo-char {
        transition: all 0.1s ease;
        display: inline-block;
        position: relative;
    }

    .logo-text {
        transition: all 0.1s ease;
    }

    .logo-slash, .logo-dot, .logo-underscore, .logo-greater {
        transition: all 0.1s ease;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .brand-logo {
            font-size: 1.2rem;
        }
    }
</style> 