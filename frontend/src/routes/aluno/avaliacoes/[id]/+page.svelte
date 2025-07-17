<script lang="ts">
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';

    interface Criterio {
        titulo: string;
        descricao: string[];
    }

    const criterios: Record<string, Criterio> = {
        conhecimentos: {
            titulo: "Critérios Conhecimentos",
            descricao: [
                "Identificação do problema",
                "Elaboração das hipóteses Sistematização das hipóteses",
                "Formulação de bons objetivos de aprendizagem",
                "Coerência no raciocínio, argumentação e senso crítico",
                "Seleção de boas referências bibliográficas para o estudo individual",
                "Contribuição para responder os objetivos de aprendizagem e resolver o problema"
            ]
        },
        habilidades: {
            titulo: "Critérios Habilidades",
            descricao: [
                "Participação ativa nas discussões",
                "Contribuição com ideias relevantes",
                "Capacidade de síntese e organização",
                "Comunicação clara e efetiva",
                "Trabalho em equipe"
            ]
        },
        atitudes: {
            titulo: "Critérios Atitudes",
            descricao: [
                "Pontualidade e assiduidade",
                "Respeito às opiniões dos colegas",
                "Postura profissional e ética",
                "Proatividade e iniciativa",
                "Comprometimento com o grupo"
            ]
        }
    };

    let avaliacaoData = {
        aluno: {
            nome: "Fulana",
            avatar: "/avatars/default.png"
        },
        analise: {
            conhecimentos: "",
            habilidades: "",
            atitudes: ""
        },
        resolucao: {
            conhecimentos: "",
            habilidades: "",
            atitudes: ""
        }
    };

    let criterioAtual: keyof typeof criterios | null = null;

    function showCriterios(tipo: keyof typeof criterios) {
        criterioAtual = tipo;
    }

    function hideCriterios() {
        criterioAtual = null;
    }

    async function handleSubmit() {
        // TODO: Implementar lógica de salvamento
        console.log('Salvando avaliação:', avaliacaoData);
    }
</script>

<div class="container" transition:fade={{ duration: 300 }}>
    <div class="header">
        <button class="close-btn" on:click={() => history.back()}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <h1>Avaliação Individual</h1>
    </div>

    <div class="student-info">
        <div class="avatar">
            <img src={avaliacaoData.aluno.avatar} alt={avaliacaoData.aluno.nome} />
        </div>
        <p>Como foi o desempenho da <span class="highlight">{avaliacaoData.aluno.nome}</span> nesse problema?</p>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="evaluation-section">
            <h2>Análise do Problema</h2>
            
            <div class="criteria-group">
                <label>
                    <span class="criteria-header">
                        <span>Conhecimentos</span>
                        <span class="range">0,0 a 1,0</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            bind:value={avaliacaoData.analise.conhecimentos}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('conhecimentos')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>

                <label>
                    <span class="criteria-header">
                        <span>Habilidades</span>
                        <span class="range">0,0 a 1,5</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1.5"
                            bind:value={avaliacaoData.analise.habilidades}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('habilidades')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>

                <label>
                    <span class="criteria-header">
                        <span>Atitudes</span>
                        <span class="range">0,0 a 1,5</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1.5"
                            bind:value={avaliacaoData.analise.atitudes}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('atitudes')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>
            </div>
        </div>

        <div class="evaluation-section">
            <h2>Resolução do Problema</h2>
            
            <div class="criteria-group">
                <label>
                    <span class="criteria-header">
                        <span>Conhecimentos</span>
                        <span class="range">0,0 a 1,0</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            bind:value={avaliacaoData.resolucao.conhecimentos}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('conhecimentos')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>

                <label>
                    <span class="criteria-header">
                        <span>Habilidades</span>
                        <span class="range">0,0 a 1,5</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1.5"
                            bind:value={avaliacaoData.resolucao.habilidades}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('habilidades')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>

                <label>
                    <span class="criteria-header">
                        <span>Atitudes</span>
                        <span class="range">0,0 a 1,5</span>
                    </span>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1.5"
                            bind:value={avaliacaoData.resolucao.atitudes}
                        />
                        <button
                            type="button"
                            class="criteria-btn"
                            on:click={() => showCriterios('atitudes')}
                        >
                            Critérios
                        </button>
                    </div>
                </label>
            </div>
        </div>

        <button type="submit" class="submit-btn">Salvar</button>
    </form>

    {#if criterioAtual}
        <div class="criteria-modal" transition:fade={{ duration: 200 }}>
            <div class="criteria-content" on:click|stopPropagation>
                <div class="criteria-header">
                    <h3>{criterios[criterioAtual].titulo}</h3>
                    <button class="close-criteria-btn" on:click={hideCriterios}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <p class="criteria-subtitle">
                    Para avaliar o desempenho sobre essa categoria siga os seguintes critérios:
                </p>
                <ul>
                    {#each criterios[criterioAtual].descricao as item}
                        <li>{item}</li>
                    {/each}
                </ul>
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .close-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        transform: scale(1.1);
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
    }

    .student-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .student-info p {
        font-size: 1.125rem;
        color: #495057;
        margin: 0;
    }

    .highlight {
        color: #667eea;
        font-weight: 600;
    }

    .evaluation-section {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 1.5rem 0;
    }

    .criteria-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .criteria-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .range {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .input-wrapper {
        display: flex;
        gap: 0.75rem;
    }

    input[type="number"] {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
        color: #495057;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    input[type="number"]:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 
            0 0 0 3px rgba(102, 126, 234, 0.25),
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .criteria-btn {
        padding: 0.75rem 1.25rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        color: #667eea;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .criteria-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 249, 250, 1) 100%);
        transform: translateY(-1px);
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .submit-btn {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .criteria-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 1000;
    }

    .criteria-content {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.98) 100%);
        border-radius: 16px;
        padding: 2rem;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.15),
            0 4px 16px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .criteria-content h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
    }

    .criteria-subtitle {
        color: #667eea;
        font-size: 0.875rem;
        margin: 1rem 0;
    }

    .criteria-content ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .criteria-content li {
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(206, 212, 218, 0.2);
        color: #495057;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .criteria-content li:before {
        content: "•";
        color: #667eea;
        font-weight: bold;
    }

    .criteria-content li:last-child {
        border-bottom: none;
    }

    .close-criteria-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        position: absolute;
        top: 1rem;
        right: 1rem;
    }

    .close-criteria-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        .container {
            padding: 1rem;
        }

        .student-info {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
        }

        .avatar {
            width: 64px;
            height: 64px;
        }

        .evaluation-section {
            padding: 1rem;
        }

        .input-wrapper {
            flex-direction: column;
        }

        .criteria-btn {
            padding: 0.5rem 1rem;
        }
    }

    @media (max-width: 480px) {
        h1 {
            font-size: 1.5rem;
        }

        .student-info p {
            font-size: 1rem;
        }

        .criteria-content {
            padding: 1.5rem;
        }
    }
</style> 