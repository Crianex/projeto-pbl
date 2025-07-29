<script lang="ts">
    export let src: string;
    export let alt: string;
    export let size: "sm" | "md" | "lg" | "xl" = "md";
    export let editable = false;
    export let onUpload: ((file: File) => void) | undefined = undefined;
    export let onRemove: (() => void) | undefined = undefined;

    let fileInput: HTMLInputElement;

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0] && onUpload) {
            onUpload(input.files[0]);
        }
    }

    function handleUploadClick() {
        fileInput?.click();
    }

    function handleRemoveClick() {
        if (onRemove) {
            onRemove();
        }
    }
</script>

<div class="avatar-container {size}">
    <img
        {src}
        {alt}
        class="avatar"
        on:error={(e) => {
            console.log("Erro ao carregar avatar:", src);
            e.target.src = "/images/default_avatar.png";
        }}
    />

    {#if editable}
        <div class="avatar-actions">
            <button
                type="button"
                class="action-btn upload-btn"
                on:click={handleUploadClick}
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </button>
        </div>

        <input
            bind:this={fileInput}
            type="file"
            accept="image/*"
            on:change={handleFileChange}
            style="display: none;"
        />
    {/if}
</div>

<style>
    .avatar-container {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .avatar {
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06);
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        transition: all 0.3s ease;
    }

    /* Tamanhos */
    .sm .avatar {
        width: 40px;
        height: 40px;
    }

    .md .avatar {
        width: 80px;
        height: 80px;
    }

    .lg .avatar {
        width: 120px;
        height: 120px;
    }

    .xl .avatar {
        width: 160px;
        height: 160px;
    }

    .avatar-actions {
        position: absolute;
        bottom: -2.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: white;
        border: 1px solid rgba(206, 212, 218, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #495057;
        transition: all 0.2s ease;
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .upload-btn:hover {
        color: #667eea;
        border-color: #667eea;
    }

    .remove-btn:hover {
        color: #dc3545;
        border-color: #dc3545;
    }

    /* Ajustes para tamanhos maiores */
    .lg .action-btn,
    .xl .action-btn {
        width: 36px;
        height: 36px;
    }

    .lg .action-btn svg,
    .xl .action-btn svg {
        width: 18px;
        height: 18px;
    }

    @media (max-width: 768px) {
        .lg .avatar {
            width: 100px;
            height: 100px;
        }

        .xl .avatar {
            width: 120px;
            height: 120px;
        }

        .action-btn {
            width: 28px;
            height: 28px;
        }

        .lg .action-btn,
        .xl .action-btn {
            width: 32px;
            height: 32px;
        }

        .lg .action-btn svg,
        .xl .action-btn svg {
            width: 16px;
            height: 16px;
        }
    }

    @media (max-width: 480px) {
        .md .avatar {
            width: 70px;
            height: 70px;
        }

        .lg .avatar {
            width: 90px;
            height: 90px;
        }

        .xl .avatar {
            width: 100px;
            height: 100px;
        }

        .action-btn {
            width: 24px;
            height: 24px;
        }

        .lg .action-btn,
        .xl .action-btn {
            width: 28px;
            height: 28px;
        }

        .lg .action-btn svg,
        .xl .action-btn svg {
            width: 14px;
            height: 14px;
        }

        .avatar-actions {
            bottom: -2rem;
            gap: 0.375rem;
        }
    }
</style>
