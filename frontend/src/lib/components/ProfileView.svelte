<script lang="ts">
    import Avatar from './Avatar.svelte';
    import Button from './Button.svelte';
    
    export let profile: {
        nome: string;
        email: string;
        avatar: string;
    };
    
    export let onEdit: () => void;
</script>

<div class="profile-view">
    <div class="profile-header">
        <Avatar 
            src={profile.avatar} 
            alt={profile.nome} 
            size="lg" 
        />
        
        <div class="profile-info">
            <h1>{profile.nome}</h1>
            <p class="email">{profile.email}</p>
        </div>
    </div>
    
    <div class="profile-actions">
        <Button 
            variant="primary" 
            on:click={onEdit}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Editar Perfil</span>
        </Button>
    </div>
</div>

<style>
    .profile-view {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
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