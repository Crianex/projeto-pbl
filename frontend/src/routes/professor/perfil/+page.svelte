<script lang="ts">
    import { goto } from "$app/navigation";
    import Container from "$lib/components/Container.svelte";
    import ProfileView from "$lib/components/ProfileView.svelte";
    import ProfileForm from "$lib/components/ProfileForm.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import { AvatarService } from "$lib/services/avatar_service";
    import { currentUser } from "$lib/utils/auth";
    import { get } from "svelte/store";
    import { ProfessoresService } from "$lib/services/professores_service";
    import type { ProfessorModel } from "$lib/interfaces/interfaces";

    let isEditing = false;
    let newAvatar: File | null = null;
    let avatarPreview: string | undefined;
    let loading = false;
    let showToast = false;
    let toastMessage = "";
    let toastType: "success" | "error" = "success";

    function handleEditClick() {
        isEditing = true;
    }

    function handleCancelEdit() {
        isEditing = false;
        // Reset avatar preview
        avatarPreview = get(currentUser)?.link_avatar || "";
        newAvatar = null;
    }

    function handleAvatarUpload(file: File) {
        newAvatar = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    function handleAvatarRemove() {
        newAvatar = null;
        avatarPreview = "/avatars/default.png";
    }

    async function handleSave() {
        loading = true;

        try {
            // Upload avatar se houver um novo
            if (newAvatar) {
                try {
                    const uploadResult =
                        await AvatarService.uploadProfessorAvatar(
                            get(currentUser)?.id || 0,
                            newAvatar,
                        );

                    // Atualizar o avatar com a URL retornada
                    $currentUser!.link_avatar = AvatarService.getAvatarUrl(
                        uploadResult.avatar_url,
                    );
                    avatarPreview = undefined;
                } catch (uploadError) {
                    console.error(
                        "Erro ao fazer upload do avatar:",
                        uploadError,
                    );
                    showErrorToast(
                        "Erro ao fazer upload do avatar. Tente novamente.",
                    );
                    return;
                }
            }

            // atualizar o perfil no banco de dados (will auto-invalidate caches)
            await ProfessoresService.update(get(currentUser) as ProfessorModel);

            isEditing = false;
            showSuccessToast("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            showErrorToast("Erro ao salvar perfil. Tente novamente.");
        } finally {
            loading = false;
        }
    }

    function showSuccessToast(message: string) {
        toastMessage = message;
        toastType = "success";
        showToast = true;

        setTimeout(() => {
            showToast = false;
        }, 3000);
    }

    function showErrorToast(message: string) {
        toastMessage = message;
        toastType = "error";
        showToast = true;

        setTimeout(() => {
            showToast = false;
        }, 3000);
    }
</script>

<Container>
    <div>
        {#if !isEditing}
            <ProfileView onEdit={handleEditClick} />
        {:else}
            <ProfileForm
                {loading}
                {avatarPreview}
                onSave={handleSave}
                onCancel={handleCancelEdit}
                onAvatarUpload={handleAvatarUpload}
                onAvatarRemove={handleAvatarRemove}
            />
        {/if}
    </div>
</Container>

{#if showToast}
    <Toast
        message={toastMessage}
        type={toastType}
        on:dismiss={() => (showToast = false)}
    />
{/if}

<style>
    @media (max-width: 768px) {
        :global(.profile-view) {
            padding: 1.5rem;
        }

        :global(.profile-header) {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
        }

        :global(.user-details) {
            align-items: center;
        }

        :global(.profile-info h1) {
            font-size: 1.5rem;
        }

        :global(.email) {
            font-size: 0.9rem;
        }
    }

    @media (max-width: 480px) {
        :global(.profile-view) {
            padding: 1rem;
        }

        :global(.profile-header) {
            gap: 1rem;
        }

        :global(.profile-info h1) {
            font-size: 1.25rem;
        }

        :global(.email) {
            font-size: 0.85rem;
        }

        :global(.profile-actions) {
            margin-top: 1rem;
        }
    }
</style>
