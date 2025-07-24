<script lang="ts">
import Button from "$lib/components/Button.svelte";
import CardSection from "$lib/components/CardSection.svelte";
import { goto } from "$app/navigation";
import { fade, fly } from "svelte/transition";
import { quintOut } from "svelte/easing";
import HomepageSvg from "$lib/images/homepage.svg";
import LogoSvg from "$lib/images/logounrv.svg";

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
                <img src={LogoSvg} alt="Logo UNRV" class="logo-image" />
                <h1 class="header-title">Gerenciamento de avaliações PBL</h1>
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
            <h3 class="features-title">Uma solução criada para os estudantes poderem</h3>
            <div class="features-grid">
                <div class="feature-card" in:fly={{ y: 20, duration: 600, delay: 800, easing: quintOut }}>
                    <div class="feature-icon">😊</div>
                    <div class="feature-content">
                        <p class="feature-text">Avaliar os colegas em <strong class="feature-highlight">5 min</strong></p>
                    </div>
                </div>
                <div class="feature-card" in:fly={{ y: 20, duration: 600, delay: 900, easing: quintOut }}>
                    <div class="feature-icon">📄</div>
                    <div class="feature-content">
                        <p class="feature-text">Enviar documentos e trabalhos <strong class="feature-highlight">na plataforma</strong></p>
                    </div>
                </div>
                <div class="feature-card" in:fly={{ y: 20, duration: 600, delay: 1000, easing: quintOut }}>
                    <div class="feature-icon">📈</div>
                    <div class="feature-content">
                        <p class="feature-text">Visualizar as avaliações recebidas <strong class="feature-highlight">instantaneamente</strong></p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" in:fly={{ y: 20, duration: 600, delay: 1200, easing: quintOut }}>
        <div class="footer-content">
            <p class="project-text">um projeto</p>
            <p class="project-name">/cria._nex></p>
        </div>
    </footer>
</div>

<style>
    .home-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--color-nature-gradient);
        color: var(--color-text-white);
        overflow-x: hidden;
    }

    /* Header Styles */
    .header {
        padding: 1rem 0;
        background: var(--color-text-white);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--color-nature-background-light);
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .logo-image {
        width: 40px;
        height: 40px;
    }



    .header-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--color-nature-main);
        margin-left: 1rem;
    }

    .header-buttons {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    /* Hero Styles */
    .hero {
        background: var(--color-nature-background-light);
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
        color: var(--color-font-heading-dark);
    }

    .hero-description {
        color: var(--color-font-body-dark);
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
        filter: drop-shadow(0 20px 40px var(--color-nature-shadow));
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
        background: var(--color-text-white);
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
        color: var(--color-nature-dark);
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .feature-card {
        background: var(--color-nature-background-light);
        border: 1px solid var(--color-border-light);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        transition: all 0.3s ease;
    }

    .feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--color-nature-shadow-light);
    }

    .feature-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
    }

    .feature-content {
        text-align: center;
    }

    .feature-text {
        color: var(--color-font-body-dark);
        font-size: 1.1rem;
        line-height: 1.5;
        margin: 0;
    }

    .feature-highlight {
        color: var(--color-nature-main);
        font-weight: 700;
    }

    /* Footer Styles */
    .footer {
        padding: 2rem 0;
        background: var(--color-nature-dark);
        backdrop-filter: blur(10px);
        border-top: 1px solid var(--color-nature-glass-border);
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
        color: var(--color-text-white);
    }

    .footer-content .project-text {
        font-size: 0.9rem;
        color: var(--color-text-light);
        margin-bottom: 0.5rem;
    }

    .footer-content .project-name {
        font-size: 1.1rem;
        color: #ff6b9d;
        font-weight: 600;
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
            gap: 1rem;
            text-align: center;
        }

        .logo {
            flex-direction: column;
            gap: 0.5rem;
        }

        .header-title {
            margin-left: 0;
            margin-top: 0.5rem;
        }

        .header-buttons {
            flex-direction: column;
            width: 100%;
        }

        .hero {
            padding: 2rem 0;
        }

        .hero-content {
            gap: 2rem;
            padding: 0 1rem;
        }

        .hero-title {
            font-size: 2.5rem;
        }

        .hero-description {
            font-size: 1.1rem;
        }

        .hero-buttons {
            flex-direction: column;
            align-items: stretch;
        }

        .illustration {
            max-width: 280px;
        }

        .features-content {
            padding: 0 1rem;
        }

        .features-title {
            font-size: 2rem;
        }

        .features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .logo h1 {
            font-size: 1.2rem;
        }

        .hero-title {
            font-size: 2rem;
        }

        .hero-description {
            font-size: 1rem;
        }

        .illustration {
            max-width: 240px;
        }

        .features-title {
            font-size: 1.8rem;
        }
    }
</style>
