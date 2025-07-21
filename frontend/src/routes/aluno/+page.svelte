<Container class="responsive-container">
    <!-- Conteúdo da página de redirecionamento -->
</Container>

<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Container from "$lib/components/Container.svelte";

    onMount(() => {
        goto("/aluno/problemas");
    });
</script>
