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
    let toastType: 'success' | 'error' = 'success';

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
            toastType = 'success';
            toastMessage = "E-mail de recuperação enviado com sucesso!";
            showToast = true;
            
            logger.info("Password reset email sent successfully");
            
        } catch (error: any) {
            logger.error("Password reset failed", { error: error.message, email });
            errorMessage = error.message || "Erro ao enviar e-mail de recuperação";
            toastType = 'error';
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

<main>
    <div class="responsive-container forgot-container">
        <div class="header">
            <h1 class="responsive-title">Recuperar Senha</h1>
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
                    loading={loading}
                >
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
            </div>
        </form>

        <div class="back-to-login">
            <a href="/login">Voltar para o login</a>
        </div>
    </div>
</main>

{#if loading}
    <LoadingSpinner overlay={true} text="Enviando e-mail de recuperação..." />
{/if}

{#if showToast}
    <Toast 
        type={toastType}
        title={toastType === 'success' ? 'Sucesso!' : 'Erro!'}
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
    }

    .button-group {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }

    .back-to-login {
        text-align: center;
        margin-top: 1.5rem;
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
    }

    .back-to-login a:hover {
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

    .back-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        padding: 0.5rem 1rem;
        border-radius: 6px;
    }

    .back-link:hover {
        color: #5a67d8;
        background: rgba(102, 126, 234, 0.1);
        transform: translateY(-1px);
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
    }
</style>
