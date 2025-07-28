<script lang="ts">
    import Input from "./Input.svelte";
    import Button from "./Button.svelte";
    import Avatar from "./Avatar.svelte";
    import { get } from "svelte/store";
    import { currentUser } from "$lib/utils/auth";

    export let onSave: () => void;
    export let onCancel: () => void;
    export let onAvatarUpload: (file: File) => void;
    export let onAvatarRemove: () => void;
    export let loading = false;
    export let avatarPreview: string | undefined;

    function handleSubmit() {
        onSave();
    }

    let nome = $currentUser?.nome_completo || "";
    let email = $currentUser?.email || "";

    // Remove handleNomeChange if not used elsewhere
</script>

<div class="profile-form">
    <h1>Editar Perfil</h1>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="avatar-section">
            <Avatar
                src={avatarPreview || $currentUser?.link_avatar || ""}
                alt="Avatar do usuário"
                size="lg"
                editable={true}
                onUpload={onAvatarUpload}
                onRemove={onAvatarRemove}
            />
        </div>

        <div class="form-fields">
            <Input
                type="text"
                label="Nome"
                bind:value={nome}
                id="nome"
                required={true}
                placeholder="Digite seu nome completo"
            />

            <!--   <Input
                type="email"
                label="E-mail"
                bind:value={profile.email}
                id="email"
                required={true}
                placeholder="Digite seu e-mail"
            /> -->
        </div>

        <div class="form-actions">
            <Button
                type="button"
                variant="secondary"
                on:click={onCancel}
                disabled={loading}
            >
                Cancelar
            </Button>

            <Button type="submit" variant="primary" {loading}>
                Salvar Alterações
            </Button>
        </div>
    </form>
</div>

<style>
    .profile-form {
        padding: 2rem;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 2rem 0;
        text-align: center;
    }

    .avatar-section {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
    }

    .form-fields {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .form-actions :global(.button) {
        min-width: 140px;
    }

    @media (max-width: 768px) {
        .profile-form {
            padding: 1.5rem;
        }

        h1 {
            font-size: 1.3rem;
        }

        .form-actions {
            flex-direction: column;
        }

        .form-actions :global(.button) {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .profile-form {
            padding: 1rem;
        }

        h1 {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
        }

        .avatar-section {
            margin-bottom: 1.5rem;
        }

        .form-fields {
            gap: 1.25rem;
            margin-bottom: 1.5rem;
        }

        .form-actions {
            gap: 0.75rem;
        }
    }
</style>
