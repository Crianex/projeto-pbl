<script lang="ts">
    import Button from "$lib/design_system/components/Button.svelte";
    import Input from "$lib/design_system/components/Input.svelte";
    import Container from "$lib/design_system/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Toast from "$lib/design_system/components/Toast.svelte";
    import BackButton from "$lib/design_system/components/BackButton.svelte";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { logger } from "$lib/design_system/utils/logger";
    import { api } from "$lib/design_system/utils/api";
    import { Parsers } from "$lib/interfaces/parsers";
    import { AlunosService } from "$lib/services/alunos_service";

    let email = "";
    let password = "";
    let confirmPassword = "";
    let name = "";
    let loading = false;
    let registrationComplete = false;
    let showToast = false;
    let toastMessage = "";
    let toastType: "success" | "error" | "info" = "success";

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

    // Check if email already exists
    async function checkEmailExists(
        email: string,
    ): Promise<{ exists: boolean; userType?: string }> {
        try {
            // Check both aluno and professor tables
            const [alunoResult, professorResult] = await Promise.allSettled([
                AlunosService.checkEmail(email),
                api.get(
                    `/professores/getByEmail?email=${encodeURIComponent(email)}`,
                ),
            ]);

            if (
                alunoResult.status === "fulfilled" &&
                alunoResult.value.exists
            ) {
                return { exists: true, userType: "aluno" };
            }

            if (professorResult.status === "fulfilled") {
                return { exists: true, userType: "professor" };
            }

            return { exists: false };
        } catch (error) {
            logger.error("Error checking email existence", { error, email });
            return { exists: false }; // Assume it doesn't exist if we can't check
        }
    }

    // Name validation
    function validateName(name: string) {
        if (name.length < 2) {
            return "Nome deve ter pelo menos 2 caracteres";
        }
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
            return "Nome deve conter apenas letras e espaços";
        }
        // Check for at least 2 words (first name and last name)
        const words = name
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0);
        if (words.length < 2) {
            return "Nome deve conter pelo menos nome e sobrenome";
        }
        return "";
    }

    // Password strength validation
    function validatePassword(pass: string) {
        if (pass.length === 0) {
            return "";
        }

        const errors = [];

        if (pass.length < 8) {
            errors.push("pelo menos 8 caracteres");
        }

        if (!/(?=.*[a-z])/.test(pass)) {
            errors.push("1 letra minúscula");
        }

        if (!/(?=.*[A-Z])/.test(pass)) {
            errors.push("1 letra maiúscula");
        }

        if (!/(?=.*\d)/.test(pass)) {
            errors.push("1 número");
        }

        if (errors.length > 0) {
            return `Senha deve conter: ${errors.join(", ")}`;
        }

        return "";
    }

    // Reactive validation - real-time
    $: nameError = name.length > 0 ? validateName(name) : "";
    $: emailError = email.length > 0 ? validateEmail(email) : "";
    $: passwordError = password.length > 0 ? validatePassword(password) : "";
    $: confirmPasswordError =
        confirmPassword.length > 0 && password !== confirmPassword
            ? "Senhas não coincidem"
            : "";
    $: formValid =
        name &&
        email &&
        password &&
        confirmPassword &&
        !nameError &&
        !emailError &&
        !passwordError &&
        !confirmPasswordError;
    $: formTouched = name || email || password || confirmPassword;

    let triedSubmit = false;

    async function handleRegister() {
        triedSubmit = true;
        if (!formValid) return;

        loading = true;

        try {
            logger.info("Attempting registration", { email, name, password });

            // Check if email already exists
            const emailExists = await checkEmailExists(email);
            if (emailExists.exists) {
                toastType = "error";
                toastMessage =
                    emailExists.userType === "aluno"
                        ? "Este e-mail já está registrado como aluno. Tente fazer login ou use outro e-mail."
                        : "Este e-mail já está registrado como professor. Tente fazer login ou use outro e-mail.";
                showToast = true;
                loading = false;
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nome_completo: name,
                    },
                },
            });

            console.log(error);

            if (error) throw error;

            if (data.user) {
                logger.info("Supabase registration successful", {
                    userId: data.user.id,
                });

                // Create backend account
                try {
                    logger.info("Creating backend aluno account", {
                        email,
                        name,
                    });
                    const backendResponse = await api.post("/alunos/create", {
                        email: email,
                        nome_completo: name,
                    });

                    const aluno = Parsers.parseAluno(backendResponse);
                    logger.info("Backend aluno account created successfully", {
                        alunoId: aluno.id,
                        email: aluno.email,
                    });

                    registrationComplete = true;
                    toastType = "success";
                    toastMessage =
                        "Conta criada com sucesso! Redirecionando...";
                    showToast = true;

                    // Wait a bit before redirecting to aluno problemas page
                    setTimeout(() => {
                        goto("/aluno/problemas");
                    }, 2000);
                } catch (backendError: any) {
                    logger.error("Failed to create backend account", {
                        error: backendError.message,
                        email,
                    });

                    // Handle specific backend errors
                    if (backendError.status === 409) {
                        const errorData = backendError.data;
                        if (errorData?.existingUserType === "professor") {
                            toastType = "error";
                            toastMessage =
                                "Este e-mail já está registrado como professor. Tente fazer login ou use outro e-mail.";
                        } else {
                            toastType = "error";
                            toastMessage =
                                "Este e-mail já está registrado. Tente fazer login ou use outro e-mail.";
                        }
                    } else {
                        toastType = "error";
                        toastMessage =
                            "Erro ao criar conta no sistema. Tente novamente.";
                    }
                    showToast = true;
                    loading = false;
                }
            }
        } catch (err: any) {
            logger.error("Registration failed", { error: err.message, email });
            toastType = "error";
            toastMessage =
                err.message || "Erro ao criar conta. Tente novamente.";
            showToast = true;
        } finally {
            loading = false;
        }
    }

    async function handleGoogleRegister() {
        try {
            loading = true;
            logger.info("Attempting Google registration");

            toastType = "info";
            toastMessage = "Redirecionando para Google...";
            showToast = true;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            // Note: Backend account creation will be handled in the auth callback
            // since Google OAuth redirects the user away from this page
        } catch (err: any) {
            logger.error("Google registration failed", { error: err.message });
            toastType = "error";
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
    <div class="success-container">
        <div class="success-icon">✓</div>
        <h1>Conta Criada!</h1>
        <p class="success-message">
            Bem-vindo(a), <strong>{name}!</strong>
        </p>
        <p class="instructions">
            Sua conta foi criada com sucesso. Você será redirecionado para a
            página de problemas em instantes.
        </p>

        <div class="actions">
            <LoadingSpinner
                size="md"
                color="primary"
                message="Configurando sua conta..."
            />
        </div>
    </div>
{:else}
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
                disabled={loading}
                {loading}
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
{/if}

{#if loading && !registrationComplete}
    <LoadingSpinner overlay={true} message="Criando sua conta..." />
{/if}

{#if showToast}
    <Toast
        type={toastType}
        title={toastType === "success"
            ? "Sucesso!"
            : toastType === "error"
              ? "Erro!"
              : "Info"}
        message={toastMessage}
        on:dismiss={() => (showToast = false)}
    />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100dvh;
        background: linear-gradient(
            135deg,
            #ffffff 0%,
            #f8f9fa 50%,
            #e9ecef 100%
        );
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
            sans-serif;
    }

    :global(main) {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100dvh;
        padding: 2rem;
        box-sizing: border-box;
    }

    .header {
        text-align: center;
        margin-bottom: 2.5rem;
        position: relative;
    }

    :global(.back-btn) {
        position: absolute;
        top: -3rem;
        left: 0;
        margin-bottom: 1rem;
    }

    .header h1 {
        color: #1f2937;
        font-size: 1.5rem;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .button-group :global(button) {
        width: 100%;
        max-width: 300px;
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
        width: 100%;
    }

    .divider::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            #e2e8f0 20%,
            #e2e8f0 80%,
            transparent 100%
        );
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
        display: flex;
        justify-content: center;
        width: 100%;
    }

    .google-section :global(button) {
        width: 100%;
        max-width: 300px;
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
        width: 100%;
    }

    .login-link a {
        color: var(--color-nature-main);
        text-decoration: none;
        margin-left: 0.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .login-link a:hover {
        color: var(--color-nature-light);
        background: var(--color-nature-background);
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
        0%,
        100% {
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
    @media (max-width: 768px) {
        :global(main) {
            padding: 0;
            align-items: stretch;
            min-height: 100dvh;
        }

        :global(.container) {
            max-width: 100% !important;
            width: 100%;
            height: 100dvh;
            border-radius: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .header h1 {
            font-size: 1.875rem;
        }

        .subtitle {
            font-size: 0.95rem;
        }

        .success-container h1 {
            font-size: 1.875rem;
        }

        .form-group {
            margin-bottom: 1.375rem;
        }

        .button-group {
            margin-top: 1.75rem;
            margin-bottom: 1.75rem;
        }

        .button-group :global(button) {
            width: 100%;
            max-width: 300px;
        }

        .divider {
            margin: 1.75rem 0;
        }

        .divider span {
            padding: 0 1rem;
            font-size: 0.85rem;
        }

        .google-section :global(button) {
            width: 100%;
            max-width: 300px;
        }

        .login-link {
            font-size: 0.925rem;
            margin-top: 1.25rem;
            padding-top: 1.25rem;
        }
    }

    @media (max-width: 640px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 2rem 1.5rem;
        }

        .header {
            margin-bottom: 2rem;
        }

        .header h1 {
            font-size: 1.75rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }

        .success-container h1 {
            font-size: 1.75rem;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
            margin-bottom: 1.5rem;
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

        .button-group :global(button) {
            width: 100%;
            max-width: 300px;
        }

        .divider {
            margin: 1.5rem 0;
        }

        .divider span {
            padding: 0 1rem;
            font-size: 0.85rem;
        }

        .google-section :global(button) {
            width: 100%;
            max-width: 300px;
        }

        .login-link {
            font-size: 0.9rem;
            margin-top: 1rem;
            padding-top: 1rem;
        }

        .login-link a {
            padding: 0.5rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .password-strength {
            padding: 0.375rem;
            margin-top: 0.375rem;
        }

        .strength-text {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 1.5rem 1rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.5rem;
        }

        .subtitle {
            font-size: 0.875rem;
        }

        .success-container h1 {
            font-size: 1.5rem;
        }

        .success-icon {
            width: 50px;
            height: 50px;
            font-size: 1.75rem;
            margin-bottom: 1.25rem;
        }

        .success-message {
            font-size: 1rem;
        }

        .instructions {
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .button-group :global(button) {
            max-width: 100%;
        }

        .divider {
            margin: 1.25rem 0;
        }

        .divider span {
            padding: 0 0.75rem;
            font-size: 0.8rem;
        }

        .google-section :global(button) {
            max-width: 100%;
        }

        .login-link {
            font-size: 0.875rem;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
        }
    }

    @media (max-width: 360px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 1rem 0.75rem;
        }

        .header h1 {
            font-size: 1.375rem;
        }

        .success-container h1 {
            font-size: 1.375rem;
        }

        .form-group {
            margin-bottom: 0.875rem;
        }

        .button-group {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        .divider {
            margin: 1rem 0;
        }
    }

    /* Landscape phones */
    @media (max-height: 640px) and (orientation: landscape) {
        :global(main) {
            align-items: stretch;
            padding: 0;
        }

        :global(.container) {
            height: 100dvh;
            border-radius: 0;
            justify-content: center;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .divider {
            margin: 1rem 0;
        }

        .login-link {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
        }

        .success-container {
            padding: 0.5rem;
        }

        .success-icon {
            width: 50px;
            height: 50px;
            font-size: 1.75rem;
            margin-bottom: 1rem;
        }

        .instructions {
            margin-bottom: 1.5rem;
        }
    }

    /* Very small screens / older phones */
    @media (max-width: 320px) {
        :global(.container) {
            padding: 0.75rem 0.5rem;
        }

        .header h1 {
            font-size: 1.25rem;
        }

        .success-container h1 {
            font-size: 1.25rem;
        }

        .subtitle,
        .success-message,
        .instructions {
            font-size: 0.825rem;
        }

        .login-link {
            font-size: 0.8rem;
        }

        .password-strength {
            padding: 0.25rem;
        }

        .strength-text {
            font-size: 0.75rem;
        }
    }
</style>
