# Componentes Premium

Esta pasta contém componentes Svelte reutilizáveis com design premium moderno.

## 🎨 Componentes Atualizados

### Button.svelte
Botão premium com gradientes, sombras e animações.

```svelte
<script>
    import Button from "$lib/components/Button.svelte";
</script>

<!-- Variantes de botão -->
<Button variant="primary">Botão Primário</Button>
<Button variant="secondary">Botão Secundário</Button>
<Button variant="danger">Botão de Perigo</Button>

<!-- Com loading -->
<Button variant="primary" loading={true}>Carregando...</Button>

<!-- Desabilitado -->
<Button variant="primary" disabled={true}>Desabilitado</Button>
```

### CardSection.svelte
Cards com efeito glassmorphism e sombras premium.

```svelte
<script>
    import CardSection from "$lib/components/CardSection.svelte";
</script>

<CardSection 
    title="Título do Card"
    subtitle="Subtítulo do card"
    metrics="42"
    href="/alguma-rota"
    bgColor="#F2F4F8"
>
    <div slot="icon">
        <svg><!-- SVG icon --></svg>
    </div>
    
    <p>Conteúdo adicional do card</p>
</CardSection>
```

### Dialog.svelte
Modal premium com backdrop blur e animações suaves.

```svelte
<script>
    import Dialog from "$lib/components/Dialog.svelte";
    
    let open = false;
</script>

<Dialog bind:open closeOnClickOutside={true}>
    <div slot="header">
        <h2>Título do Modal</h2>
    </div>
    
    <p>Conteúdo do modal aqui...</p>
    
    <button on:click={() => open = false}>Fechar</button>
</Dialog>
```

## ✨ Novos Componentes

### Input.svelte
Campo de entrada premium com validação e estados visuais.

```svelte
<script>
    import Input from "$lib/components/Input.svelte";
    
    let email = '';
    let password = '';
    let errorMessage = '';
</script>

<!-- Input básico -->
<Input 
    type="email"
    label="Email"
    bind:value={email}
    placeholder="seu@email.com"
    required
/>

<!-- Input com erro -->
<Input 
    type="password"
    label="Senha"
    bind:value={password}
    error={errorMessage}
    placeholder="Digite sua senha"
/>

<!-- Input com ícone -->
<Input 
    type="text"
    label="Buscar"
    bind:value={searchTerm}
    placeholder="Digite para buscar..."
>
    <div slot="icon">
        <svg><!-- Search icon --></svg>
    </div>
</Input>
```

### Container.svelte
Container responsivo com variantes de design.

```svelte
<script>
    import Container from "$lib/components/Container.svelte";
</script>

<!-- Container básico -->
<Container>
    <h1>Conteúdo centralizado</h1>
</Container>

<!-- Container com efeito glass -->
<Container maxWidth="md" glass={true} shadow={true}>
    <p>Container premium com glassmorphism</p>
</Container>

<!-- Container sem padding -->
<Container maxWidth="xl" padding="none" center={false}>
    <div>Container de largura total</div>
</Container>
```

### LoadingSpinner.svelte
Spinner de carregamento com múltiplas variantes.

```svelte
<script>
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
</script>

<!-- Spinner básico -->
<LoadingSpinner />

<!-- Spinner com texto -->
<LoadingSpinner 
    size="lg" 
    color="primary" 
    text="Carregando dados..." 
/>

<!-- Spinner centralizado -->
<LoadingSpinner 
    size="xl" 
    color="secondary" 
    center={true}
    text="Processando..."
/>

<!-- Overlay de loading -->
<LoadingSpinner 
    overlay={true}
    text="Salvando alterações..."
/>
```

### Toast.svelte
Sistema de notificações moderno com auto-dismiss.

