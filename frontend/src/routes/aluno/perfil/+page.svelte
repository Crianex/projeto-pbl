<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import Container from "$lib/components/Container.svelte";
    import ProfileView from "$lib/components/ProfileView.svelte";
    import ProfileForm from "$lib/components/ProfileForm.svelte";
    import Toast from "$lib/components/Toast.svelte";

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
            // TODO: Implementar lógica de salvamento
            console.log("Salvando perfil:", { ...profile, newAvatar });

            // Simular delay de salvamento
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Atualizar o perfil com os novos dados
            profile = { ...profile };
            if (newAvatar) {
                profile.avatar = avatarPreview;
            }

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
    <div class="profile-container" transition:fade={{ duration: 300 }}>
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
    .profile-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 0;
    }

    @media (max-width: 768px) {
        .profile-container {
            padding: 1rem 0;
        }
    }
</style>
