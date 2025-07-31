<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { api } from "$lib/utils/api";
    import { logger } from "$lib/utils/logger";
    import { goto } from "$app/navigation";
    import { currentUser } from "$lib/utils/auth";
    import type {
        ProblemaModel,
        AlunoModel,
        TurmaModel,
        AvaliacaoModel,
    } from "$lib/interfaces/interfaces";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import { DateUtils, MediaCalculator, Utils } from "$lib/utils/utils";
    import Button from "$lib/components/Button.svelte";
    import { ProblemasService } from "$lib/services/problemas_service";
    import { AlunosService } from "$lib/services/alunos_service";
    import { TurmasService } from "$lib/services/turmas_service";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import Pagination from "$lib/components/Pagination.svelte";

    interface UploadedFile {
        id?: number;
        nome_arquivo: string;
        link_arquivo: string;
        id_aluno?: number;
        id_problema?: number;
        created_at?: string;
        nome_tipo?: string;
    }

    let problema: ProblemaModel | null = null;
    let aluno: AlunoModel | null = null;
    let turma: TurmaModel | null = null;
    let avaliacoesEnviadas: any[] = [];
    let avaliacoesRecebidas: any[] = [];
    let loading = true;
    let error: string | null = null;
    let avaliacaoProfessor: AvaliacaoModel | null = null;

    // Variáveis para uploads do aluno
    let uploadedFiles: UploadedFile[] = [];
    let loadingFiles = false;
    let filesError: string | null = null;

    // Paginação para avaliações enviadas
    let currentPageEnviadas = 1;
    let itemsPerPage = 10;

    // Paginação para avaliações recebidas
    let currentPageRecebidas = 1;

    let criteriosList: { nome_criterio: string; descricao_criterio: string }[] =
        [];

    $: if (problema && problema.criterios) {
        const criteriosMap = new Map<string, string>();
        Object.values(problema.criterios).forEach((criteriosArr) => {
            criteriosArr.forEach((criterio) => {
                if (!criteriosMap.has(criterio.nome_criterio)) {
                    criteriosMap.set(
                        criterio.nome_criterio,
                        criterio.descricao_criterio,
                    );
                }
            });
        });
        criteriosList = Array.from(criteriosMap.entries()).map(
            ([nome_criterio, descricao_criterio]) => ({
                nome_criterio,
                descricao_criterio,
            }),
        );
    }

    // Configuração da tabela para avaliações enviadas
    $: columnsEnviadas = [
        {
            key: "aluno",
            label: "Aluno",
            width: "25%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="${row.aluno_avatar}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                            <span>${row.aluno}</span>
                        </div>
                    `,
                },
            }),
        },
        {
            key: "notas",
            label: "Detalhamento das Notas",
            width: "55%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="font-size: 0.85rem; line-height: 1.4;">
                            ${formatNotasDetailed(row.raw_notas)}
                        </div>
                    `,
                },
            }),
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="${row.enviada_para_avatar}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                            <span>${row.enviada_para}</span>
                        </div>
                    `,
                },
            }),
        },
    ];

    // Configuração da tabela para avaliações recebidas
    $: columnsRecebidas = [
        {
            key: "aluno",
            label: "Aluno",
            width: "25%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="${row.aluno_avatar}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                            <span>${row.aluno}</span>
                        </div>
                    `,
                },
            }),
        },
        {
            key: "notas",
            label: "Detalhamento das Notas",
            width: "55%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="font-size: 0.85rem; line-height: 1.4;">
                            ${formatNotasDetailed(row.raw_notas)}
                        </div>
                    `,
                },
            }),
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
            render: (row: any) => ({
                component: "html",
                props: {
                    html: `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <img src="${row.enviada_para_avatar}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                            <span>${row.enviada_para}</span>
                        </div>
                    `,
                },
            }),
        },
    ];

    async function loadAlunoFiles() {
        try {
            loadingFiles = true;
            filesError = null;

            const { id_problema, id_aluno } = $page.params;

            const files: UploadedFile[] = await api.get(
                `/problemas/get-arquivos?id_aluno=${id_aluno}&id_problema=${id_problema}`,
            );

            uploadedFiles = files;

            logger.info(`Loaded ${files.length} files for aluno ${id_aluno}`);
        } catch (e: any) {
            logger.error("Error loading aluno files:", e);
            filesError = e.message || "Erro ao carregar arquivos do aluno";
        } finally {
            loadingFiles = false;
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    async function loadAlunoDetails(forceRefresh = false) {
        try {
            loading = true;
            error = null;

            const { id_problema, id_aluno, id } = $page.params;
            logger.info(
                `Loading aluno details for id_aluno: ${id_aluno}, problema: ${id_problema}, turma: ${id}`,
            );

            // Add a timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timeout")), 10000);
            });

            const fetchPromise = Promise.all([
                ProblemasService.getById(id_problema, forceRefresh),
                AlunosService.getById(id_aluno, forceRefresh),
                TurmasService.getById(id, forceRefresh),
                AvaliacoesService.getByProblema(id_problema, forceRefresh),
            ]);

            const [problemaData, alunoData, turmaData, avaliacoesData] =
                (await Promise.race([fetchPromise, timeoutPromise])) as [
                    any,
                    any,
                    any,
                    any,
                ];

            problema = problemaData;
            aluno = alunoData;
            turma = turmaData;

            // Processar avaliações enviadas pelo aluno
            const currentAlunoId = Number($page.params.id_aluno);
            avaliacoesEnviadas = avaliacoesData
                .filter((av: any) => av.aluno_avaliador?.id === currentAlunoId)
                .map((av: any) => {
                    const alunoAvaliado = turma?.alunos?.find(
                        (a: any) => a.id === av.aluno_avaliado?.id,
                    );
                    return {
                        id: av.id,
                        aluno: aluno?.nome_completo || "Aluno",
                        aluno_avatar:
                            aluno?.link_avatar || "/images/default_avatar.png",
                        notas: formatNotas(av.notas),
                        raw_notas: av.notas,
                        enviada_para:
                            alunoAvaliado?.nome_completo ||
                            "Aluno não encontrado",
                        enviada_para_avatar:
                            alunoAvaliado?.link_avatar ||
                            "/images/default_avatar.png",
                    };
                });

            // Processar avaliações recebidas pelo aluno
            avaliacoesRecebidas = avaliacoesData
                .filter(
                    (av: any) =>
                        av.aluno_avaliado?.id === currentAlunoId &&
                        !av.id_professor,
                )
                .map((av: any) => {
                    const alunoAvaliador = turma?.alunos?.find(
                        (a: any) => a.id === av.aluno_avaliador?.id,
                    );
                    return {
                        id: av.id,
                        aluno: alunoAvaliador?.nome_completo || "Aluno",
                        aluno_avatar:
                            alunoAvaliador?.link_avatar ||
                            "/images/default_avatar.png",
                        notas: formatNotas(av.notas),
                        raw_notas: av.notas,
                        enviada_para: aluno?.nome_completo || "Aluno",
                        enviada_para_avatar:
                            aluno?.link_avatar || "/images/default_avatar.png",
                    };
                });

            // Avaliação do professor
            avaliacaoProfessor = avaliacoesData.find(
                (av: any) =>
                    av.aluno_avaliado.id === currentAlunoId && av.id_professor,
            );

            // Carregar arquivos do aluno
            await loadAlunoFiles();
        } catch (e: any) {
            logger.error("Error loading aluno details:", e);
            error = e.message || "Erro ao carregar os dados";
            // Ensure loading is set to false on error
            loading = false;
            // Clear cache on error to prevent stuck loading state
            if (e.message === "Request timeout") {
                // Invalidate relevant caches
                AvaliacoesService.invalidateCache();
            }
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadAlunoDetails();
    });

    // Refresh data when the page becomes visible (simple approach)
    $: if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
    ) {
        // Only refresh if we're on the aluno page and not already loading
        if (
            $page.url.pathname.includes("/professor/turmas/") &&
            $page.url.pathname.includes("/problemas/") &&
            $page.url.pathname.includes("/[id_aluno]") &&
            !loading
        ) {
            loadAlunoDetails(true);
        }
    }

    // Simple refresh when navigating back to this page
    $: if (
        $page.url.pathname.includes("/professor/turmas/") &&
        $page.url.pathname.includes("/problemas/") &&
        $page.url.pathname.includes("/[id_aluno]") &&
        !loading &&
        (!avaliacaoProfessor || avaliacoesEnviadas.length === 0)
    ) {
        // Only refresh if we're on the aluno page, not loading, and have no data
        loadAlunoDetails(true);
    }

    function formatNotas(notas: string | object | null) {
        if (!notas) return "Não avaliado";

        const criteriosHardcoded = [
            { nome_criterio: "conhecimento" },
            { nome_criterio: "habilidades" },
            { nome_criterio: "atitudes" },
        ];

        // If notas is an object, stringify it for compatibility
        const notasString =
            typeof notas === "string" ? notas : JSON.stringify(notas);

        const medias = MediaCalculator.calcularMediaPorCriterioSingle(
            notasString,
            criteriosHardcoded,
        );

        if (!medias) return "Erro ao processar notas";

        const competencia = medias.conhecimento || 0;
        const habilidade = medias.habilidades || 0;
        const atitude = medias.atitudes || 0;

        return `(${competencia.toFixed(2)}, ${habilidade.toFixed(2)}, ${atitude.toFixed(2)})`;
    }

    function formatNotasDetailed(notas: string | object | null) {
        if (!notas) return "Não avaliado";

        try {
            const notasObj =
                typeof notas === "string" ? JSON.parse(notas) : notas;

            if (!notasObj || typeof notasObj !== "object") {
                return "Erro ao processar notas";
            }

            let result = "";
            const criterios = ["conhecimento", "habilidades", "atitudes"];

            Object.entries(notasObj).forEach(
                ([tagName, categoria]: [string, any], tagIndex) => {
                    if (typeof categoria === "object" && categoria !== null) {
                        if (tagIndex > 0) result += "<br>";
                        result += `<strong>${tagName}:</strong><br>`;

                        criterios.forEach((criterio, criterioIndex) => {
                            const valor = categoria[criterio];
                            if (typeof valor === "number") {
                                result += `<span style="color: #6b7280; font-weight: 500;">${criterio}: ${valor.toFixed(2)}</span>`;
                                if (criterioIndex < criterios.length - 1)
                                    result += " | ";
                            }
                        });
                    }
                },
            );

            return result || "Nenhuma nota encontrada";
        } catch (error) {
            console.error("Error parsing notas:", error);
            return "Erro ao processar notas";
        }
    }

    function calculateProfessorTotalNota(
        avaliacaoProfessor: AvaliacaoModel | null,
    ): string {
        if (!avaliacaoProfessor) return "Não avaliado";

        try {
            // Calculate criterios sum
            let criteriosSum = 0;
            if (avaliacaoProfessor.notas) {
                Object.entries(avaliacaoProfessor.notas).forEach(
                    ([key, val]) => {
                        if (
                            key === "media" ||
                            typeof val !== "object" ||
                            val === null
                        )
                            return;
                        Object.values(val).forEach((num) => {
                            if (typeof num === "number" && !isNaN(num)) {
                                criteriosSum += num;
                            }
                        });
                    },
                );
            }

            // Calculate arquivos sum
            let arquivosSum = 0;
            if (avaliacaoProfessor.notas_por_arquivo) {
                const fileGrades =
                    typeof avaliacaoProfessor.notas_por_arquivo === "string"
                        ? JSON.parse(avaliacaoProfessor.notas_por_arquivo)
                        : avaliacaoProfessor.notas_por_arquivo;

                Object.values(fileGrades).forEach((grade) => {
                    if (typeof grade === "number" && !isNaN(grade)) {
                        arquivosSum += grade;
                    }
                });
            }

            // Total sum
            const totalSum = criteriosSum + arquivosSum;
            return `${totalSum.toFixed(2)} (Criterios: ${criteriosSum.toFixed(2)} + Arquivos: ${arquivosSum.toFixed(2)})`;
        } catch (error) {
            console.error("Error calculating professor total nota:", error);
            return "Erro ao calcular nota";
        }
    }

    function formatArquivosDetailed(notas_por_arquivo: string | object | null) {
        if (!notas_por_arquivo) return "Não avaliado";

        try {
            const arquivosObj =
                typeof notas_por_arquivo === "string"
                    ? JSON.parse(notas_por_arquivo)
                    : notas_por_arquivo;

            if (!arquivosObj || typeof arquivosObj !== "object") {
                return "Erro ao processar notas dos arquivos";
            }

            let result = "";

            Object.entries(arquivosObj).forEach(([fileType, grade], index) => {
                if (typeof grade === "number") {
                    if (index > 0) result += "<br>";
                    result += `<span style="color: #6b7280; font-weight: 500;">${fileType}: ${grade.toFixed(2)}</span>`;
                }
            });

            return result || "Nenhuma nota de arquivo encontrada";
        } catch (error) {
            console.error("Error parsing arquivos notas:", error);
            return "Erro ao processar notas dos arquivos";
        }
    }

    function handleAvaliarAluno() {
        const { id_problema, id_aluno, id } = $page.params;
        const currentUserId = $currentUser?.id;

        if (!currentUserId) {
            console.error("Usuário não autenticado");
            return;
        }

        // Redirecionar para a página de avaliação com parâmetros para avaliação de professor
        goto(
            `/avaliacao?id_problema=${id_problema}&id_professor=${currentUserId}&id_aluno_avaliado=${id_aluno}`,
        );
    }

    // Paginação para avaliações enviadas
    $: totalPagesEnviadas = Math.ceil(avaliacoesEnviadas.length / itemsPerPage);
    $: paginatedAvaliacoesEnviadas = avaliacoesEnviadas.slice(
        (currentPageEnviadas - 1) * itemsPerPage,
        currentPageEnviadas * itemsPerPage,
    );

    // Paginação para avaliações recebidas
    $: totalPagesRecebidas = Math.ceil(
        avaliacoesRecebidas.length / itemsPerPage,
    );
    $: paginatedAvaliacoesRecebidas = avaliacoesRecebidas.slice(
        (currentPageRecebidas - 1) * itemsPerPage,
        currentPageRecebidas * itemsPerPage,
    );
</script>

{#if loading}
    <div class="loading-container">
        <div class="loading-spinner" />
    </div>
{:else if error}
    <div class="error-alert" role="alert">
        <strong>Erro!</strong>
        <span>{error}</span>
    </div>
{:else}
    <div class="content-wrapper">
        <BackButton text="Voltar" on:click={() => history.back()} />

        <div class="page-title">
            <h1>Avaliações do Aluno</h1>
        </div>

        <div class="problema-header">
            <h3 class="problema-subtitle">
                {problema?.nome_problema || ""}
            </h3>
        </div>

        <div class="aluno-info">
            <div class="aluno-profile">
                <Avatar
                    src={aluno?.link_avatar || "/images/default_avatar.png"}
                    alt={`Avatar de ${aluno?.nome_completo || "Aluno"}`}
                    size="md"
                />
                <span class="aluno-name">{aluno?.nome_completo || ""}</span>
            </div>
        </div>

        <!-- Seção de Avaliações Enviadas -->
        <div class="avaliacoes-section">
            <h2>Avaliações Enviadas</h2>

            {#if paginatedAvaliacoesEnviadas.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">📤</div>
                    <h3>Nenhuma avaliação enviada</h3>
                    <p>Este aluno ainda não enviou nenhuma avaliação.</p>
                </div>
            {:else}
                <div class="table-wrapper">
                    <Table
                        columns={columnsEnviadas}
                        rows={paginatedAvaliacoesEnviadas}
                        enableSelection={false}
                    />
                </div>

                {#if totalPagesEnviadas > 1}
                    <div class="pagination-wrapper">
                        <Pagination
                            currentPage={currentPageEnviadas}
                            totalPages={totalPagesEnviadas}
                            on:pageChange={(e) =>
                                (currentPageEnviadas = e.detail.page)}
                        />
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Seção de Avaliações Recebidas -->
        <div class="avaliacoes-section">
            <h2>Avaliações Recebidas</h2>

            {#if paginatedAvaliacoesRecebidas.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">📥</div>
                    <h3>Nenhuma avaliação recebida</h3>
                    <p>Este aluno ainda não recebeu nenhuma avaliação.</p>
                </div>
            {:else}
                <div class="table-wrapper">
                    <Table
                        columns={columnsRecebidas}
                        rows={paginatedAvaliacoesRecebidas}
                        enableSelection={false}
                    />
                </div>

                {#if totalPagesRecebidas > 1}
                    <div class="pagination-wrapper">
                        <Pagination
                            currentPage={currentPageRecebidas}
                            totalPages={totalPagesRecebidas}
                            on:pageChange={(e) =>
                                (currentPageRecebidas = e.detail.page)}
                        />
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Seção de Avaliação pelo Professor -->
        {#if avaliacaoProfessor && turma?.professor}
            <div class="avaliacoes-section avaliacao-professor-section">
                <h2>Avaliação pelo Professor</h2>
                <div
                    class="professor-info"
                    style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;"
                >
                    <Avatar
                        src={turma.professor.link_avatar ||
                            "/images/default_avatar.png"}
                        alt={`Avatar de ${turma.professor.nome_completo || "Professor"}`}
                        size="md"
                    />
                    <span
                        class="professor-name"
                        style="font-weight: 600; color: #2d3748;"
                        >{turma.professor.nome_completo || "Professor"}</span
                    >
                </div>
                <div
                    class="professor-avaliacao-notas"
                    style="font-size: 1.1rem;"
                >
                    <strong>Nota Total:</strong>
                    {calculateProfessorTotalNota(avaliacaoProfessor)}
                </div>
                <div
                    class="professor-avaliacao-details"
                    style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem;"
                >
                    <strong>Detalhamento:</strong>
                    <div style="margin-top: 0.5rem; line-height: 1.5;">
                        <div style="margin-bottom: 1rem;">
                            <strong style="color: #374151;">Criterios:</strong>
                            <div style="margin-top: 0.25rem;">
                                {@html formatNotasDetailed(
                                    avaliacaoProfessor.notas,
                                )}
                            </div>
                        </div>
                        {#if avaliacaoProfessor.notas_por_arquivo}
                            <div>
                                <strong style="color: #374151;"
                                    >Arquivos:</strong
                                >
                                <div style="margin-top: 0.25rem;">
                                    {@html formatArquivosDetailed(
                                        avaliacaoProfessor.notas_por_arquivo,
                                    )}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
                <div
                    class="professor-avaliacao-data"
                    style="font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;"
                >
                    <span
                        >Enviada em: {Utils.formatDate(
                            avaliacaoProfessor.created_at,
                        )}</span
                    >
                </div>
            </div>
        {/if}

        <!-- Seção de Uploads do Aluno -->
        <div class="uploads-section">
            <h2>Arquivos Enviados pelo Aluno</h2>

            {#if loadingFiles}
                <div class="loading-files">
                    <div class="loading-spinner" />
                    <p>Carregando arquivos...</p>
                </div>
            {:else if filesError}
                <div class="files-error">
                    <p>{filesError}</p>
                </div>
            {:else if uploadedFiles.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>Nenhum arquivo enviado</h3>
                    <p>
                        Este aluno ainda não enviou nenhum arquivo para este
                        problema.
                    </p>
                </div>
            {:else}
                <!-- Estatísticas dos uploads -->
                <div class="uploads-stats">
                    <div class="stat-card">
                        <div class="stat-number">{uploadedFiles.length}</div>
                        <div class="stat-label">Total de Arquivos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">
                            {uploadedFiles.length > 0
                                ? formatDate(uploadedFiles[0].created_at || "")
                                : "N/A"}
                        </div>
                        <div class="stat-label">Último Upload</div>
                    </div>
                </div>

                <!-- Lista de arquivos -->
                <div class="files-list">
                    {#each uploadedFiles as file}
                        <div class="file-item">
                            <div class="file-info">
                                <div class="file-icon">📄</div>
                                <div class="file-details">
                                    <div class="file-name">
                                        {file.nome_arquivo}
                                    </div>
                                    <div class="file-meta">
                                        <span class="file-type"
                                            >{file.nome_tipo ||
                                                "Sem tipo"}</span
                                        >
                                        <span class="file-date">
                                            {file.created_at
                                                ? formatDate(file.created_at)
                                                : "Data não disponível"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="file-actions">
                                <a
                                    href={file.link_arquivo}
                                    target="_blank"
                                    class="download-btn"
                                    title="Baixar arquivo"
                                >
                                    📥 Baixar
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Botão de Avaliar Aluno -->
        <div class="actions-section">
            <Button
                variant="primary"
                on:click={handleAvaliarAluno}
                class="avaliar-button"
            >
                Avaliar Aluno
            </Button>
        </div>
    </div>
{/if}

<style>
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .back-button-container :global(.back-btn) {
        padding-top: 2.5rem;
        padding-bottom: 2.5rem;
    }

    .page-title {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .page-title h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: #2d3748;
        letter-spacing: -0.025em;
    }

    .problema-header {
        text-align: left;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
    }

    .problema-subtitle {
        font-size: 1.125rem;
        font-weight: 500;
        margin: 0;
        color: #6b7280;
        letter-spacing: -0.025em;
    }

    .aluno-info {
        display: flex;
        justify-content: flex-start;
        margin-bottom: 1.5rem;
    }

    .aluno-profile {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .aluno-name {
        font-size: 1.125rem;
        color: #4a5568;
        font-weight: 600;
    }

    .avaliacoes-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
    }

    .avaliacoes-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: #2d3748;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    .table-wrapper {
        margin-bottom: 1rem;
    }

    .pagination-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6c757d;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #4a5568;
    }

    .empty-state p {
        margin: 0;
        font-size: 0.875rem;
    }

    .actions-section {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    .avaliar-button {
        min-width: 200px;
        height: 48px;
        font-size: 1rem;
        font-weight: 600;
    }

    /* Uploads Section Styles */
    .uploads-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
    }

    .uploads-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: #2d3748;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    .loading-files {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: #6c757d;
    }

    .loading-files p {
        margin-top: 0.5rem;
        font-size: 0.9rem;
    }

    .files-error {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        text-align: center;
    }

    /* Uploads Statistics */
    .uploads-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        font-size: 0.875rem;
        opacity: 0.9;
    }

    /* Files List */
    .files-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.75rem;
        transition: all 0.2s ease;
    }

    .file-item:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    .file-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }

    .file-icon {
        font-size: 1.25rem;
        color: #667eea;
    }

    .file-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .file-name {
        font-weight: 500;
        color: #2d3748;
        font-size: 0.9rem;
    }

    .file-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #6c757d;
    }

    .file-type {
        background: #e2e8f0;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-weight: 500;
    }

    .file-date {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .file-actions {
        display: flex;
        gap: 0.5rem;
    }

    .download-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: #667eea;
        color: white;
        text-decoration: none;
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .download-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 16rem;
    }

    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-alert {
        background-color: #fee2e2;
        border: 1px solid #ef4444;
        color: #b91c1c;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }

    .error-alert strong {
        font-weight: 700;
        margin-right: 0.5rem;
    }

    /* Detailed notas styling */
    .table-wrapper :global(.notas-detail) {
        font-size: 0.85rem;
        line-height: 1.4;
        color: #374151;
    }

    .table-wrapper :global(.notas-detail strong) {
        color: #1f2937;
        font-weight: 600;
    }

    .table-wrapper :global(.notas-detail span) {
        display: inline-block;
        margin-right: 0.5rem;
    }

    .professor-avaliacao-details {
        border-left: 4px solid #667eea;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .back-button-container {
            padding: 0.75rem 0;
            margin-bottom: 0.75rem;
        }

        .page-title h1 {
            font-size: 1.3rem;
        }

        .avaliacoes-section {
            padding: 1rem;
        }

        .avaliacoes-section h2 {
            font-size: 1.125rem;
        }

        .uploads-section {
            padding: 1rem;
        }

        .uploads-section h2 {
            font-size: 1.125rem;
        }

        .uploads-stats {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.75rem;
        }

        .stat-card {
            padding: 0.75rem;
        }

        .stat-number {
            font-size: 1.25rem;
        }

        .file-item {
            padding: 0.5rem;
        }

        .file-info {
            gap: 0.5rem;
        }

        .file-name {
            font-size: 0.85rem;
        }

        .download-btn {
            padding: 0.4rem 0.6rem;
            font-size: 0.75rem;
        }

        .empty-state {
            padding: 2rem 1rem;
        }

        .avaliar-button {
            min-width: 100%;
        }
    }

    @media (max-width: 480px) {
        .back-button-container {
            padding: 0.5rem 0;
            margin-bottom: 0.5rem;
        }

        .page-title h1 {
            font-size: 1.1rem;
        }

        .avaliacoes-section {
            padding: 0.75rem;
        }

        .uploads-section {
            padding: 0.75rem;
        }

        .uploads-stats {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .stat-card {
            padding: 0.5rem;
        }

        .stat-number {
            font-size: 1.125rem;
        }

        .file-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .file-actions {
            width: 100%;
            justify-content: flex-end;
        }

        .download-btn {
            width: 100%;
            justify-content: center;
        }

        .empty-state {
            padding: 1.5rem 0.5rem;
        }
    }
</style>
