<script lang="ts">
    import ProfileView from '../ProfileView.svelte';
    import ProfileForm from '../ProfileForm.svelte';
    import Avatar from '../Avatar.svelte';
    import Toast from '../Toast.svelte';
    
    // Estado do exemplo
    let isEditing = false;
    let showToast = false;
    let toastMessage = '';
    let toastType: 'success' | 'error' = 'success';
    
    // Dados do perfil
    let profile = {
        nome: "Maria Santos",
        email: "maria.santos@email.com",
        avatar: "/avatars/maria.jpg"
    };
    
    let avatarPreview = profile.avatar;
    let loading = false;
    
    // Handlers
    function handleEdit() {
        isEditing = true;
    }
    
    function handleCancel() {
        isEditing = false;
        avatarPreview = profile.avatar;
    }
    
    function handleSave() {
        loading = true;
        
        // Simular salvamento
        setTimeout(() => {
            profile = { ...profile };
            if (avatarPreview !== profile.avatar) {
                profile.avatar = avatarPreview;
            }
            
            isEditing = false;
            loading = false;
            showSuccessToast('Perfil atualizado com sucesso!');
        }, 1500);
    }
    
    function handleAvatarUpload(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
    
    function handleAvatarRemove() {
        avatarPreview = '/avatars/default.png';
    }
    
    function showSuccessToast(message: string) {
        toastMessage = message;
        toastType = 'success';
        showToast = true;
        
        setTimeout(() => {
            showToast = false;
        }, 3000);
    }
    
    function showErrorToast(message: string) {
        toastMessage = message;
        toastType = 'error';
        showToast = true;
        
        setTimeout(() => {
            showToast = false;
        }, 3000);
    }
</script>

<div class="example-container">
    <h2>Exemplo de Componentes de Perfil</h2>
    
    <div class="example-section">
        <h3>1. Avatar Component</h3>
        <div class="avatar-examples">
            <div class="avatar-example">
                <h4>Avatar Básico</h4>
                <Avatar src={profile.avatar} alt={profile.nome} size="md" />
            </div>
            
            <div class="avatar-example">
                <h4>Avatar Editável</h4>
                <Avatar 
                    src={avatarPreview} 
                    alt={profile.nome} 
                    size="md" 
                    editable={true}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                />
            </div>
            
            <div class="avatar-example">
                <h4>Diferentes Tamanhos</h4>
                <div class="avatar-sizes">
                    <Avatar src={profile.avatar} alt="Avatar" size="sm" />
                    <Avatar src={profile.avatar} alt="Avatar" size="md" />
                    <Avatar src={profile.avatar} alt="Avatar" size="lg" />
                </div>
            </div>
        </div>
    </div>
    
    <div class="example-section">
        <h3>2. Profile Components</h3>
        
        {#if !isEditing}
            <ProfileView 
                {profile}
                onEdit={handleEdit}
            />
        {:else}
            <ProfileForm
                {profile}
                {avatarPreview}
                {loading}
                onSave={handleSave}
                onCancel={handleCancel}
                onAvatarUpload={handleAvatarUpload}
                onAvatarRemove={handleAvatarRemove}
            />
        {/if}
    </div>
    
    <div class="example-section">
        <h3>3. Interações</h3>
        <div class="interactions">
            <button on:click={() => showSuccessToast('Exemplo de sucesso!')}>
                Mostrar Toast de Sucesso
            </button>
            <button on:click={() => showErrorToast('Exemplo de erro!')}>
                Mostrar Toast de Erro
            </button>
        </div>
    </div>
</div>

{#if showToast}
    <Toast 
        message={toastMessage} 
        type={toastType} 
        on:dismiss={() => showToast = false}
    />
{/if}

<style>
    .example-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    h2 {
        font-size: 2rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 2rem;
        text-align: center;
    }
    
    .example-section {
        margin-bottom: 3rem;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 1.5rem;
    }
    
    h4 {
        font-size: 1rem;
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.5rem;
    }
    
    .avatar-examples {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
    }
    
    .avatar-example {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .avatar-sizes {
        display: flex;
        justify-content: center;
        gap: 1rem;
        align-items: center;
    }
    
    .interactions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .interactions button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .interactions button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
    
    @media (max-width: 768px) {
        .example-container {
            padding: 1rem;
        }
        
        .avatar-examples {
            grid-template-columns: 1fr;
        }
        
        .interactions {
            flex-direction: column;
        }
    }
</style> 