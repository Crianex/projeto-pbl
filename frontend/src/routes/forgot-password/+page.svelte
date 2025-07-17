<script lang="ts">
    import Button from "$lib/components/Button.svelte";

    let email = "";

    function handleForgotPassword() {
        console.log("Forgot password attempt:", { email });
        // TODO: Implement forgot password logic
    }
</script>

<svelte:head>
    <title>Recuperar Senha</title>
    <meta name="description" content="Página de recuperação de senha" />
</svelte:head>

<div class="forgot-password-container">
    <div class="forgot-password-card">
        <div class="header">
            <h1>Recuperar Senha</h1>
            <p class="subtitle">
                Digite seu e-mail para receber um link de recuperação
            </p>
        </div>

        <form on:submit|preventDefault={handleForgotPassword}>
            <div class="form-group">
                <label for="email">E-mail</label>
                <input
                    id="email"
                    type="email"
                    bind:value={email}
                    placeholder="Digite seu e-mail"
                    required
                />
            </div>

            <Button variant="primary" disabled={!email}>
                Enviar link de recuperação
            </Button>
        </form>

        <div class="back-to-login">
            <a href="/login">Voltar para o login</a>
        </div>
    </div>
</div>

<style>
    .forgot-password-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        padding: 2rem;
    }

    .forgot-password-card {
        background: white;
        border-radius: 8px;
        padding: 3rem 2.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }

    .header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 0.5rem 0;
    }

    .subtitle {
        color: #666;
        font-size: 1rem;
        margin: 0;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s;
        box-sizing: border-box;
    }

    .form-group input:focus {
        outline: none;
        border-color: #0f62fe;
        box-shadow: 0 0 0 2px rgba(15, 98, 254, 0.1);
    }

    .form-group input::placeholder {
        color: #999;
    }

    :global(.forgot-password-card .button) {
        width: 100%;
        margin-bottom: 1.5rem;
    }

    .back-to-login {
        text-align: center;
    }

    .back-to-login a {
        color: #0f62fe;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .back-to-login a:hover {
        text-decoration: underline;
    }

    @media (max-width: 480px) {
        .forgot-password-container {
            padding: 1rem;
        }

        .forgot-password-card {
            padding: 2rem 1.5rem;
        }

        .header h1 {
            font-size: 2rem;
        }
    }
</style>
