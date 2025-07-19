<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { onMount } from "svelte";
    import { currentUser } from "$lib/utils/auth";
    import type {
        AvaliacaoModel,
        ProblemaModel,
    } from "$lib/interfaces/interfaces";
    import { Parsers } from "$lib/interfaces/parsers";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";

    interface Avaliacao {
        id_avaliacao: number;
        problema: string;
        aluno: {
            id: number;
            nome: string;
            avatar: string;
        };
        nota?: number;
        enviada: boolean;
        isCurrentUser?: boolean;
    }

    let avaliacoes: Avaliacao[] = [];
    let problema: ProblemaModel;
    let loading = true;
    let error: string | null = null;

    let currentPage = 1;
    const itemsPerPage = 10;
    $: totalPages = Math.ceil(avaliacoes.length / itemsPerPage);

    $: paginatedAvaliacoes = avaliacoes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    async function fetchAvaliacoes() {
        try {
            loading = true;
            error = null;
            const id_problema = parseInt($page.params.id_problema);

            // Get the problem details first
            const problemaData = await api.get(
                `/problemas/get?id_problema=${id_problema}`,
            );
            problema = Parsers.parseProblema(problemaData);

            // Get all evaluations using the service
            const avaliacoesData =
                await AvaliacoesService.getAvaliacoes(id_problema);

            // Transform the data to match our interface
            avaliacoes = avaliacoesData.map((avaliacao) => {
                const media = avaliacao.notas
                    ? Object.values(avaliacao.notas)
                          .flatMap((criterios) => Object.values(criterios))
                          .reduce((sum, nota) => sum + nota, 0) /
                      Object.values(avaliacao.notas).flatMap((criterios) =>
                          Object.values(criterios),
                      ).length
                    : undefined;

                return {
                    id_avaliacao: avaliacao.id_avaliacao,
                    problema: problema.nome_problema || "",
                    aluno: {
                        id: avaliacao.aluno_avaliado?.id || 0,
                        nome: avaliacao.aluno_avaliado?.nome_completo || "",
                        avatar: "/avatars/default.png",
                    },
                    nota: media,
                    enviada: true,
                    isCurrentUser:
                        avaliacao.aluno_avaliado?.id === $currentUser?.id,
                };
            });

            // Add students without evaluations
            if (problema.turma?.alunos) {
                const avaliacoesMap = new Map(
                    avaliacoes.map((av) => [av.aluno.id, av]),
                );

                problema.turma.alunos.forEach((aluno) => {
                    if (!avaliacoesMap.has(aluno.id)) {
                        avaliacoes.push({
                            id_avaliacao: 0,
                            problema: problema.nome_problema || "",
                            aluno: {
                                id: aluno.id,
                                nome: aluno.nome_completo || "",
                                avatar: "/avatars/default.png",
                            },
                            enviada: false,
                            isCurrentUser: aluno.id === $currentUser?.id,
                        });
                    }
                });
            }
        } catch (e: any) {
            error = e.message || "Erro ao carregar avaliações";
        } finally {
            loading = false;
        }
    }

    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
    }

    function getPageNumbers() {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(i);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pages.push("...");
            }
        }
        return pages;
    }

    function handleSelfEvaluation() {
        const id_problema = $page.params.id_problema;
        goto(`/aluno/problemas/${id_problema}/avaliacoes/${$currentUser?.id}`);
    }

    function handleEvaluation(alunoId: number) {
        const id_problema = $page.params.id_problema;
        goto(`/aluno/problemas/${id_problema}/avaliacoes/${alunoId}`);
    }

    onMount(fetchAvaliacoes);
</script>

