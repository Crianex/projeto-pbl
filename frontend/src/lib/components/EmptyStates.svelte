<script lang="ts">
    export let turmas: any[] = [];
    export let selectedTurma: any = null;
    export let problemas: any[] = [];
    export let loading: boolean = false;
</script>

{#if turmas.length === 0 && !loading}
    <div class="empty-state">
        <p>Nenhuma turma encontrada.</p>
    </div>
{:else if selectedTurma && problemas.length === 0 && !loading}
    <div class="empty-state">
        <p>Nenhum problema encontrado para esta turma.</p>
        <p class="empty-state-subtitle">
            Quando problemas forem criados para esta turma, eles aparecerão
            aqui.
        </p>
    </div>
{/if}

<style>
    .empty-state {
        text-align: center;
        padding: 1rem 0.5rem;
        background: #fff;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        color: #6c757d;
        font-size: 1rem;
        box-shadow: none;
    }

    .empty-state-subtitle {
        font-size: 0.9rem;
        color: #9ca3af;
        margin-top: 0.5rem;
        margin-bottom: 0;
    }

    @media (max-width: 768px) {
        .empty-state {
            padding: 0.5rem 0.1rem;
        }
    }

    @media (max-width: 480px) {
        .empty-state {
            padding: 0.2rem 0.02rem;
        }
    }
</style>