```svelte
<script>
    import Toast from "$lib/components/Toast.svelte";
    
    let showToast = false;
    
    function showSuccess() {
        showToast = true;
    }
</script>

{#if showToast}
    <Toast 
        type="success"
        title="Sucesso!"
        message="Operação realizada com sucesso."
        on:dismiss={() => showToast = false}
    />
{/if}

<!-- Diferentes tipos -->
<Toast type="error" title="Erro!" message="Algo deu errado." />
<Toast type="warning" title="Atenção!" message="Verifique os dados." />
<Toast type="info" title="Info" message="Nova atualização disponível." />
```

### Avatar.svelte
Componente de avatar com suporte a upload e edição.

```svelte
<script>
    import Avatar from "$lib/components/Avatar.svelte";
    
    let userAvatar = "/avatars/user.jpg";
    
    function handleAvatarUpload(file) {
        // Processar upload do arquivo
        console.log('Arquivo selecionado:', file);
    }
    
    function handleAvatarRemove() {
        userAvatar = "/avatars/default.png";
    }
</script>

<!-- Avatar básico -->
<Avatar src={userAvatar} alt="Avatar do usuário" size="lg" />

<!-- Avatar editável -->
<Avatar 
    src={userAvatar} 
    alt="Avatar do usuário" 
    size="lg" 
    editable={true}
    onUpload={handleAvatarUpload}
    onRemove={handleAvatarRemove}
/>

<!-- Diferentes tamanhos -->
<Avatar src={userAvatar} alt="Avatar" size="sm" />
<Avatar src={userAvatar} alt="Avatar" size="md" />
<Avatar src={userAvatar} alt="Avatar" size="lg" />
<Avatar src={userAvatar} alt="Avatar" size="xl" />
```

### ProfileView.svelte
Componente para exibir informações do perfil do usuário.

```svelte
<script>
    import ProfileView from "$lib/components/ProfileView.svelte";
    
    let profile = {
        nome: "João Silva",
        email: "joao@email.com",
        avatar: "/avatars/joao.jpg"
    };
    
    function handleEdit() {
        // Lógica para entrar no modo de edição
        console.log('Editar perfil');
    }
</script>

<ProfileView 
    {profile}
    onEdit={handleEdit}
/>
```

### ProfileForm.svelte
Formulário completo para edição de perfil com validação.

```svelte
<script>
    import ProfileForm from "$lib/components/ProfileForm.svelte";
    
    let profile = {
        nome: "João Silva",
        email: "joao@email.com",
        avatar: "/avatars/joao.jpg"
    };
    
    let avatarPreview = profile.avatar;
    let loading = false;
    
    function handleSave() {
        loading = true;
        // Lógica de salvamento
        setTimeout(() => {
            loading = false;
        }, 2000);
    }
    
    function handleCancel() {
        // Voltar para visualização
    }
    
    function handleAvatarUpload(file) {
        // Processar upload
    }
    
    function handleAvatarRemove() {
        avatarPreview = "/avatars/default.png";
    }
</script>

<ProfileForm
    {profile}
    {avatarPreview}
    {loading}
    onSave={handleSave}
    onCancel={handleCancel}
    onAvatarUpload={handleAvatarUpload}
    onAvatarRemove={handleAvatarRemove}
/>
```
<!-- Toast persistente -->
<Toast 
    type="success"
    title="Salvo!"
    message="Dados salvos automaticamente."
    persistent={true}
    position="bottom-right"
/>
```

## 🎯 Propriedades Principais

### Input.svelte
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
- `value`: string (two-way binding)
- `label`: string
- `placeholder`: string
- `error`: string
- `disabled`: boolean
- `required`: boolean

### Container.svelte
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `center`: boolean
- `glass`: boolean (glassmorphism effect)
- `shadow`: boolean
- `rounded`: boolean

### LoadingSpinner.svelte
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'primary' | 'secondary' | 'white' | 'gray'
- `text`: string
- `center`: boolean
- `overlay`: boolean

### Toast.svelte
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: string
- `message`: string
- `duration`: number (ms)
- `persistent`: boolean
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'

## 🎨 Design System

Todos os componentes seguem um design system consistente:

- **Cores**: Gradientes premium (#667eea, #764ba2)
- **Sombras**: Múltiplas camadas para profundidade
- **Animações**: Transições suaves (0.3s ease)
- **Glassmorphism**: backdrop-filter: blur()
- **Responsivo**: Mobile-first design
- **Acessibilidade**: ARIA labels e focus states

## 📱 Responsividade

Todos os componentes são totalmente responsivos e otimizados para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🚀 Exemplo de Uso Completo

```svelte
<script>
    import { Container, Input, Button, LoadingSpinner, Toast } from "$lib/components";
    
    let loading = false;
    let showToast = false;
    let formData = { email: '', password: '' };
    
    async function handleSubmit() {
        loading = true;
        try {
            // Sua lógica aqui
            showToast = true;
        } finally {
            loading = false;
        }
    }
