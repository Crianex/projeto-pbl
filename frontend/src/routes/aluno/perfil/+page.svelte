<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import Container from "$lib/components/Container.svelte";
    import ProfileView from "$lib/components/ProfileView.svelte";
    import ProfileForm from "$lib/components/ProfileForm.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import { AvatarService } from "$lib/services/avatar_service";

    interface UserProfile {
        nome: string;
        email: string;
        avatar: string;
    }

    let profile: UserProfile = {
        nome: "Fulana da Silva",
        email: "fulanadsilva@gmail.com",
        avatar: "/avatars/default.png",
    };

    let isEditing = false;
    let newAvatar: File | null = null;
    let avatarPreview = profile.avatar;
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
        avatarPreview = profile.avatar;
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
                    // TODO: Obter o ID do aluno atual (pode vir do store de autenticação)
                    const alunoId = 1; // Temporário - deve vir do contexto de autenticação
                    const uploadResult = await AvatarService.uploadAlunoAvatar(
                        alunoId,
                        newAvatar,
                    );

                    // Atualizar o avatar com a URL retornada
                    profile.avatar = AvatarService.getAvatarUrl(
                        uploadResult.avatar_url,
                    );
                    avatarPreview = profile.avatar;
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

            // TODO: Implementar atualização dos outros dados do perfil
            console.log("Salvando perfil:", { ...profile });

            // Simular delay de salvamento
            await new Promise((resolve) => setTimeout(resolve, 1000));

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
    <div transition:fade={{ duration: 300 }}>
        {#if !isEditing}
            <ProfileView {profile} onEdit={handleEditClick} />
        {:else}
            <ProfileForm
                {profile}
                {avatarPreview}
                {loading}
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
    }
</style>
