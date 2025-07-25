<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { currentUser } from "$lib/utils/auth";
    import type { ProblemaModel } from "$lib/interfaces/interfaces";
    import type { Column } from "$lib/interfaces/column";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Table from "$lib/components/Table.svelte";
    import Container from "$lib/components/Container.svelte";
    import FileUpload from "$lib/components/FileUpload.svelte";
    import Button from "$lib/components/Button.svelte";
    import { AvaliacoesService } from "$lib/services/avaliacoes_service";
    import { ProblemasService } from "$lib/services/problemas_service";
    import Pagination from "$lib/components/Pagination.svelte";
    import { MediaCalculator } from "$lib/utils/utils";
    import { api } from "$lib/utils/api";
    import BackButton from "$lib/components/BackButton.svelte";
    import { DateUtils } from "$lib/utils/utils";

    interface Avaliacao {
        id_avaliacao: number;
        aluno: {
            id: number;
            nome: string;
            avatar: string;
        };
        nota?: number;
        enviada: boolean;
        isCurrentUser?: boolean;
    }

    interface UploadedFile {
        id?: number;
        nome_arquivo: string;
        link_arquivo: string;
        id_aluno?: number;
        id_problema?: number;
        created_at?: string;
    }

    let avaliacoes: Avaliacao[] = [];
    let problema: ProblemaModel;
    let loading = true;
    let error: string | null = null;
    let tableRows: any[] = [];

    let currentPage = 1;
    const itemsPerPage = 10;
    $: totalPages = Math.ceil(avaliacoes.length / itemsPerPage);

    // File upload state - using maps keyed by nome_tipo for better organization
    let uploadedFilesByType: Map<string, File[]> = new Map();
    let existingFilesByType: Map<string, UploadedFile[]> = new Map();
    let isUploading = false;
    let uploadError: string | null = null;
    let uploadProgress = { current: 0, total: 0 };

    // Reactive statement to track file upload state
    $: allUploadedFilesCount = Array.from(uploadedFilesByType.values()).reduce(
        (total, files) => total + files.length,
        0,
    );
    $: canSave = allUploadedFilesCount > 0;
    $: console.log(
        "Reactive canSave:",
        canSave,
        "allUploadedFilesCount:",
        allUploadedFilesCount,
    );

    $: paginatedAvaliacoes = avaliacoes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // Transform data for Table component
    $: tableRows = paginatedAvaliacoes.map((avaliacao) => {
        return {
            id: avaliacao.id_avaliacao,
            user: {
                name: avaliacao.aluno.nome,
                role: "", // No role for students in this context
                avatar: avaliacao.aluno.avatar,
            },
            enviada: avaliacao.enviada,
            nota: avaliacao.nota,
            isCurrentUser: avaliacao.isCurrentUser,
            alunoId: avaliacao.aluno.id,
            // For actions column - handled by render function
            actions: "",
        };
    });

    // Helper to check if any tag is currently available
    function isAnyTagAvailable() {
        if (!problema) return false;
        return Object.keys(problema.criterios || {}).some((tag) =>
            DateUtils.isNowWithinTagDateRange(problema, tag),
        );
    }
    // Helper to get tag status array for display
    function getTagStatusArr() {
        if (!problema) return [];
        return DateUtils.getDateStartStatusArrayFromProblemaModel(problema);
    }

    // Table configuration
    let columns: Column[] = [
        {
            key: "user",
            label: "Aluno",
            width: "60%",
        },
        {
            key: "actions",
            label: "Avaliação enviada",
            width: "40%",
            render: (row: any) => {
                const canEvaluate = isAnyTagAvailable();
                if (row.enviada) {
                    // If already evaluated, show media and, if still available, show Avaliar button too
                    const result: any = [
                        {
                            component: "span",
                            props: {
                                text: row.nota?.toFixed(2) || "0.00",
                                class: "grade",
                            },
                        },
                    ];
                    if (canEvaluate) {
                        result.push({
                            component: "Button",
                            props: {
                                text: "Avaliar",
                                onClick: () => handleEvaluation(row.alunoId),
                                class: "avaliar-btn-spacing",
                            },
                        });
                    }
                    return result;
                } else if (canEvaluate) {
                    return {
                        component: "Button",
                        props: {
                            variant: "primary",
                            text: "Avaliar",
                            onClick: () => handleEvaluation(row.alunoId),
                        },
                    };
                } else {
                    // Not available, not evaluated
                    return {
                        component: "span",
                        props: {
                            text: "Fora do período",
                            class: "grade grade-disabled",
                        },
                    };
                }
            },
        },
    ];

    async function fetchAvaliacoes() {
        try {
            loading = true;
            error = null;
            const id_problema = parseInt($page.params.id_problema);

            // Get the problem details first using cache service
            problema = await ProblemasService.getById(id_problema.toString());

            // Get all evaluations using the service
            const avaliacoesData =
                await AvaliacoesService.getAvaliacoes(id_problema);

            // Filter evaluations where current user is the evaluator (aluno_avaliador)
            const currentUserId = $currentUser?.id;
            const filteredAvaliacoesData = avaliacoesData.filter(
                (avaliacao) => avaliacao.aluno_avaliador?.id === currentUserId,
            );

            // Transform the data to match our interface
            avaliacoes = filteredAvaliacoesData.map((avaliacao) => {
                const media = avaliacao.notas
                    ? MediaCalculator.calculateSimpleMedia(
                          JSON.stringify(avaliacao.notas),
                      )
                    : undefined;

                return {
                    id_avaliacao: avaliacao.id_avaliacao,
                    aluno: {
                        id: avaliacao.aluno_avaliado?.id || 0,
                        nome: avaliacao.aluno_avaliado?.nome_completo || "",
                        avatar:
                            avaliacao.aluno_avaliado?.link_avatar ||
                            "/avatars/default.png",
                    },
                    nota: media,
                    enviada: true,
                    isCurrentUser: false,
                };
            });

            // Add students without evaluations (only for current user's evaluations)
            if (problema.turma?.alunos) {
                const avaliacoesMap = new Map(
                    avaliacoes.map((av) => [av.aluno.id, av]),
                );

                // Only add students that the current user hasn't evaluated yet
                // Exclude the current user since self-evaluation is not allowed
                problema.turma.alunos.forEach((aluno) => {
                    if (
                        !avaliacoesMap.has(aluno.id) &&
                        aluno.id !== currentUserId
                    ) {
                        avaliacoes.push({
                            id_avaliacao: 0,
                            aluno: {
                                id: aluno.id,
                                nome: aluno.nome_completo || "",
                                avatar:
                                    aluno.link_avatar || "/avatars/default.png",
                            },
                            enviada: false,
                            isCurrentUser: false,
                        });
                    }
                });
            }
        } catch (e: any) {
            console.error("Error in fetchAvaliacoes:", e);
            error = e.message || "Erro ao carregar avaliações";
        } finally {
            loading = false;
        }
    }

    function handleEvaluation(alunoId: number) {
        const id_problema = $page.params.id_problema;
        // Navigate to unified evaluation page for peer evaluation
        goto(
            `/avaliacao?id_problema=${id_problema}&id_aluno_avaliador=${$currentUser?.id}&id_aluno_avaliado=${alunoId}`,
        );
    }

    function handleFilesSelected(event: CustomEvent, definicao: any) {
        const files = event.detail.files as File[];
        const nomeType = definicao.nome_tipo || "";

        const currentFiles = uploadedFilesByType.get(nomeType) || [];
        uploadedFilesByType.set(nomeType, [...currentFiles, ...files]);
        uploadedFilesByType = uploadedFilesByType; // Trigger reactivity

        console.log(`Files selected for tipo ${nomeType}:`, files);
        console.log("Current uploadedFilesByType:", uploadedFilesByType);
        console.log("hasFilesToUpload:", hasFilesToUpload());
    }

    function handleFileRemoved(event: CustomEvent, definicao: any) {
        const remainingFiles = event.detail.files as File[];
        const nomeType = definicao.nome_tipo || "";

        uploadedFilesByType.set(nomeType, remainingFiles);
        uploadedFilesByType = uploadedFilesByType; // Trigger reactivity

        console.log(`File removed for tipo ${nomeType}:`, remainingFiles);
        console.log("Current uploadedFilesByType:", uploadedFilesByType);
        console.log("hasFilesToUpload:", hasFilesToUpload());
    }

    async function loadExistingFiles() {
        try {
            const id_problema = parseInt($page.params.id_problema);
            const currentUserId = $currentUser?.id;

            if (!currentUserId) return;

            const files: UploadedFile[] = await api.get(
                `/problemas/get-arquivos?id_aluno=${currentUserId}&id_problema=${id_problema}`,
            );

            // Group files by nome_tipo
            existingFilesByType.clear();
            files.forEach((file) => {
                const nomeType = (file as any).nome_tipo || "default";
                const currentFiles = existingFilesByType.get(nomeType) || [];
                existingFilesByType.set(nomeType, [...currentFiles, file]);
            });
            existingFilesByType = existingFilesByType;

            console.log("Loaded existing files:", files);
            console.log("Grouped by type:", existingFilesByType);
        } catch (e: any) {
            console.error("Error loading existing files:", e);
        }
    }

    async function uploadFiles() {
        try {
            console.log("Uploading files");
            isUploading = true;
            uploadError = null;

            const id_problema = parseInt($page.params.id_problema);
            const currentUserId = $currentUser?.id;

            if (!currentUserId) {
                console.log("User not authenticated");
                throw new Error("User not authenticated");
            }

            // Count total files to upload
            const totalFiles = Array.from(uploadedFilesByType.values()).reduce(
                (total, files) => total + files.length,
                0,
            );
            uploadProgress = { current: 0, total: totalFiles };

            let currentFileIndex = 0;

            // Upload all selected files by type
            for (const [nomeType, files] of uploadedFilesByType.entries()) {
                for (const file of files) {
                    currentFileIndex++;
                    uploadProgress.current = currentFileIndex;
                    uploadProgress = uploadProgress; // Trigger reactivity

                    const formData = new FormData();
                    formData.append("arquivo", file);
                    formData.append("id_aluno", currentUserId.toString());
                    formData.append("id_problema", id_problema.toString());
                    formData.append("nome_tipo", nomeType);

                    console.log("Form data for tipo:", nomeType, formData);

                    const result = await api.post(
                        "/problemas/upload-arquivo",
                        formData,
                    );
                    console.log("File uploaded successfully:", result);
                }
            }

            // Clear uploaded files and reload existing files
            uploadedFilesByType.clear();
            uploadedFilesByType = uploadedFilesByType;
            uploadProgress = { current: 0, total: 0 };

            await loadExistingFiles();

            console.log("All files uploaded successfully");
        } catch (e: any) {
            console.error("Error uploading files:", e);
            uploadError = e.message;
            uploadProgress = { current: 0, total: 0 };
        } finally {
            isUploading = false;
        }
    }

    function hasFilesToUpload(): boolean {
        return Array.from(uploadedFilesByType.values()).some(
            (files) => files.length > 0,
        );
    }

    onMount(async () => {
        await fetchAvaliacoes();
        await loadExistingFiles();
    });
