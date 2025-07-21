<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { currentUser } from "$lib/utils/auth";

    onMount(() => {
        // Redirect to the unified evaluation page
        const id_problema = $page.params.id_problema;
        const id_aluno_avaliado = $page.url.searchParams.get("id_aluno");

        if (!id_aluno_avaliado) {
            // If no student specified, redirect back to the previous page
            history.back();
            return;
        }

        // For professor evaluations
        const redirectUrl = `/avaliacao?id_problema=${id_problema}&id_aluno_avaliado=${id_aluno_avaliado}&id_professor=${$currentUser?.id}`;

        goto(redirectUrl, { replaceState: true });
    });
</script>

<!-- This page is just a redirect, no content needed -->
<div>Redirecionando...</div>
