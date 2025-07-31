<script lang="ts">
    export let statistics: {
        totalAlunos: number;
        maiorNota: number;
        mediaGeral: number;
        menorNota: number;
    } = {
        totalAlunos: 0,
        maiorNota: 0,
        mediaGeral: 0,
        menorNota: 0,
    };
</script>

<div class="statistics-header">
    <div class="stat-card">
        <div class="stat-value">{statistics.totalAlunos}</div>
        <div class="stat-label">Total Alunos</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{statistics.maiorNota}</div>
        <div class="stat-label">Maior Nota</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{statistics.mediaGeral}</div>
        <div class="stat-label">Média Geral</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">{statistics.menorNota}</div>
        <div class="stat-label">Menor Nota</div>
    </div>
</div>

<style>
    .statistics-header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        justify-content: center;
    }

    .stat-card {
        text-align: center;
        padding: 0.5rem 0.7rem;
        background: #f8fafc;
        border: 1px solid #e0e7ff;
        border-radius: 6px;
        box-shadow: none;
        min-width: 70px;
        transition: none;
    }

    .stat-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #6c63ff;
        margin-bottom: 0.1rem;
    }

    .stat-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
        .statistics-header {
            flex-direction: column;
            gap: 0.2rem;
            padding: 0;
        }

        .stat-card {
            padding: 0.2rem 0.3rem;
            min-width: 60px;
        }

        .stat-value {
            font-size: 0.93rem;
        }

        .stat-label {
            font-size: 0.7rem;
        }
    }
</style>
