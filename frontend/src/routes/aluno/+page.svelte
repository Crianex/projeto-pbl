<script lang="ts">
    import CardSection from "$lib/components/CardSection.svelte";
</script>

<div class="container">
    <h1>Bem-vindo, Aluno!</h1>

    <div class="grid">
        <CardSection href="/aluno/problemas" title="Problemas">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                ></path>
                <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            Acesse seus problemas ativos e histórico de submissões
        </CardSection>

        <CardSection href="/aluno/avaliacoes" title="Avaliações">
            <svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                ></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
            </svg>
            Visualize suas avaliações pendentes e concluídas
        </CardSection>

        <CardSection href="/aluno/notas" title="Notas">
            <svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
                ></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            Acompanhe seu desempenho e notas
        </CardSection>

        <CardSection href="/aluno/perfil" title="Perfil">
            <svg
                slot="icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Gerencie suas informações pessoais
        </CardSection>
    </div>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    h1 {
        margin-bottom: 2rem;
        color: #1a1a1a;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
    }
</style>
