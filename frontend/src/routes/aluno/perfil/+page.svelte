<script lang="ts">
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';

    interface UserProfile {
        nome: string;
        email: string;
        avatar: string;
    }

    let profile: UserProfile = {
        nome: "Fulana da Silva",
        email: "fulanadsilva@gmail.com",
        avatar: "/avatars/default.png"
    };

    let isEditing = false;
    let newAvatar: File | null = null;
    let avatarPreview = profile.avatar;

    function handleEditClick() {
        isEditing = true;
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            newAvatar = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview = e.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function handleRemoveAvatar() {
        newAvatar = null;
        avatarPreview = '/avatars/default.png';
    }

    async function handleSubmit() {
        // TODO: Implementar lógica de salvamento
        console.log('Salvando perfil:', { ...profile, newAvatar });
        isEditing = false;
    }
</script>

<div class="container" transition:fade={{ duration: 300 }}>
    {#if !isEditing}
        <div class="profile-view">
            <div class="profile-header">
                <div class="avatar-container">
                    <img src={profile.avatar} alt={profile.nome} class="avatar" />
                </div>
                <div class="profile-info">
                    <h1>{profile.nome}</h1>
                    <p class="email">{profile.email}</p>
                </div>
            </div>
            <button class="edit-btn" on:click={handleEditClick}>
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
                Editar Perfil
            </button>
        </div>
    {:else}
        <div class="edit-form" transition:fade>
            <h1>Editar Perfil</h1>
            
            <form on:submit|preventDefault={handleSubmit}>
                <div class="avatar-edit">
                    <div class="avatar-preview">
                        <img src={avatarPreview} alt="Preview" />
                        <div class="avatar-actions">
                            <label class="avatar-upload-btn">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    on:change={handleFileChange}
                                    style="display: none;"
                                />
                            </label>
                            <button
                                type="button"
                                class="avatar-remove-btn"
                                on:click={handleRemoveAvatar}
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
                                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                                    <line x1="18" y1="9" x2="12" y2="15" />
                                    <line x1="12" y1="9" x2="18" y2="15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="nome">Nome</label>
                    <input
                        type="text"
                        id="nome"
                        bind:value={profile.nome}
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        bind:value={profile.email}
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="senha">Nova senha</label>
                    <input
                        type="password"
                        id="senha"
                        placeholder="Digite para alterar a senha"
                    />
                </div>

                <div class="form-group">
                    <label for="confirmar-senha">Confirmar senha</label>
                    <input
                        type="password"
                        id="confirmar-senha"
                        placeholder="Confirme a nova senha"
                    />
                </div>

                <div class="button-group">
                    <button type="button" class="cancel-btn" on:click={() => isEditing = false}>
                        Cancelar
                    </button>
                    <button type="submit" class="save-btn">
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

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

    .avatar-container {
        position: relative;
    }

    .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06);
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
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

    .edit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .edit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    /* Edit Form Styles */
    .edit-form {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 10px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .edit-form h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 2rem 0;
    }

    .avatar-edit {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
    }

    .avatar-preview {
        position: relative;
        width: 120px;
        height: 120px;
    }

    .avatar-preview img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .avatar-actions {
        position: absolute;
        bottom: -0.5rem;
        right: -0.5rem;
        display: flex;
        gap: 0.5rem;
    }

    .avatar-upload-btn,
    .avatar-remove-btn {
        width: 36px;
        height: 36px;
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

    .avatar-upload-btn:hover,
    .avatar-remove-btn:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #495057;
        font-weight: 500;
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid rgba(206, 212, 218, 0.4);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
        color: #495057;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .form-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 
            0 0 0 3px rgba(102, 126, 234, 0.25),
            inset 0 2px 4px rgba(0, 0, 0, 0.05),
            0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .cancel-btn,
    .save-btn {
        flex: 1;
        padding: 0.875rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cancel-btn {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
        border: 1px solid rgba(206, 212, 218, 0.4);
        color: #495057;
        box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .cancel-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 249, 250, 1) 100%);
        transform: translateY(-1px);
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .save-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        box-shadow: 
            0 4px 12px rgba(102, 126, 234, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .save-btn:hover {
        transform: translateY(-1px);
        box-shadow: 
            0 6px 16px rgba(102, 126, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
        .container {
            padding: 1rem;
        }

        .profile-view,
        .edit-form {
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

        .button-group {
            flex-direction: column;
        }

        .cancel-btn,
        .save-btn {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .profile-view,
        .edit-form {
            padding: 1rem;
        }

        .avatar {
            width: 100px;
            height: 100px;
        }

        .profile-info h1 {
            font-size: 1.25rem;
        }

        .form-group input {
            font-size: 0.875rem;
        }
    }
</style> 