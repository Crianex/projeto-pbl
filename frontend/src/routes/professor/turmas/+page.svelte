<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import type { TurmaModel } from "$lib/interfaces/interfaces";

    let turmas: TurmaModel[] = [
        {
            id_turma: 1,
            nome_turma: "Turma 1",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
        {
            id_turma: 2,
            nome_turma: "Turma 2",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
        {
            id_turma: 3,
            nome_turma: "Turma 3",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
        {
            id_turma: 4,
            nome_turma: "Turma 4",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
        {
            id_turma: 5,
            nome_turma: "Turma 5",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
        {
            id_turma: 6,
            nome_turma: "Turma 6",
            created_at: new Date(),
            id_professor: 1,
            professor: null,
            alunos: [],
        },
    ];

    let currentPage = 1;
    let itemsPerPage = 5;
    let searchQuery = "";

    $: filteredTurmas = turmas.filter((turma) =>
        turma.nome_turma?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    $: totalPages = Math.ceil(filteredTurmas.length / itemsPerPage);
    $: paginatedTurmas = filteredTurmas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    function handleCreateTurma() {
        // TODO: Implement create turma functionality
    }
</script>

<div class="turmas-container">
    <div class="header">
        <h1>Turmas</h1>
        <div class="search-bar">
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar turma..."
            />
            <Button variant="primary" on:click={handleCreateTurma}>
                + Criar turma
            </Button>
        </div>
    </div>

    <div class="turmas-list">
        {#each paginatedTurmas as turma (turma.id_turma)}
            <div class="turma-item">
                <span>{turma.nome_turma}</span>
                <button class="more-options">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                    </svg>
                </button>
            </div>
        {/each}
    </div>

    <div class="pagination">
        <button
            class="page-nav"
            disabled={currentPage === 1}
            on:click={() => currentPage--}
        >
            Previous
        </button>

        {#each Array(totalPages) as _, i}
            <button
                class="page-number"
                class:active={currentPage === i + 1}
                on:click={() => (currentPage = i + 1)}
            >
                {i + 1}
            </button>
        {/each}

        <button
            class="page-nav"
            disabled={currentPage === totalPages}
            on:click={() => currentPage++}
        >
            Next
        </button>
    </div>
</div>

<style>
    .turmas-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .header {
        margin-bottom: 2rem;
    }

    .header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .search-bar {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search-bar input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .turmas-list {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }

    .turma-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .turma-item:last-child {
        border-bottom: none;
    }

    .more-options {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #6c757d;
        border-radius: 4px;
    }

    .more-options:hover {
        background-color: #f8f9fa;
    }

    .pagination {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
    }

    .page-nav,
    .page-number {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        background: white;
        cursor: pointer;
        border-radius: 4px;
    }

    .page-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-number.active {
        background: #0d6efd;
        color: white;
        border-color: #0d6efd;
    }

    .page-nav:hover:not(:disabled),
    .page-number:hover:not(.active) {
        background: #f8f9fa;
    }
</style>
