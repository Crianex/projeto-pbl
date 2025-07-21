<script lang="ts">
    import Avatar from "./Avatar.svelte";
    import Button from "./Button.svelte";
    import { get } from "svelte/store";
    import { currentUser } from "$lib/utils/auth";

    export let onEdit: () => void;
</script>

<div class="profile-view">
    <div class="profile-header">
        <Avatar
            src={get(currentUser)?.link_avatar || ""}
            alt={get(currentUser)?.nome_completo || ""}
            size="lg"
        />

        <div class="profile-info">
            <h1>{get(currentUser)?.nome_completo || ""}</h1>
            <p class="email">{get(currentUser)?.email || ""}</p>
        </div>
    </div>

    <div class="profile-actions">
        <Button variant="primary" on:click={onEdit}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                />
                <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                />
            </svg>
            <span>Editar Perfil</span>
        </Button>
    </div>
</div>

<style>
    .profile-view {
        padding: 2rem;
    }

    .profile-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .profile-info {
        flex: 1;
    }

    .profile-info h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
    }

    .email {
        color: #6c757d;
        font-size: 1rem;
        margin: 0;
    }

    .profile-actions {
        display: flex;
        justify-content: center;
    }

    .profile-actions :global(.button) {
        min-width: 180px;
    }

    @media (max-width: 768px) {
        .profile-view {
            padding: 1.5rem;
        }

        .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .profile-info h1 {
            font-size: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        .profile-view {
            padding: 1rem;
        }

        .profile-info h1 {
            font-size: 1.25rem;
        }
    }
</style>
