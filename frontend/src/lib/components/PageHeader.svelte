<script lang="ts">
    export let backUrl: string;
    export let backText: string = "Voltar";
    export let title: string;
</script>

<div class="header">
    <div class="title-section">
        <a href={backUrl} class="back-link">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M19 12H5M12 19l-7-7 7-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
            {backText}
        </a>
        <h1>{title}</h1>
    </div>
</div>

<style>
    .header {
        margin: 1rem;
    }

    .title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        text-decoration: none;
        font-size: 0.875rem;
    }

    .back-link:hover {
        color: #0d6efd;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: #1f2937;
    }

    @media (max-width: 768px) {
        h1 {
            font-size: 1.3rem;
        }
    }

    @media (max-width: 480px) {
        h1 {
            font-size: 1.1rem;
        }
    }
</style>
