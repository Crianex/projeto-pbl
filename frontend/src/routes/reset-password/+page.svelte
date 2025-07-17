<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import { page } from "$app/stores";

    let password = "";
    let confirmPassword = "";
    let token = "";

    // Get the token from the URL query parameter
    $: token = $page.url.searchParams.get("token") || "";

    function handleResetPassword() {
        if (password !== confirmPassword) {
            console.error("Passwords don't match");
            return;
        }
        console.log("Reset password attempt:", { token, password });
        // TODO: Implement password reset logic
    }
</script>

<svelte:head>
    <title>Redefinir Senha</title>
    <meta name="description" content="Página de redefinição de senha" />
</svelte:head>

<div class="reset-password-container">
    <div class="reset-password-card">
        <div class="header">
            <h1>Nova Senha</h1>
            <p class="subtitle">Digite sua nova senha</p>
        </div>

        <form on:submit|preventDefault={handleResetPassword}>
            <div class="form-group">
                <label for="password">Nova senha</label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="Digite sua nova senha"
                    required
                />
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirme a nova senha</label>
                <input
                    id="confirmPassword"
                    type="password"
                    bind:value={confirmPassword}
                    placeholder="Digite novamente sua nova senha"
                    required
                />
            </div>

            <Button
                variant="primary"
                disabled={!password ||
                    !confirmPassword ||
                    password !== confirmPassword ||
                    !token}
            >
                Redefinir senha
            </Button>
        </form>

        <div class="back-to-login">
            <a href="/login">Voltar para o login</a>
        </div>
    </div>
</div>

<style>
    .reset-password-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        padding: 2rem;
    }

    .reset-password-card {
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

    :global(.reset-password-card .button) {
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
        .reset-password-container {
            padding: 1rem;
        }

        .reset-password-card {
            padding: 2rem 1.5rem;
        }

        .header h1 {
            font-size: 2rem;
        }
    }
</style>