<div class="container" transition:fade={{ duration: 300 }}>
    {#if loading}
        <div class="loading-container">
            <LoadingSpinner size="lg" />
            <p>Carregando avaliações...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p class="error-message">{error}</p>
        </div>
    {:else}
        <div class="header">
            <h1>Avaliações - {problema.nome_problema}</h1>
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
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th class="text-right">Avaliação enviada</th>
                    </tr>
                </thead>
                <tbody>
                    {#each paginatedAvaliacoes as avaliacao (avaliacao.aluno.id)}
                        <tr class="evaluation-row">
                            <td>
                                <div class="student-info">
                                    <div class="avatar">
                                        <img
                                            src={avaliacao.aluno.avatar}
                                            alt={avaliacao.aluno.nome}
                                        />
                                    </div>
                                    <span>{avaliacao.aluno.nome}</span>
                                </div>
                            </td>
                            <td class="text-right">
                                {#if avaliacao.enviada}
                                    <div class="grade">
                                        {avaliacao.nota?.toFixed(2) || "0.00"}
                                    </div>
                                {:else if avaliacao.isCurrentUser}
                                    <button
                                        class="evaluate-btn"
                                        on:click={handleSelfEvaluation}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                        >
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                            />
                                        </svg>
                                        Avaliar
                                    </button>
                                {:else}
                                    <button
                                        class="evaluate-btn"
                                        on:click={() =>
                                            handleEvaluation(
                                                avaliacao.aluno.id,
                                            )}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                        >
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                            />
                                        </svg>
                                        Avaliar
                                    </button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if totalPages > 1}
            <div class="pagination">
                <button
                    class="pagination-btn"
                    disabled={currentPage === 1}
                    on:click={() => goToPage(currentPage - 1)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                {#each getPageNumbers() as page}
                    {#if page === "..."}
                        <span class="ellipsis">...</span>
                    {:else}
                        <button
                            class="page-btn"
                            class:active={currentPage === page}
                            on:click={() =>
                                typeof page === "number" && goToPage(page)}
                        >
                            {page}
                        </button>
                    {/if}
                {/each}

                <button
                    class="pagination-btn"
                    disabled={currentPage === totalPages}
                    on:click={() => goToPage(currentPage + 1)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        padding: 0 1rem;
        width: 100%;
        margin: 0;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: 1rem;
    }

    .loading-container p {
        color: #666;
        font-size: 0.9rem;
    }

    .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
    }

    .error-message {
        color: #dc3545;
        text-align: center;
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(220, 53, 69, 0.1);
        border-radius: 8px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem 0;
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
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

    .table-container {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 249, 250, 0.95) 100%
        );
        border-radius: 16px;
        box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        overflow: hidden;
        border: 1px solid rgba(206, 212, 218, 0.4);
        backdrop-filter: blur(10px);
        width: 100%;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
    }

    th {
        background: linear-gradient(
            135deg,
            rgba(248, 249, 250, 0.95) 0%,
            rgba(241, 243, 245, 0.95) 100%
        );
        color: #495057;
        font-weight: 600;
        padding: 1.25rem 1.5rem;
        text-align: left;
        font-size: 0.875rem;
        letter-spacing: 0.025em;
        border-bottom: 1px solid rgba(206, 212, 218, 0.4);
    }

    th:first-child {
        width: 70%;
    }

    th:last-child {
        width: 30%;
    }

    td {
        padding: 1rem 1.5rem;
        color: #495057;
        font-size: 0.9375rem;
        border-bottom: 1px solid rgba(206, 212, 218, 0.2);
        word-wrap: break-word;
    }

    .evaluation-row {
        transition: all 0.2s ease;
    }

    .evaluation-row:hover {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(248, 249, 250, 0.8) 100%
        );
    }

    .student-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
    }

    .student-info span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
    }

    .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .text-right {
        text-align: right;
    }

    .grade {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3rem;
        height: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        padding: 0 0.75rem;
        border-radius: 8px;
        box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .evaluate-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow:
            0 4px 12px rgba(40, 167, 69, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .evaluate-btn:hover {
        background: linear-gradient(135deg, #218838 0%, #1abc9c 100%);
        transform: translateY(-1px);
        box-shadow:
            0 6px 16px rgba(40, 167, 69, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    .evaluate-btn:active {
        transform: translateY(0);
        box-shadow:
            0 2px 8px rgba(40, 167, 69, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .checkbox-wrapper {
        position: relative;
        display: inline-block;
        width: 20px;
        height: 20px;
    }

    input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(248, 249, 250, 0.9) 100%
        );
        border: 2px solid #ced4da;
        border-radius: 4px;
        transition: all 0.2s ease;
        cursor: not-allowed;
    }

    input[type="checkbox"]:checked + .checkmark {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: transparent;
    }

    input[type="checkbox"]:checked + .checkmark:after {
        content: "";
        position: absolute;
        left: 6px;
        top: 2px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }

    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding: 1rem 0;
    }

    .pagination-btn,
    .page-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
        padding: 0 0.5rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(248, 249, 250, 0.95) 100%
        );
        color: #495057;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .pagination-btn:hover:not(:disabled),
    .page-btn:hover:not(:disabled) {
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(248, 249, 250, 1) 100%
        );
        transform: translateY(-1px);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: transparent;
        box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .ellipsis {
        color: #6c757d;
        padding: 0 0.25rem;
    }

    /* Responsividade aprimorada */
    @media (max-width: 768px) {
        .container {
            padding: 0 0.75rem;
        }

        .header {
            margin-bottom: 1rem;
            padding: 0.75rem 0;
        }

        h1 {
            font-size: 1.5rem;
        }

        th,
        td {
            padding: 0.875rem 1rem;
        }

        th {
            font-size: 0.8125rem;
        }

        td {
            font-size: 0.875rem;
        }

        .student-info {
            gap: 0.75rem;
        }

        .avatar {
            width: 32px;
            height: 32px;
        }

        .pagination {
            gap: 0.25rem;
            margin-top: 1rem;
            padding: 0.75rem 0;
        }

        .pagination-btn,
        .page-btn {
            min-width: 32px;
            height: 32px;
        }

        .grade {
            min-width: 2.5rem;
            height: 1.75rem;
            font-size: 0.875rem;
        }

        .evaluate-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.8125rem;
            gap: 0.375rem;
        }

        .evaluate-btn svg {
            width: 14px;
            height: 14px;
        }
    }

    @media (max-width: 480px) {
        .container {
            padding: 0 0.5rem;
        }

        .header {
            margin-bottom: 0.75rem;
            padding: 0.5rem 0;
        }

        h1 {
            font-size: 1.25rem;
        }

        th,
        td {
            padding: 0.75rem 0.5rem;
            font-size: 0.8125rem;
        }

        .student-info {
            gap: 0.5rem;
        }

        .student-info span {
            font-size: 0.8125rem;
        }

        .avatar {
            width: 28px;
            height: 28px;
        }

        .pagination {
            margin-top: 0.75rem;
            padding: 0.5rem 0;
        }

        .pagination-btn,
        .page-btn {
            min-width: 28px;
            height: 28px;
            font-size: 0.8125rem;
        }

        .grade {
            min-width: 2rem;
            height: 1.5rem;
            font-size: 0.8125rem;
            padding: 0 0.5rem;
        }

        .evaluate-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            gap: 0.25rem;
        }

        .evaluate-btn svg {
            width: 12px;
            height: 12px;
        }

        .checkbox-wrapper {
            width: 18px;
            height: 18px;
        }

        .checkmark {
            width: 18px;
            height: 18px;
        }

        .close-btn {
            padding: 0.375rem;
        }
    }

    @media (max-width: 320px) {
        .container {
            padding: 0 0.25rem;
        }

        th,
        td {
            padding: 0.5rem 0.25rem;
        }

        .student-info span {
            font-size: 0.75rem;
        }

        .avatar {
            width: 24px;
            height: 24px;
        }
    }
</style>
