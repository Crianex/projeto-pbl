<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import CardSection from "$lib/components/CardSection.svelte";
    import BrandLogo from "$lib/components/BrandLogo.svelte";
    import { goto } from "$app/navigation";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

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
    <meta
        name="description"
        content="Sistema para facilitar a vida de estudantes e instituições que aplicam o método de Aprendizagem Baseada em Problemas (PBL)"
    />
</svelte:head>

<div class="home-page">
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <img
                    src="/images/logounrv.svg"
                    alt="Logo UNRV"
                    class="logo-image"
                />
                <h1 class="header-title">Gerenciamento de avaliações PBL</h1>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <div class="hero-text">
                <h2 class="hero-title">Avaliações mais rápidas</h2>
                <p class="hero-description">
                    Sistema para facilitar a vida de estudantes e instituições
                    que aplicam o método de Aprendizagem Baseada em Problemas
                    (PBL)
                </p>
                <div class="hero-buttons">
                    <Button
                        variant="primary"
                        size="large"
                        on:click={goToRegister}
                    >
                        Criar conta
                    </Button>
                    <Button
                        variant="secondary"
                        size="large"
                        on:click={goToLogin}
                    >
                        Login
                    </Button>
                </div>
            </div>
            <div
                class="hero-illustration"
                in:fly={{ x: 30, duration: 1000, delay: 400, easing: quintOut }}
            >
                <img
                    src="/images/homepage.svg"
                    alt="Ilustração PBL"
                    class="illustration"
                />
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="features-content">
            <h3 class="features-title">
                Uma solução criada para os estudantes poderem
            </h3>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon-container">
                        <img
                            src="/images/carinhahome.svg"
                            alt="Ícone de avaliação"
                            class="feature-icon"
                        />
                    </div>
                    <div class="feature-content">
                        <div class="feature-text-line">
                            Avaliar os colegas em
                        </div>
                        <div class="feature-highlight-line">5 min</div>
                    </div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon-container">
                        <img
                            src="/images/folderhome.svg"
                            alt="Ícone de documentos"
                            class="feature-icon"
                        />
                    </div>
                    <div class="feature-content">
                        <div class="feature-text-line">
                            Enviar documentos e trabalhos
                        </div>
                        <div class="feature-highlight-line">na plataforma</div>
                    </div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon-container">
                        <img
                            src="/images/setinhahome.svg"
                            alt="Ícone de visualização"
                            class="feature-icon"
                        />
                    </div>
                    <div class="feature-content">
                        <div class="feature-text-line">
                            Visualizar as avaliações recebidas
                        </div>
                        <div class="feature-highlight-line">
                            instantaneamente
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <BrandLogo />
            <div class="footer-info">
                <p class="footer-description">
                    Plataforma de gestão de avaliações PBL desenvolvida para
                    facilitar a vida de estudantes e instituições
                </p>
            </div>
        </div>
    </footer>
</div>

<style>
    @font-face {
        font-family: "Source Code Pro";
        src: url("/src/lib/fonts/SourceCodePro-VariableFont_wght.ttf")
            format("truetype");
        font-weight: 200 900;
        font-style: normal;
    }

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
        justify-content: center;
        align-items: center;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .logo-image {
        width: 60px;
        height: 60px;
    }

    .header-title {
        font-size: 1.5rem;
        font-weight: 700;
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
        0%,
        100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-20px);
        }
    }

    /* Features Styles */
    .features {
        padding: 5rem 0;
        background: linear-gradient(
            180deg,
            var(--color-text-white) 0%,
            var(--color-nature-background-light) 100%
        );
        backdrop-filter: blur(10px);
        position: relative;
    }

    .features::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            var(--color-nature-main),
            transparent
        );
    }

    .features-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        position: relative;
    }

    .features-title {
        font-size: 2.8rem;
        font-weight: 700;
        text-align: center;
        margin: 0 0 4rem 0;
        color: var(--color-nature-dark);
        position: relative;
        line-height: 1.3;
    }

    .features-title::after {
        content: "";
        position: absolute;
        bottom: -1rem;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 4px;
        background: linear-gradient(
            90deg,
            var(--color-nature-main),
            var(--color-nature-accent)
        );
        border-radius: 2px;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .feature-card {
        background: var(--color-text-white);
        border: 2px dashed var(--color-nature-background-light);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        transition: all 0.3s ease;
        position: relative;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .feature-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: var(--color-nature-main);
    }

    .feature-icon-container {
        flex-shrink: 0;
        width: 3rem;
        height: 3rem;
        background: var(--color-nature-background-light);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .feature-card:hover .feature-icon-container {
        background: var(--color-nature-main);
        transform: scale(1.05);
    }

    .feature-icon {
        width: 1.5rem;
        height: 1.5rem;
        filter: var(--color-font-body-dark);
        transition: all 0.3s ease;
    }

    .feature-card:hover .feature-icon {
        filter: var(--color-text-white);
    }

    .feature-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .feature-text-line {
        color: var(--color-font-body-dark);
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
        font-weight: 400;
    }

    .feature-highlight-line {
        color: var(--color-nature-main);
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
    }

    .feature-card:hover .feature-highlight-line {
        color: var(--color-nature-dark);
    }

    /* Footer Styles */
    .footer {
        padding: 3rem 0 2rem 0;
        background: linear-gradient(
            180deg,
            #0f172a 0%,
            #1e293b 50%,
            #0f172a 100%
        );
        border-top: 1px solid rgba(16, 185, 129, 0.2);
        position: relative;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .footer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
            90deg,
            transparent,
            #10b981,
            #059669,
            #10b981,
            transparent
        );
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }

    .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .footer-info {
        text-align: center;
        max-width: 600px;
    }

    .footer-description {
        color: #f1f5f9;
        font-size: 1rem;
        line-height: 1.7;
        margin: 0;
        opacity: 0.85;
        font-weight: 400;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

        .logo {
            flex-direction: column;
            gap: 0.5rem;
        }

        .header-title {
            margin-left: 0;
            margin-top: 0.5rem;
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
            padding: 1.5rem 0 1rem 0;
        }

        .footer-content {
            gap: 1rem;
        }

        .footer-description {
            font-size: 0.9rem;
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
