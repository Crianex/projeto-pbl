<script lang="ts">
import Button from "$lib/components/Button.svelte";
import Container from "$lib/components/Container.svelte";
import { goto } from "$app/navigation";

function goToLogin() {
    goto("/login");
}
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Página inicial do sistema" />
</svelte:head>

<Container maxWidth="sm" glass={true} shadow={true} center={true}>
    <section class="home-section">
        <h1 class="home-title">
            Home ainda não implementada
        </h1>
        <Button variant="primary" on:click={goToLogin} class="home-login-btn">
            Ir para Login
        </Button>
    </section>
</Container>

<style>
    .home-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 3rem 0;
    }
    .home-title {
        text-align: center;
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 1rem;
        word-break: break-word;
    }
    .home-login-btn {
        min-width: 180px;
        font-size: 1.1rem;
    }
    @media (max-width: 640px) {
        .home-section {
            padding: 1.5rem 0.5rem;
            gap: 1.2rem;
        }
        .home-title {
            font-size: 1.3rem;
            margin-bottom: 0.5rem;
        }
        .home-login-btn {
            min-width: 120px;
            font-size: 1rem;
            padding: 0.75rem 1rem;
        }
    }
    @media (max-width: 400px) {
        .home-title {
            font-size: 1rem;
        }
        .home-login-btn {
            min-width: 90px;
            font-size: 0.95rem;
            padding: 0.5rem 0.75rem;
        }
    }
</style>
