<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Input from "$lib/components/Input.svelte";
    import Container from "$lib/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { logger } from "$lib/utils/logger";

    let email = "";
    let password = "";
    let confirmPassword = "";
    let name = "";
    let loading = false;
    let registrationComplete = false;
    let showToast = false;
    let toastMessage = "";
    let toastType: 'success' | 'error' | 'info' = 'success';

    // Validation states
    let nameError = "";
    let emailError = "";
    let passwordError = "";
    let confirmPasswordError = "";
    
    // Email validation
    function validateEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Por favor, digite um e-mail válido";
        }
        return "";
    }
    
    // Name validation
    function validateName(name: string) {
        if (name.length < 2) {
            return "Nome deve ter pelo menos 2 caracteres";
        }
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
            return "Nome deve conter apenas letras e espaços";
        }
        return "";
    }
    
    // Password strength validation
    function validatePassword(pass: string) {
        if (pass.length < 8) {
            return "Senha deve ter pelo menos 8 caracteres";
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pass)) {
            return "Senha deve conter pelo menos 1 letra minúscula, 1 maiúscula e 1 número";
        }
        return "";
    }

    // Reactive validation
    $: nameError = name && name.length > 0 ? validateName(name) : "";
    $: emailError = email && email.length > 0 ? validateEmail(email) : "";
    $: passwordError = password && password.length > 0 ? validatePassword(password) : "";
    $: confirmPasswordError = confirmPassword && password !== confirmPassword ? "Senhas não coincidem" : "";
    $: formValid = name && email && password && confirmPassword && 
        !nameError && !emailError && !passwordError && !confirmPasswordError;

    async function handleRegister() {
        if (!formValid) return;

        loading = true;

        try {
            logger.info("Attempting registration", { email, name });
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nome_completo: name,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                registrationComplete = true;
                toastType = 'success';
                toastMessage = "Conta criada com sucesso! Verificando e-mail...";
                showToast = true;
                
                logger.info("Registration successful", { userId: data.user.id });
                
                // Wait a bit before redirecting
                setTimeout(() => {
                    goto("/auth/callback");
                }, 2000);
            }
        } catch (err: any) {
            logger.error("Registration failed", { error: err.message, email });
            toastType = 'error';
            toastMessage = err.message || "Erro ao criar conta. Tente novamente.";
            showToast = true;
        } finally {
            loading = false;
        }
    }

    async function handleGoogleRegister() {
        try {
            loading = true;
            logger.info("Attempting Google registration");
            
            toastType = 'info';
            toastMessage = "Redirecionando para Google...";
            showToast = true;
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            logger.error("Google registration failed", { error: err.message });
            toastType = 'error';
            toastMessage = err.message || "Erro ao registrar com Google";
            showToast = true;
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Register</title>
    <meta name="description" content="Página de registro" />
</svelte:head>

{#if registrationComplete}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>Conta Criada!</h1>
            <p class="success-message">
                Bem-vindo(a), <strong>{name}!</strong>
            </p>
            <p class="instructions">
                Sua conta foi criada com sucesso. Você será redirecionado em instantes.
            </p>
            
            <div class="actions">
                <LoadingSpinner 
                    size="md" 
                    color="primary" 
                    text="Configurando sua conta..."
                />
            </div>
        </div>
    </Container>
{:else}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="header">
            <h1>Criar Conta</h1>
            <p class="subtitle">Preencha os dados para se registrar</p>
        </div>

        <form on:submit|preventDefault={handleRegister}>
            <div class="form-group">
                <Input
                    type="text"
                    id="name"
                    label="Nome completo"
                    bind:value={name}
                    placeholder="Digite seu nome completo"
                    error={nameError}
                    required
                    disabled={loading}
                    autocomplete="name"
                />
            </div>

            <div class="form-group">
                <Input
                    type="email"
                    id="email"
                    label="E-mail"
                    bind:value={email}
                    placeholder="seu@email.com"
                    error={emailError}
                    required
                    disabled={loading}
                    autocomplete="email"
                />
            </div>

            <div class="form-group">
                <Input
                    type="password"
                    id="password"
                    label="Senha"
                    bind:value={password}
                    placeholder="Digite uma senha segura"
                    error={passwordError}
                    required
                    disabled={loading}
                    autocomplete="new-password"
                />
                
                {#if password && !passwordError}
                    <div class="password-strength">
                        <div class="strength-indicator strong"></div>
                        <span class="strength-text">Senha forte ✓</span>
                    </div>
                {/if}
            </div>

            <div class="form-group">
                <Input
                    type="password"
                    id="confirmPassword"
                    label="Confirmar senha"
                    bind:value={confirmPassword}
                    placeholder="Digite sua senha novamente"
                    error={confirmPasswordError}
                    required
                    disabled={loading}
                    autocomplete="new-password"
                />
            </div>

            <div class="button-group">
                <Button 
                    type="submit"
                    variant="primary" 
                    disabled={!formValid || loading}
                    loading={loading}
                >
                    {loading ? "Criando conta..." : "Criar conta"}
                </Button>
            </div>
        </form>

        <div class="divider">
            <span>ou registre-se com</span>
        </div>

        <div class="google-section">
            <Button
                variant="secondary"
                disabled={loading}
                on:click={handleGoogleRegister}
            >
                <div class="google-icon">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill="#4285F4"
                            d="M18 9.2c0-.6-.1-1.2-.2-1.8H9.2v3.4h4.9c-.2 1.1-.9 2-1.8 2.6v2.2h2.9c1.7-1.6 2.8-3.9 2.8-6.4z"
                        />
                        <path
                            fill="#34A853"
                            d="M9.2 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H1.1v2.3C2.6 15.4 5.7 18 9.2 18z"
                        />
                        <path
                            fill="#FBBC04"
                            d="M4.1 10.7c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.8H1.1C.4 6.1 0 7.5 0 9s.4 2.9 1.1 4.2l3-2.5z"
                        />
                        <path
                            fill="#EA4335"
                            d="M9.2 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.7.7 11.6 0 9.2 0 5.7 0 2.6 2.6 1.1 5.9l3 2.5c.7-2.2 2.7-3.8 5.1-3.8z"
                        />
                    </svg>
                </div>
                Continuar com Google
            </Button>
        </div>

        <div class="login-link">
            <span>Já tem uma conta?</span>
            <a href="/login">Fazer login</a>
        </div>
    </Container>
{/if}

{#if loading && !registrationComplete}
    <LoadingSpinner overlay={true} text="Criando sua conta..." />
{/if}

{#if showToast}
    <Toast 
        type={toastType}
        title={toastType === 'success' ? 'Sucesso!' : toastType === 'error' ? 'Erro!' : 'Info'}
        message={toastMessage}
        on:dismiss={() => showToast = false}
    />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    :global(main) {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 2rem;
        box-sizing: border-box;
    }

    .header {
        text-align: center;
        margin-bottom: 2.5rem;
    }

    .header h1 {
        color: #2d3748;
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        margin: 0 0 1rem 0;
    }

    .subtitle {
        color: #4a5568;
        font-size: 1rem;
        margin: 0;
        line-height: 1.5;
        opacity: 0.9;
    }

    .form-group {
        margin-bottom: 1.5rem;
        position: relative;
    }

    .button-group {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }

    /* Password Strength Indicator */
    .password-strength {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        border-radius: 8px;
        background: rgba(72, 187, 120, 0.1);
        border: 1px solid rgba(72, 187, 120, 0.2);
    }

    .strength-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .strength-indicator.strong {
        background: linear-gradient(135deg, #48bb78 0%, #38b2ac 100%);
        box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
    }

    .strength-text {
        color: #2f855a;
        font-size: 0.875rem;
        font-weight: 600;
    }

    /* Divider Styling */
    .divider {
        text-align: center;
        margin: 2rem 0;
        position: relative;
    }

    .divider::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, #e2e8f0 20%, #e2e8f0 80%, transparent 100%);
    }

    .divider span {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 0 1.5rem;
        color: #718096;
        font-size: 0.9rem;
        font-weight: 500;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Google Section */
    .google-section {
        margin-bottom: 2rem;
    }

    .google-icon {
        display: flex;
        align-items: center;
    }

    /* Login Link */
    .login-link {
        text-align: center;
        color: #4a5568;
        font-size: 0.95rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .login-link a {
        color: #667eea;
        text-decoration: none;
        margin-left: 0.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .login-link a:hover {
        color: #5a67d8;
        background: rgba(102, 126, 234, 0.1);
        text-decoration: none;
        transform: translateY(-1px);
    }

    /* Success State Styles */
    .success-container {
        text-align: center;
        padding: 1rem;
    }

    .success-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #48bb78 0%, #38b2ac 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: bold;
        margin: 0 auto 2rem auto;
        box-shadow: 
            0 15px 35px rgba(72, 187, 120, 0.3),
            0 8px 20px rgba(72, 187, 120, 0.2);
        animation: successPulse 2s ease-in-out infinite;
    }

    @keyframes successPulse {
        0%, 100% {
            transform: scale(1);
            box-shadow: 
                0 15px 35px rgba(72, 187, 120, 0.3),
                0 8px 20px rgba(72, 187, 120, 0.2);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 
                0 20px 40px rgba(72, 187, 120, 0.4),
                0 12px 25px rgba(72, 187, 120, 0.3);
        }
    }

    .success-container h1 {
        color: #2d3748;
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
    }

    .success-message {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0 0 1rem 0;
        line-height: 1.5;
    }

    .instructions {
        color: #718096;
        font-size: 0.95rem;
        margin: 0 0 2.5rem 0;
        line-height: 1.6;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
    }

    /* Form Styling */
    :global(.form-group .input-container) {
        margin-bottom: 0;
    }

    /* Responsive Design */
    @media (max-width: 640px) {
        :global(main) {
            padding: 1rem;
        }

        .header h1 {
            font-size: 1.75rem;
        }

        .success-container h1 {
            font-size: 1.75rem;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
        }

        .actions {
            gap: 0.75rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }

        .button-group {
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .divider {
            margin: 1.5rem 0;
        }

        .login-link {
            font-size: 0.9rem;
            margin-top: 1rem;
            padding-top: 1rem;
        }
    }

    @media (max-width: 480px) {
        .header h1 {
            font-size: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }
    }
</style>
