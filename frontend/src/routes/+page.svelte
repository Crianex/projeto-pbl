<script lang="ts">
import Button from "$lib/components/Button.svelte";
import CardSection from "$lib/components/CardSection.svelte";
import { goto } from "$app/navigation";
import { fade, fly } from "svelte/transition";
import { quintOut } from "svelte/easing";
import HomepageSvg from "$lib/images/homepage.svg";

function goToLogin() {
    goto("/login");
}

function goToRegister() {
    goto("/register");
}

function goToFreeTrial() {
    // Placeholder para trial gratuito - pode redirecionar para registro
    goto("/register");
}
</script>

<svelte:head>
    <title>Gerenciamento de avaliações PBL</title>
    <meta name="description" content="Sistema para facilitar a vida de estudantes e instituições que aplicam o método de Aprendizagem Baseada em Problemas (PBL)" />
</svelte:head>

<div class="home-page">
    <!-- Header -->
    <header class="header" in:fly={{ y: -20, duration: 600, delay: 100, easing: quintOut }}>
        <div class="header-content">
            <div class="logo">
                <h1>Gerenciamento de avaliações PBL</h1>
            </div>
            <div class="header-buttons">
                <Button variant="ghost" on:click={goToLogin}>
                    Log In
                </Button>
                <Button variant="primary" on:click={goToFreeTrial}>
                    Start Free Trial
                </Button>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" in:fly={{ y: 30, duration: 800, delay: 200, easing: quintOut }}>
        <div class="hero-content">
            <div class="hero-text">
                <h2 class="hero-title">Avaliações mais rápidas</h2>
                <p class="hero-description">
                    Sistema para facilitar a vida de estudantes e instituições que aplicam o método de Aprendizagem Baseada em Problemas (PBL)
                </p>
                <div class="hero-buttons">
                    <Button variant="primary" size="large" on:click={goToRegister}>
                        Criar conta
                    </Button>
                    <Button variant="secondary" size="large" on:click={goToLogin}>
                        Login
                    </Button>
                </div>
            </div>
            <div class="hero-illustration" in:fly={{ x: 30, duration: 1000, delay: 400, easing: quintOut }}>
                <img src={HomepageSvg} alt="Ilustração PBL" class="illustration" />
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" in:fly={{ y: 40, duration: 800, delay: 600, easing: quintOut }}>
        <div class="features-content">
            <h3 class="features-title">Principais funcionalidades</h3>
            <div class="features-grid">
                <div in:fly={{ y: 20, duration: 600, delay: 800, easing: quintOut }}>
                    <CardSection 
                        title="Gestão de Avaliações" 
                        description="Crie e gerencie avaliações de forma intuitiva e eficiente"
                        interactive={true}
                    />
                </div>
                <div in:fly={{ y: 20, duration: 600, delay: 900, easing: quintOut }}>
                    <CardSection 
                        title="Relatórios Detalhados" 
                        description="Acompanhe o progresso dos estudantes com relatórios completos"
                        interactive={true}
                    />
                </div>
                <div in:fly={{ y: 20, duration: 600, delay: 1000, easing: quintOut }}>
                    <CardSection 
                        title="Interface Moderna" 
                        description="Design responsivo e fácil de usar em qualquer dispositivo"
                        interactive={true}
                    />
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" in:fly={{ y: 20, duration: 600, delay: 1200, easing: quintOut }}>
        <div class="footer-content">
            <p>/cria._nex></p>
        </div>
    </footer>
</div>

<style>
    .home-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-hero-gradient);
        color: var(--color-text-white);
        overflow-x: hidden;
    }

    /* Header Styles */
    .header {
        padding: 1rem 0;
        background: var(--color-glass-light);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--color-glass-border);
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .logo h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-white);
    }

    .header-buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    /* Hero Styles */
    .hero {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 4rem 0;
    }

    .hero-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
    }

    .hero-text {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .hero-title {
        font-size: 3.5rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
        background: var(--color-bg-text-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .hero-description {
        font-size: 1.25rem;
        line-height: 1.6;
        margin: 0;
        opacity: 0.9;
    }

    .hero-buttons {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .hero-illustration {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .illustration {
        width: 100%;
        max-width: 400px;
        height: auto;
        filter: drop-shadow(0 20px 40px var(--color-shadow-dark));
        animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-20px);
        }
    }

    /* Features Styles */
    .features {
        padding: 4rem 0;
        background: var(--color-glass-light);
        backdrop-filter: blur(10px);
    }

    .features-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .features-title {
        font-size: 2.5rem;
        font-weight: 600;
        text-align: center;
        margin: 0 0 3rem 0;
        color: var(--color-text-white);
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    /* Footer Styles */
    .footer {
        padding: 2rem 0;
        background: var(--color-shadow-dark);
        backdrop-filter: blur(10px);
        border-top: 1px solid var(--color-glass-border);
    }

    .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        text-align: center;
    }

    .footer-content p {
        margin: 0;
        opacity: 0.7;
        font-family: 'Courier New', monospace;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
        .hero-content {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
        }
        
        .hero-title {
            font-size: 3rem;
        }
        
        .illustration {
            max-width: 350px;
        }
    }

    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
        }
        .header-buttons {
            flex-direction: row;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            margin-top: 0.5rem;
        }
        .logo {
            margin-bottom: 0.25rem;
        }
        .hero {
            padding: 0.5rem 0 1rem 0;
        }
        .hero-content {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
        }
        .hero-text {
            gap: 1rem;
            align-items: center;
        }
        .hero-buttons {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            margin-top: 0.5rem;
        }
        .hero-buttons .button {
            width: 100%;
            min-width: 0;
            font-size: 1.1rem;
        }
        .hero-illustration {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .illustration {
            max-width: 180px;
        }
        .features {
            padding: 1.2rem 0 0.5rem 0;
        }
        .features-title {
            margin-bottom: 1.2rem;
        }
        .features-grid {
            gap: 0.75rem;
        }
        .footer {
            padding: 0.5rem 0;
        }
    }
    @media (max-width: 480px) {
        .header-buttons {
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .hero-buttons {
            gap: 0.5rem;
        }
        .features {
            padding: 0.5rem 0 0.25rem 0;
        }
        .features-title {
            margin-bottom: 0.75rem;
        }
    }
</style>
