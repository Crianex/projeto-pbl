<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";

    const dispatch = createEventDispatcher();

    export let accept = ".pdf,.png,.jpg,.jpeg";
    export let multiple = true;
    export let maxSize = 10 * 1024 * 1024; // 10MB
    export let label = "Importar Arquivos";
    export let description =
        "Arraste e solte seus arquivos aqui ou clique para selecionar";
    export let supportedFormats = "PDF, PNG, JPG, JPEG";
    export let disabled = false;
    export let error = "";
    export let reset = false;

    let fileInput: HTMLInputElement;
    let dragOver = false;
    let files: FileList | null = null;
    let uploadedFiles: File[] = [];

    // Watch for reset prop changes
    $: if (reset) {
        uploadedFiles = [];
        error = "";
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files) {
            processFiles(target.files);
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragOver = false;

        if (event.dataTransfer?.files && !disabled) {
            processFiles(event.dataTransfer.files);
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (!disabled) {
            dragOver = true;
        }
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
    }

    function processFiles(fileList: FileList) {
        error = "";
        const validFiles: File[] = [];
        const errors: string[] = [];

        Array.from(fileList).forEach((file) => {
            // Verificar tipo de arquivo
            const validTypes = [
                "application/pdf",
                "image/png",
                "image/jpeg",
                "image/jpg",
            ];
            if (!validTypes.includes(file.type)) {
                errors.push(`${file.name}: Tipo de arquivo não suportado`);
                return;
            }

            // Verificar tamanho
            if (file.size > maxSize) {
                errors.push(
                    `${file.name}: Arquivo muito grande (máx: ${formatFileSize(maxSize)})`,
                );
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            error = errors.join(", ");
        }

        if (validFiles.length > 0) {
            uploadedFiles = multiple
                ? [...uploadedFiles, ...validFiles]
                : validFiles;
            dispatch("filesSelected", { files: validFiles });
        }
    }

    function removeFile(index: number) {
        uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
        dispatch("fileRemoved", { files: uploadedFiles });
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    function getFileIcon(file: File): string {
        if (file.type === "application/pdf") return "📄";
        if (file.type.startsWith("image/")) return "🖼️";
        return "📁";
    }

    function openFileDialog() {
        if (!disabled) {
            fileInput.click();
        }
    }
</script>

<div class="file-upload-container" class:disabled>
    <div class="upload-label">{label}</div>

    <div
        class="upload-zone"
        class:drag-over={dragOver}
        class:has-error={!!error}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:click={openFileDialog}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === "Enter" && openFileDialog()}
    >
        <input
            bind:this={fileInput}
            type="file"
            {accept}
            {multiple}
            {disabled}
            on:change={handleFileSelect}
            style="display: none;"
        />

        <div class="upload-icon" class:animated={dragOver}>
            <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M7 10L12 5L17 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="M12 5V19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </div>

        <div class="upload-text">
            <div class="primary-text">{description}</div>
            <div class="secondary-text">
                Formatos suportados: {supportedFormats}
            </div>
            <div class="size-text">
                Tamanho máximo: {formatFileSize(maxSize)}
            </div>
        </div>
    </div>

    {#if error}
        <div class="error-message" transition:fade={{ duration: 200 }}>
            {error}
        </div>
    {/if}

    {#if uploadedFiles.length > 0}
        <div class="uploaded-files" transition:fade={{ duration: 300 }}>
            <div class="files-header">
                Arquivos Selecionados ({uploadedFiles.length})
            </div>

            {#each uploadedFiles as file, index (file.name + file.size)}
                <div class="file-item" transition:scale={{ duration: 200 }}>
                    <div class="file-info">
                        <span class="file-icon">{getFileIcon(file)}</span>
                        <div class="file-details">
                            <span class="file-name">{file.name}</span>
                            <span class="file-size"
                                >{formatFileSize(file.size)}</span
                            >
                        </div>
                    </div>

                    <button
                        class="remove-button"
                        on:click|stopPropagation={() => removeFile(index)}
                        aria-label="Remover arquivo"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .file-upload-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .upload-label {
        font-weight: 600;
        font-size: 0.95rem;
        color: #4a5568;
        margin-bottom: 0.25rem;
        transition: color 0.2s ease;
    }

    .upload-zone {
        border: 2px dashed #e2e8f0;
        border-radius: 16px;
        padding: 3rem 2rem;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        min-height: 200px;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }

    .upload-zone:hover {
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.95);
        transform: translateY(-2px);
        box-shadow:
            0 15px 35px rgba(102, 126, 234, 0.08),
            0 8px 20px rgba(102, 126, 234, 0.06),
            0 3px 8px rgba(102, 126, 234, 0.04);
    }

    .upload-zone.drag-over {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
        transform: scale(1.02);
        box-shadow:
            0 25px 50px rgba(102, 126, 234, 0.12),
            0 15px 30px rgba(102, 126, 234, 0.08),
            0 8px 15px rgba(102, 126, 234, 0.06);
    }

    .upload-zone.has-error {
        border-color: #e53e3e;
        background: rgba(255, 245, 245, 0.8);
    }

    .upload-zone.has-error:hover {
        border-color: #e53e3e;
        box-shadow:
            0 15px 35px rgba(229, 62, 62, 0.08),
            0 8px 20px rgba(229, 62, 62, 0.06),
            0 3px 8px rgba(229, 62, 62, 0.04);
    }

    .upload-icon {
        color: #a0aec0;
        transition: all 0.3s ease;
    }

    .upload-icon.animated {
        color: #667eea;
        transform: scale(1.1);
    }

    .upload-zone:hover .upload-icon {
        color: #667eea;
        transform: translateY(-2px);
    }

    .upload-text {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .primary-text {
        font-size: 1.1rem;
        font-weight: 500;
        color: #4a5568;
        transition: color 0.2s ease;
    }

    .upload-zone:hover .primary-text {
        color: #667eea;
    }

    .secondary-text {
        font-size: 0.9rem;
        color: #718096;
    }

    .size-text {
        font-size: 0.8rem;
        color: #a0aec0;
    }

    .error-message {
        font-size: 0.875rem;
        color: #e53e3e;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 245, 245, 0.8);
        border: 1px solid rgba(229, 62, 62, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
    }

    .error-message::before {
        content: "⚠";
        font-size: 0.75rem;
    }

    .uploaded-files {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(15px);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.04),
            0 3px 8px rgba(0, 0, 0, 0.02);
    }

    .files-header {
        font-weight: 600;
        font-size: 0.9rem;
        color: #4a5568;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    }

    .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        border: 1px solid rgba(226, 232, 240, 0.3);
        transition: all 0.2s ease;
    }

    .file-item:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .file-item:last-child {
        margin-bottom: 0;
    }

    .file-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }

    .file-icon {
        font-size: 1.5rem;
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

    .file-size {
        font-size: 0.8rem;
        color: #718096;
    }

    .remove-button {
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 6px;
        color: #e53e3e;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-button:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.05);
    }

    .disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .upload-zone {
            padding: 2rem 1.5rem;
            min-height: 180px;
        }

        .upload-icon svg {
            width: 40px;
            height: 40px;
        }

        .primary-text {
            font-size: 1rem;
        }

        .secondary-text {
            font-size: 0.85rem;
        }

        .uploaded-files {
            padding: 1rem;
        }

        .file-item {
            padding: 0.5rem;
        }

        .file-icon {
            font-size: 1.25rem;
        }
    }

    @media (max-width: 480px) {
        .upload-zone {
            padding: 1.5rem 1rem;
            min-height: 160px;
        }

        .upload-icon svg {
            width: 32px;
            height: 32px;
        }

        .primary-text {
            font-size: 0.9rem;
        }

        .secondary-text {
            font-size: 0.8rem;
        }

        .size-text {
            font-size: 0.75rem;
        }

        .file-details {
            gap: 0.125rem;
        }

        .file-name {
            font-size: 0.85rem;
        }

        .file-size {
            font-size: 0.75rem;
        }
    }
</style>
