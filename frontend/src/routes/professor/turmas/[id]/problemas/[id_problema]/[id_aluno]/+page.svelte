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
    } from "$lib/interfaces/interfaces";
    import Container from "$lib/components/Container.svelte";
    import Table from "$lib/components/Table.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import Avatar from "$lib/components/Avatar.svelte";
    import { MediaCalculator } from "$lib/utils/utils";
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
            width: "30%",
        },
        {
            key: "notas",
            label: "Notas (C/H/A)",
            width: "50%",
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
        },
    ];

    // Configuração da tabela para avaliações recebidas
    $: columnsRecebidas = [
        {
            key: "aluno",
            label: "Aluno",
            width: "30%",
        },
        {
            key: "notas",
            label: "Notas (C/H/A)",
            width: "50%",
        },
        {
            key: "enviada_para",
            label: "Enviada para",
            width: "20%",
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
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onMount(async () => {
        try {
            const { id_problema, id_aluno, id } = $page.params;
            logger.info(
                `Loading aluno details for id_aluno: ${id_aluno}, problema: ${id_problema}, turma: ${id}`,
            );

            const [problemaData, alunoData, turmaData, avaliacoesData] =
                await Promise.all([
                    ProblemasService.getById(id_problema),
                    AlunosService.getById(id_aluno),
                    TurmasService.getById(id),
                    AvaliacoesService.getByProblema(id_problema),
                ]);

            problema = problemaData;
            aluno = alunoData;
            turma = turmaData;

            // Processar avaliações enviadas pelo aluno
            const currentAlunoId = Number($page.params.id_aluno);
            avaliacoesEnviadas = avaliacoesData
                .filter((av: any) => av.id_aluno_avaliador === currentAlunoId)
                .map((av: any) => {
                    const alunoAvaliado = turma?.alunos?.find(
                        (a: any) => a.id === av.id_aluno_avaliado,
                    );
                    return {
                        id: av.id,
                        aluno: aluno?.nome_completo || "Aluno",
                        notas: formatNotas(av.notas),
                        enviada_para:
                            alunoAvaliado?.nome_completo ||
                            "Aluno não encontrado",
                    };
                });

            // Processar avaliações recebidas pelo aluno
            avaliacoesRecebidas = avaliacoesData
                .filter((av: any) => av.id_aluno_avaliado === currentAlunoId)
                .map((av: any) => {
                    const alunoAvaliador = turma?.alunos?.find(
                        (a: any) => a.id === av.id_aluno_avaliador,
                    );
                    return {
                        id: av.id,
                        aluno: alunoAvaliador?.nome_completo || "Aluno",
                        notas: formatNotas(av.notas),
                        enviada_para: aluno?.nome_completo || "Aluno",
                    };
                });

            // Carregar arquivos do aluno
            await loadAlunoFiles();
        } catch (e: any) {
            logger.error("Error loading aluno details:", e);
            error = e.message || "Erro ao carregar os dados";
        } finally {
            loading = false;
        }
    });

    function formatNotas(notas: string | null) {
        if (!notas) return "Não avaliado";

        const criteriosHardcoded = [
            { nome_criterio: "conhecimento" },
            { nome_criterio: "habilidades" },
            { nome_criterio: "atitudes" },
        ];

        const medias = MediaCalculator.calcularMediaPorCriterioSingle(
            notas,
            criteriosHardcoded,
        );

        if (!medias) return "Erro ao processar notas";

        const competencia = medias.conhecimento || 0;
        const habilidade = medias.habilidades || 0;
        const atitude = medias.atitudes || 0;

        return `(${competencia.toFixed(2)}, ${habilidade.toFixed(2)}, ${atitude.toFixed(2)})`;
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

<Container maxWidth="xl" glass={true} shadow={true}>
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
            <div class="back-button-container">
                <BackButton text="Voltar" on:click={() => history.back()} />
            </div>

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
                        src={aluno?.link_avatar || "/avatars/default.png"}
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
                        <p>Este aluno ainda não enviou nenhum arquivo para este problema.</p>
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
                                {uploadedFiles.length > 0 ? formatDate(uploadedFiles[0].created_at || '') : 'N/A'}
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
                                        <div class="file-name">{file.nome_arquivo}</div>
                                        <div class="file-meta">
                                            <span class="file-type">{file.nome_tipo || 'Sem tipo'}</span>
                                            <span class="file-date">
                                                {file.created_at ? formatDate(file.created_at) : 'Data não disponível'}
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
</Container>

<style>
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .back-button-container {
        padding: 0.5rem 0;
        padding-top: 2rem;
        margin-bottom: 1rem;
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
        font-size: 2rem;
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

    /* Responsive Design */
    @media (max-width: 768px) {
        .back-button-container {
            padding: 0.75rem 0;
            margin-bottom: 0.75rem;
        }

        .page-title h1 {
            font-size: 1.75rem;
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
            font-size: 1.5rem;
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
