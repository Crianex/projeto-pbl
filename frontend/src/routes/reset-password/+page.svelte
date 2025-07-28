<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Input from "$lib/components/Input.svelte";
    import Container from "$lib/components/Container.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import { page } from "$app/stores";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";
    import { goto } from "$app/navigation";

    let password = "";
    let confirmPassword = "";
    let loading = false;
    let passwordReset = false;
    let errorMessage = "";
    let showToast = false;
    let toastMessage = "";
    let toastType: "success" | "error" = "success";

    // Validation states
    let passwordError = "";
    let confirmPasswordError = "";

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
    $: passwordError = password ? validatePassword(password) : "";
    $: confirmPasswordError =
        confirmPassword && password !== confirmPassword
            ? "Senhas não coincidem"
            : "";

    async function handleResetPassword() {
        if (
            passwordError ||
            confirmPasswordError ||
            !password ||
            !confirmPassword
        ) {
            return;
        }

        loading = true;
        errorMessage = "";

        try {
            logger.info("Attempting password reset");

            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            passwordReset = true;
            toastType = "success";
            toastMessage = "Senha redefinida com sucesso!";
            showToast = true;

            logger.info("Password reset successful");

            // Redirect to login after success
            setTimeout(() => {
                goto("/login");
            }, 3000);
        } catch (error: any) {
            logger.error("Password reset failed", { error: error.message });
            errorMessage = error.message || "Erro ao redefinir senha";
            toastType = "error";
            toastMessage = errorMessage;
            showToast = true;
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Redefinir Senha</title>
    <meta name="description" content="Página de redefinição de senha" />
</svelte:head>

{#if passwordReset}
    <Container
        maxWidth="md"
        glass={true}
        shadow={true}
        needsContainerStyle={true}
    >
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>Senha Redefinida!</h1>
            <p class="success-message">Sua senha foi redefinida com sucesso.</p>
            <p class="instructions">
                Você será redirecionado para a página de login em alguns
                segundos.
            </p>

            <div class="actions">
                <Button variant="primary" on:click={() => goto("/login")}>
                    Ir para o login
                </Button>
            </div>
        </div>
    </Container>
{:else}
    <Container
        maxWidth="md"
        glass={true}
        shadow={true}
        needsContainerStyle={true}
    >
        <div class="header">
            <h1>Nova Senha</h1>
            <p class="subtitle">Digite sua nova senha segura</p>
        </div>

        <form on:submit|preventDefault={handleResetPassword}>
            <div class="form-group">
                <Input
                    type="password"
                    id="password"
                    label="Nova senha"
                    bind:value={password}
                    placeholder="Digite sua nova senha"
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
                    label="Confirme a nova senha"
                    bind:value={confirmPassword}
                    placeholder="Digite novamente sua nova senha"
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
                    disabled={!!passwordError ||
                        !!confirmPasswordError ||
                        !password ||
                        !confirmPassword ||
                        loading}
                    {loading}
                >
                    {loading ? "Redefinindo..." : "Redefinir senha"}
                </Button>
            </div>
        </form>

        <div class="back-to-login">
            <a href="/login">Voltar para o login</a>
        </div>
    </Container>
{/if}

{#if loading}
    <LoadingSpinner message="Redefinindo sua senha..." />
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
        text-align: center;
        margin-bottom: 2.5rem;
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

    .back-to-login {
        text-align: center;
        margin-top: 1.5rem;
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
        text-align: center;
    }

    .back-to-login a:hover {
        color: #5a67d8;
        background: rgba(102, 126, 234, 0.1);
        text-decoration: none;
        transform: translateY(-1px);
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

        .back-to-login {
            margin-top: 1.25rem;
        }

        .back-to-login a {
            font-size: 0.95rem;
            padding: 0.75rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
        }

        .password-strength {
            padding: 0.375rem;
            margin-top: 0.375rem;
        }

        .strength-text {
            font-size: 0.8rem;
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

        .back-to-login {
            margin-top: 1rem;
        }

        .back-to-login a {
            font-size: 0.95rem;
            padding: 0.75rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
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

        .back-to-login {
            margin-top: 0.75rem;
        }

        .back-to-login a {
            font-size: 0.9rem;
            max-width: 100%;
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

        .back-to-login {
            margin-top: 0.75rem;
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

        .back-to-login a {
            font-size: 0.85rem;
        }

        .password-strength {
            padding: 0.25rem;
        }

        .strength-text {
            font-size: 0.75rem;
        }
    }
</style>