</script>

<Container maxWidth="md" glass={true} shadow={true}>
    <h1>Login Premium</h1>
    
    <form on:submit|preventDefault={handleSubmit}>
        <Input 
            type="email"
            label="Email"
            bind:value={formData.email}
            placeholder="seu@email.com"
            required
        />
        
        <Input 
            type="password"
            label="Senha"
            bind:value={formData.password}
            placeholder="Digite sua senha"
            required
        />
        
        <Button 
            type="submit" 
            variant="primary" 
            loading={loading}
            disabled={loading}
        >
            {loading ? 'Entrando...' : 'Entrar'}
        </Button>
    </form>
</Container>

{#if loading}
    <LoadingSpinner overlay={true} text="Autenticando..." />
{/if}

{#if showToast}
    <Toast 
        type="success"
        title="Login realizado!"
        message="Bem-vindo de volta!"
        on:dismiss={() => showToast = false}
    />
{/if}
```

### FileUpload.svelte
Componente premium de upload de arquivos com drag & drop, suporte a múltiplos formatos e validação.

```svelte
<script>
    import FileUpload from "$lib/components/FileUpload.svelte";
    
    let uploadedFiles = [];
    
    function handleFilesSelected(event) {
        console.log('Arquivos selecionados:', event.detail.files);
        uploadedFiles = [...uploadedFiles, ...event.detail.files];
    }
    
    function handleFileRemoved(event) {
        console.log('Arquivos restantes:', event.detail.files);
        uploadedFiles = event.detail.files;
    }
</script>

<!-- Upload básico -->
<FileUpload
    label="Enviar Documentos"
    description="Arraste seus arquivos aqui ou clique para selecionar"
    on:filesSelected={handleFilesSelected}
    on:fileRemoved={handleFileRemoved}
/>

<!-- Upload customizado -->
<FileUpload
    label="Anexar Imagens"
    description="Envie suas fotos"
    accept=".png,.jpg,.jpeg"
    supportedFormats="PNG, JPG, JPEG"
    multiple={true}
    maxSize={5 * 1024 * 1024}
    on:filesSelected={handleFilesSelected}
/>

<!-- Upload único -->
<FileUpload
    label="Documento PDF"
    accept=".pdf"
    supportedFormats="PDF"
    multiple={false}
    maxSize={2 * 1024 * 1024}
/>
```

**Propriedades:**
- `accept`: Tipos de arquivo aceitos (padrão: `.pdf,.png,.jpg,.jpeg`)
- `multiple`: Permite múltiplos arquivos (padrão: `true`)
- `maxSize`: Tamanho máximo em bytes (padrão: `10MB`)
- `label`: Rótulo do componente
- `description`: Texto descritivo
- `supportedFormats`: Texto dos formatos suportados
- `disabled`: Estado desabilitado
- `error`: Mensagem de erro

**Eventos:**
- `filesSelected`: Disparado quando arquivos são selecionados
- `fileRemoved`: Disparado quando um arquivo é removido

**Características:**
- 🎨 Design glassmorphism premium
- 🖱️ Drag & drop intuitivo
- ✅ Validação de tipo e tamanho
- 📱 Totalmente responsivo
- ♿ Acessível (ARIA labels)
- 🎭 Animações suaves
- 🔄 Estados visuais (hover, drag, error) 