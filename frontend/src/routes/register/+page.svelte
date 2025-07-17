<script lang="ts">
    import Button from "$lib/components/Button.svelte";

    let email = "";
    let password = "";
    let confirmPassword = "";
    let name = "";

    function handleRegister() {
        console.log("Register attempt:", { email, password, name });
        // TODO: Implement register logic
    }

    function handleGoogleRegister() {
        console.log("Google register attempt");
        // TODO: Implement Google OAuth
    }

    $: passwordsMatch = password === confirmPassword;
    $: formValid =
        email && password && confirmPassword && name && passwordsMatch;
</script>

<svelte:head>
    <title>Register</title>
    <meta name="description" content="Página de registro" />
</svelte:head>

<div class="register-container">
    <div class="register-card">
        <div class="header">
            <h1>Criar Conta</h1>
            <p class="subtitle">Preencha os dados para se registrar</p>
        </div>

        <form on:submit|preventDefault={handleRegister}>
            <div class="form-group">
                <label for="name">Nome completo</label>
                <input
                    id="name"
                    type="text"
                    bind:value={name}
                    placeholder="Digite seu nome"
                    required
                />
            </div>

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

            <div class="form-group">
                <label for="password">Senha</label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="Digite sua senha"
                    required
                />
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirmar senha</label>
                <input
                    id="confirmPassword"
                    type="password"
                    bind:value={confirmPassword}
                    placeholder="Digite sua senha novamente"
                    required
                />
                {#if confirmPassword && !passwordsMatch}
                    <span class="error-message">As senhas não coincidem</span>
                {/if}
            </div>

            <Button variant="primary" disabled={!formValid}>Criar conta</Button>
        </form>

        <div class="divider">
            <span>ou registre-se com:</span>
        </div>

        <button
            class="google-login"
            on:click={handleGoogleRegister}
            type="button"
        >
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
            Google
        </button>

        <div class="login-link">
            <span>Já tem uma conta?</span>
            <a href="/login">Fazer login</a>
        </div>
    </div>
</div>

<style>
    .register-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        padding: 2rem;
    }

    .register-card {
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

    .error-message {
        color: #d32f2f;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        display: block;
    }

    :global(.register-card .button) {
        width: 100%;
        margin-bottom: 1.5rem;
    }

    .divider {
        text-align: center;
        margin: 1.5rem 0;
        position: relative;
    }

    .divider::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e0e0e0;
    }

    .divider span {
        background: white;
        padding: 0 1rem;
        color: #666;
        font-size: 0.9rem;
    }

    .google-login {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        background: white;
        color: #333;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        margin-bottom: 1.5rem;
    }

    .google-login:hover {
        border-color: #ccc;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .login-link {
        text-align: center;
        color: #666;
        font-size: 0.9rem;
    }

    .login-link a {
        color: #0f62fe;
        text-decoration: none;
        margin-left: 0.5rem;
    }

    .login-link a:hover {
        text-decoration: underline;
    }

    @media (max-width: 480px) {
        .register-container {
            padding: 1rem;
        }

        .register-card {
            padding: 2rem 1.5rem;
        }

        .header h1 {
            font-size: 2rem;
        }
    }
</style>
