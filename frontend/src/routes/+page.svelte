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
    <section style="display: flex; flex-direction: column; align-items: center; gap: 2rem; padding: 3rem 0;">
        <h1 style="text-align: center; font-size: 2.2rem; font-weight: 700; margin-bottom: 1rem;">
            Home ainda não implementada
        </h1>
        <Button variant="primary" on:click={goToLogin} style="min-width: 180px; font-size: 1.1rem;">
            Ir para Login
        </Button>
    </section>
</Container>
