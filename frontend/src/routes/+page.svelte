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

<Container class="responsive-container" maxWidth="sm" glass={true} shadow={true} center={true}>
    <section>
        <h1 class="responsive-title">
            Home ainda não implementada
        </h1>
        <Button variant="primary" on:click={goToLogin} class="responsive-btn">
            Ir para Login
        </Button>
    </section>
</Container>

<style>
    /* Removido: todo o CSS local de responsividade, pois agora usamos as classes globais */
</style>
