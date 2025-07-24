<script lang="ts">
    import AppLayout from "$lib/components/AppLayout.svelte";
    // Query parameters
    let id_problema: string;
    let id_aluno_avaliador: string | null;
    let id_aluno_avaliado: string | null;
    let id_professor: string | null;
    let isProfessorEvaluation = false;
</script>

<AppLayout userType={isProfessorEvaluation ? "professor" : "aluno"}>
    <slot />
</AppLayout>
