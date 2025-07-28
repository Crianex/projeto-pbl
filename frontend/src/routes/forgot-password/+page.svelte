<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Input from "$lib/components/Input.svelte";
    import Container from "$lib/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";

    let email = "";
    let loading = false;
    let emailSent = false;
    let errorMessage = "";
    let showToast = false;
    let toastMessage = "";
    let toastType: "success" | "error" = "success";

    async function handleForgotPassword() {
        if (!email) return;

        loading = true;
        errorMessage = "";

        try {
            logger.info("Attempting password reset", { email });

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            emailSent = true;
            toastType = "success";
            toastMessage = "E-mail de recuperação enviado com sucesso!";
            showToast = true;

            logger.info("Password reset email sent successfully");
        } catch (error: any) {
            logger.error("Password reset failed", {
                error: error.message,
                email,
            });
            errorMessage =
                error.message || "Erro ao enviar e-mail de recuperação";
            toastType = "error";
            toastMessage = errorMessage;
            showToast = true;
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Recuperar Senha</title>
    <meta name="description" content="Página de recuperação de senha" />
</svelte:head>

{#if emailSent}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>E-mail Enviado!</h1>
            <p class="success-message">
                Enviamos um link de recuperação para <strong>{email}</strong>
            </p>
            <p class="instructions">
                Verifique sua caixa de entrada e siga as instruções para
                redefinir sua senha.
            </p>

            <div class="actions">
                <Button
                    variant="secondary"
                    on:click={() => (emailSent = false)}
                >
                    Enviar para outro e-mail
                </Button>
                <a href="/login" class="back-link">Voltar para o login</a>
            </div>
        </div>
    </Container>
{:else}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="header">
            <h1>Recuperar Senha</h1>
            <p class="subtitle">
                Digite seu e-mail para receber um link de recuperação
            </p>
        </div>

        <form on:submit|preventDefault={handleForgotPassword}>
            <div class="form-group">
                <Input
                    type="email"
                    id="email"
                    label="E-mail"
                    bind:value={email}
                    placeholder="Digite seu e-mail"
                    error={errorMessage}
                    required
                    disabled={loading}
                    autocomplete="email"
                />
            </div>

            <div class="button-group">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!email || loading}
                    {loading}
                >
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
            </div>
        </form>

        <div class="back-to-login">
            <a href="/login">Voltar para o login</a>
        </div>
    </Container>
{/if}

{#if loading}
    <LoadingSpinner
        overlay={true}
        message="Enviando e-mail de recuperação..."
    />
{/if}

{#if showToast}
    <Toast
        type={toastType}
        title={toastType === "success" ? "Sucesso!" : "Erro!"}
        message={toastMessage}
        on:dismiss={() => (showToast = false)}
    />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100vh;
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
        min-height: 100vh;
        padding: 2rem;
        box-sizing: border-box;
    }

    .header {
        text-align: left;
        margin-bottom: 2rem;
    }

    .header h1 {
        color: #1f2937;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        margin: 0 0 0.75rem 0;
    }

    .subtitle {
        color: #4a5568;
        font-size: 1rem;
        margin: 0;
        line-height: 1.4;
        opacity: 0.9;
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    .button-group {
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }

    .button-group :global(button) {
        width: 100%;
        max-width: none;
    }

    .back-to-login {
        text-align: left;
        margin-top: 1rem;
        width: 100%;
    }

    .back-to-login a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        padding: 0.5rem;
        border-radius: 6px;
        display: inline-block;
        text-align: left;
    }

    .back-to-login a:hover {
        color: #5a67d8;
        background: rgba(102, 126, 234, 0.1);
        text-decoration: none;
        transform: translateY(-1px);
    }

    /* Success State Styles */
    .success-container {
        text-align: left;
        padding: 0.5rem;
    }

    .success-icon {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: linear-gradient(135deg, #48bb78 0%, #38b2ac 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.25rem;
        font-weight: bold;
        margin: 0 0 1.5rem 0;
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
        margin: 0 0 0.75rem 0;
    }

    .success-message {
        color: #4a5568;
        font-size: 1.1rem;
        margin: 0 0 0.75rem 0;
        line-height: 1.4;
    }

    .instructions {
        color: #718096;
        font-size: 0.95rem;
        margin: 0 0 2rem 0;
        line-height: 1.5;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
        width: 100%;
    }

    .actions :global(button) {
        width: 100%;
        max-width: none;
    }

    .back-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-align: left;
    }

    .back-link:hover {
        color: #5a67d8;
        background: rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        :global(main) {
            padding: 0;
            align-items: stretch;
            min-height: 100vh;
        }

        :global(.container) {
            max-width: 100% !important;
            width: 100%;
            height: 100vh;
            border-radius: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            padding-top: 2rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.875rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-size: 0.95rem;
        }

        .success-container h1 {
            font-size: 1.875rem;
            margin-bottom: 0.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .button-group :global(button) {
            width: 100%;
            max-width: none;
        }

        .back-to-login {
            margin-top: 1rem;
        }

        .back-to-login a {
            font-size: 0.95rem;
            padding: 0.75rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            width: auto;
            max-width: none;
            margin: 0;
        }

        .actions :global(button) {
            width: 100%;
            max-width: none;
        }
    }

    @media (max-width: 640px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 1.5rem 1.25rem 2rem 1.25rem;
            justify-content: flex-start;
            padding-top: 1.5rem;
        }

        .header {
            margin-bottom: 1.5rem;
        }

        .header h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-size: 0.9rem;
        }

        .success-container h1 {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
            margin-bottom: 1.25rem;
        }

        .actions {
            gap: 0.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
            margin-bottom: 1.25rem;
        }

        .button-group :global(button) {
            width: 100%;
            max-width: none;
        }

        .back-to-login {
            margin-top: 0.75rem;
        }

        .back-to-login a {
            font-size: 0.95rem;
            padding: 0.75rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            width: auto;
            max-width: none;
            margin: 0;
        }

        .actions :global(button) {
            width: 100%;
            max-width: none;
        }
    }

    @media (max-width: 480px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 1.25rem 1rem 1.5rem 1rem;
            justify-content: flex-start;
            padding-top: 1rem;
        }

        .header {
            margin-bottom: 1.25rem;
        }

        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-size: 0.875rem;
        }

        .success-container h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .success-icon {
            width: 50px;
            height: 50px;
            font-size: 1.75rem;
            margin-bottom: 1rem;
        }

        .success-message {
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }

        .instructions {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 0.875rem;
        }

        .button-group {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        .button-group :global(button) {
            max-width: none;
        }

        .back-to-login {
            margin-top: 0.75rem;
        }

        .back-to-login a {
            font-size: 0.9rem;
            max-width: none;
        }

        .actions :global(button) {
            max-width: none;
        }
    }

    @media (max-width: 360px) {
        :global(main) {
            padding: 0;
        }

        :global(.container) {
            padding: 1rem 0.75rem 1rem 0.75rem;
            justify-content: flex-start;
            padding-top: 0.75rem;
        }

        .header {
            margin-bottom: 1rem;
        }

        .header h1 {
            font-size: 1.375rem;
            margin-bottom: 0.5rem;
        }

        .success-container h1 {
            font-size: 1.375rem;
            margin-bottom: 0.5rem;
        }

        .form-group {
            margin-bottom: 0.75rem;
        }

        .button-group {
            margin-top: 0.875rem;
            margin-bottom: 0.875rem;
        }

        .back-to-login {
            margin-top: 0.5rem;
        }
    }

    /* Landscape phones */
    @media (max-height: 640px) and (orientation: landscape) {
        :global(main) {
            align-items: stretch;
            padding: 0;
        }

        :global(.container) {
            height: 100vh;
            border-radius: 0;
            justify-content: flex-start;
            padding-top: 1rem;
        }

        .header {
            margin-bottom: 1rem;
        }

        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .form-group {
            margin-bottom: 0.75rem;
        }

        .button-group {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        .back-to-login {
            margin-top: 0.5rem;
        }

        .success-container {
            padding: 0.25rem;
        }

        .success-icon {
            width: 50px;
            height: 50px;
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
        }

        .instructions {
            margin-bottom: 1rem;
        }
    }

    /* Very small screens / older phones */
    @media (max-width: 320px) {
        :global(.container) {
            padding: 0.75rem 0.5rem 0.75rem 0.5rem;
            padding-top: 0.5rem;
        }

        .header h1 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }

        .success-container h1 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }

        .subtitle,
        .success-message,
        .instructions {
            font-size: 0.825rem;
        }

        .back-to-login a {
            font-size: 0.85rem;
        }
    }
</style>