</script>

<div class="evaluations-container">
    {#if loading && !problema}
        <div class="loading-container">
            <LoadingSpinner size="lg" />
            <p>Carregando avaliações...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p class="error-message">{error}</p>
        </div>
    {:else}
        <BackButton text="Voltar" on:click={() => history.back()} />
        <div class="header" in:fade={{ duration: 300, delay: 50 }}>
            <h1>
                Avaliações - {problema?.nome_problema || "Carregando..."}
            </h1>
        </div>
        <!-- Show available date ranges for each tag -->
        {#if problema}
            <div class="tag-dates">
                <h3>Períodos de Avaliação:</h3>
                <div class="tag-dates-list">
                    {#each getTagStatusArr() as { tag, date, isActive }}
                        <span
                            class="tag-status {isActive
                                ? 'tag-green'
                                : 'tag-red'}">{tag}: {date}</span
                        >
                    {/each}
                </div>
            </div>
        {/if}
        <div class="table-wrapper" in:fade={{ duration: 400, delay: 200 }}>
            <Table
                {columns}
                rows={tableRows}
                enableSelection={false}
                {loading}
            />
        </div>

        {#if !loading && totalPages > 1}
            <div in:fade={{ duration: 300, delay: 350 }}>
                <Pagination
                    {currentPage}
                    {totalPages}
                    on:pageChange={(e) => (currentPage = e.detail.page)}
                />
            </div>
        {/if}

        <!-- File Upload Sections -->
        {#if !loading && problema?.definicao_arquivos_de_avaliacao && problema.definicao_arquivos_de_avaliacao.length > 0}
            <div
                class="file-upload-section"
                in:fade={{ duration: 400, delay: 400 }}
            >
                <h2>Envio de Arquivos</h2>
                <p class="upload-description">
                    Envie os arquivos solicitados para este problema conforme as
                    especificações abaixo:
                </p>

                <!-- Upload Loading Overlay -->
                {#if isUploading}
                    <div
                        class="upload-loading-overlay"
                        in:fade={{ duration: 200 }}
                    >
                        <div class="upload-loading-content">
                            <LoadingSpinner size="lg" />
                            <p>Enviando arquivos...</p>
                            <p class="upload-progress">
                                {uploadProgress.current} de {uploadProgress.total}
                                arquivos
                            </p>
                        </div>
                    </div>
                {/if}

                <div class="upload-forms" class:uploading={isUploading}>
                    {#each problema.definicao_arquivos_de_avaliacao as definicao, index}
                        {@const existingFilesForType =
                            existingFilesByType.get(
                                definicao.nome_tipo || "",
                            ) || []}
                        {@const nomeTipo = definicao.nome_tipo || ""}
                        {@const isWithinRange =
                            DateUtils.isNowWithinTagDateRange(
                                problema,
                                nomeTipo,
                            )}
                        <div
                            class="upload-container"
                            in:fade={{
                                duration: 300,
                                delay: 450 + index * 100,
                            }}
                        >
                            <FileUpload
                                accept={definicao.tipos_de_arquivos_aceitos?.join(
                                    ",",
                                ) || "*"}
                                multiple={true}
                                maxSize={10 * 1024 * 1024}
                                label={definicao.nome_tipo ||
                                    `Tipo de Arquivo ${index + 1}`}
                                description={definicao.descricao_tipo ||
                                    "Arraste e solte seus arquivos aqui ou clique para selecionar"}
                                supportedFormats={definicao.tipos_de_arquivos_aceitos
                                    ?.join(", ")
                                    .toUpperCase() || "Todos os formatos"}
                                disabled={isUploading || !isWithinRange}
                                on:filesSelected={(e) =>
                                    handleFilesSelected(e, definicao)}
                                on:fileRemoved={(e) =>
                                    handleFileRemoved(e, definicao)}
                            />

                            {#if !isWithinRange}
                                <div
                                    class="upload-error"
                                    style="margin-top: 0.5rem;"
                                >
                                    O envio deste arquivo só está disponível
                                    entre
                                    {#if problema.data_e_hora_criterios_e_arquivos[nomeTipo]?.data_e_hora_inicio}
                                        {new Date(
                                            problema.data_e_hora_criterios_e_arquivos[
                                                nomeTipo
                                            ].data_e_hora_inicio,
                                        ).toLocaleString()}
                                    {/if}
                                    e
                                    {#if problema.data_e_hora_criterios_e_arquivos[nomeTipo]?.data_e_hora_fim}
                                        {new Date(
                                            problema.data_e_hora_criterios_e_arquivos[
                                                nomeTipo
                                            ].data_e_hora_fim,
                                        ).toLocaleString()}
                                    {/if}
                                </div>
                            {/if}

                            <!-- Display existing files for this type -->
                            {#if existingFilesForType.length > 0}
                                <div class="existing-files">
                                    <h4>Arquivos já enviados:</h4>
                                    <div class="existing-files-list">
                                        {#each existingFilesForType as file}
                                            <div class="existing-file-item">
                                                <span class="file-name"
                                                    >{file.nome_arquivo}</span
                                                >
                                                <a
                                                    href={file.link_arquivo}
                                                    target="_blank"
                                                    class="download-link"
                                                >
                                                    Baixar
                                                </a>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}

                    <!-- Upload Error Message -->
                    {#if uploadError}
                        <div class="upload-error" in:fade={{ duration: 200 }}>
                            {uploadError}
                        </div>
                    {/if}

                    <!-- Save Button -->
                    <div
                        class="save-button-container"
                        in:fade={{ duration: 300 }}
                    >
                        <Button
                            variant="primary"
                            disabled={isUploading || !canSave}
                            on:click={uploadFiles}
                            fullWidth={false}
                        >
                            {#if isUploading}
                                <LoadingSpinner size="sm" />
                                Enviando...
                            {:else}
                                Salvar Arquivos
                            {/if}
                        </Button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .evaluations-container {
        position: relative;
        min-height: 100%;
        height: fit-content;
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
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: #666;
        cursor: pointer;
        padding: 0.75rem;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        transform: translateY(-2px) scale(1.05);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    /* Estilo para o badge de nota */
    :global(.grade) {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        border-radius: 12px;
        font-size: 0.9rem;
        box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
    }

    :global(.grade:hover) {
        transform: translateY(-2px);
        box-shadow:
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    /* File Upload Section Styles */
    .file-upload-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(226, 232, 240, 0.3);
        position: relative;
    }

    .upload-forms {
        transition: opacity 0.3s ease;
    }

    .upload-forms.uploading {
        opacity: 0.6;
        pointer-events: none;
    }

    .file-upload-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
    }

    .upload-description {
        color: #718096;
        font-size: 0.95rem;
        margin-bottom: 2rem;
        line-height: 1.5;
    }

    .upload-container {
        margin-bottom: 2rem;
    }

    .upload-container:last-child {
        margin-bottom: 0;
    }

    /* Existing Files Styles */
    .existing-files {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px dashed rgba(226, 232, 240, 0.5);
    }

    .existing-files h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 0.75rem;
    }

    .existing-files-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .existing-file-item {
        display: flex;
        align-items: center;
        background: #f8f9fa;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        gap: 0.75rem;
        font-size: 0.875rem;
        color: #4a5568;
    }

    .file-name {
        flex-grow: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .download-link {
        color: #4299e1;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s ease;
    }

    .download-link:hover {
        color: #3182ce;
    }

    /* Upload Error Message Styles */
    .upload-error {
        color: #dc3545;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-top: 1.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        text-align: center;
    }

    /* Save Button Container Styles */
    .save-button-container {
        margin-top: 2rem;
        text-align: center;
    }

    /* Upload Loading Overlay Styles */
    .upload-loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(5px);
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .upload-loading-content {
        text-align: center;
        color: #333;
    }

    .upload-loading-content p {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: #666;
    }

    .upload-progress {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.25rem;
    }

    /* Responsividade aprimorada */
    @media (max-width: 768px) {
        .header {
            margin-bottom: 1rem;
            padding: 0.75rem 0;
        }

        h1 {
            font-size: 1.5rem;
        }

        .file-upload-section {
            margin-top: 2rem;
            padding-top: 1.5rem;
        }

        .file-upload-section h2 {
            font-size: 1.25rem;
        }

        .upload-description {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }

        .upload-container {
            margin-bottom: 1.5rem;
        }

        .existing-files {
            margin-top: 1.5rem;
            padding-top: 1rem;
        }

        .existing-files h4 {
            font-size: 1rem;
        }

        .existing-files-list {
            gap: 0.5rem;
        }

        .existing-file-item {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
        }

        .file-name {
            font-size: 0.8rem;
        }

        .download-link {
            font-size: 0.8rem;
        }

        .upload-error {
            margin-top: 1rem;
            padding: 0.6rem 0.8rem;
            font-size: 0.8rem;
        }

        .save-button-container {
            margin-top: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .header {
            margin-bottom: 0.75rem;
            padding: 0.5rem 0;
        }

        h1 {
            font-size: 1.25rem;
        }

        .close-btn {
            padding: 0.375rem;
        }

        .file-upload-section {
            margin-top: 1.5rem;
            padding-top: 1rem;
        }

        .file-upload-section h2 {
            font-size: 1.125rem;
        }

        .upload-description {
            font-size: 0.85rem;
            margin-bottom: 1rem;
        }

        .upload-container {
            margin-bottom: 1rem;
        }

        .existing-files {
            margin-top: 1rem;
            padding-top: 0.75rem;
        }

        .existing-files h4 {
            font-size: 0.9rem;
        }

        .existing-files-list {
            gap: 0.4rem;
        }

        .existing-file-item {
            padding: 0.3rem 0.7rem;
            font-size: 0.7rem;
        }

        .file-name {
            font-size: 0.7rem;
        }

        .download-link {
            font-size: 0.7rem;
        }

        .upload-error {
            margin-top: 0.75rem;
            padding: 0.5rem 0.7rem;
            font-size: 0.7rem;
        }

        .save-button-container {
            margin-top: 1rem;
        }
    }

    .tag-dates {
        margin-bottom: 1.5rem;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
    }
    .tag-dates-list {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 0.5rem;
    }
    .tag-status {
        padding: 0.4rem 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #fff;
        transition: background 0.2s;
    }
    .tag-green {
        background: var(--color-nature-main);
        border-color: var(--color-nature-main);
    }
    .tag-red {
        background: var(--color-error-main);
        border-color: var(--color-error-main);
    }
    .avaliacao-actions-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .grade-disabled {
        opacity: 0.5;
        background: #e2e8f0;
        color: #888;
    }
</style>
