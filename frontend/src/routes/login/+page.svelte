<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { logger } from "$lib/utils/logger";
    import { currentUser, createOrGetUser } from "$lib/utils/auth";

    let email = "";
    let password = "";
    let loading = false;
    let checkingSession = true; // New state for initial session check
    let errorMessage = "";

    onMount(() => {
        // Check if we're already logged in
        const checkSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session) {
                    logger.info("User already logged in, redirecting...");

                    // redirect to aluno home or professor home
                    if ($currentUser?.tipo === "aluno") {
                        goto("/aluno");
                    } else {
                        goto("/professor/turmas");
                    }
                }
            } catch (error) {
                logger.error("Error checking session:", error);
            } finally {
                checkingSession = false;
            }
        };
        checkSession();
    });

    async function handleLogin() {
        try {
            loading = true;
            errorMessage = "";

            logger.info("Attempting email/password login", { email });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                logger.info("Login successful, fetching user data...");

                try {
                    const user = await createOrGetUser(data.session);
                    currentUser.set(user);

                    logger.info("User data fetched and stored", {
                        userType: user?.tipo,
                    });

                    // redirect based on user type
                    if (user?.tipo === "aluno") {
                        goto("/aluno");
                    } else {
                        goto("/professor/turmas");
                    }
                } catch (userError: any) {
                    logger.error("Failed to fetch user data", {
                        error: userError,
                    });
                    errorMessage =
                        "Failed to fetch user data. Please try again.";
                    // Sign out since we couldn't get user data
                    await supabase.auth.signOut();
                }
            }
        } catch (error: any) {
            logger.error("Login failed", { error: error.message, email });
            errorMessage = error.message || "An error occurred during login";
        } finally {
            loading = false;
        }
    }

    async function handleGoogleLogin() {
        try {
            loading = true;
            errorMessage = "";

            logger.info("Attempting Google OAuth login");

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            // No need to handle user creation here as it will be handled in the callback
            // after successful OAuth redirect
        } catch (error: any) {
            logger.error("Google login failed", { error: error.message });
            errorMessage =
                error.message || "An error occurred during Google login";
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Login</title>
    <meta name="description" content="Página de login" />
</svelte:head>

{#if checkingSession}
    <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Verificando sessão...</p>
    </div>
{:else}
    <div class="login-container">
        <div class="login-card">
            <div class="header">
                <h1>Olá</h1>
                <p class="subtitle">Faça o login para continuar</p>
            </div>

            {#if errorMessage}
                <div class="error-message">
                    {errorMessage}
                </div>
            {/if}

            <form on:submit|preventDefault={handleLogin}>
                <div class="form-group">
                    <label for="email">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="Seu email"
                        required
                        disabled={loading}
                    />
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        bind:value={password}
                        placeholder="Sua senha"
                        required
                        disabled={loading}
                    />
                </div>

                <div class="forgot-password">
                    <a href="/forgot-password">Recuperar senha</a>
                </div>

                <Button
                    variant="primary"
                    disabled={loading || !email || !password}
                >
                    {loading ? "Carregando..." : "Login"}
                </Button>
            </form>

            <div class="divider">
                <span>ou faça login com:</span>
            </div>

            <button
                class="google-login"
                on:click={handleGoogleLogin}
                type="button"
                disabled={loading}
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
                {loading ? "Carregando..." : "Google"}
            </button>

            <div class="create-account">
                <a href="/register">Criar nova conta</a>
            </div>
        </div>
    </div>
{/if}

<style>
    .loading-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0f62fe;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .loading-container p {
        color: #666;
        font-size: 1rem;
        margin: 0;
    }

    .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        padding: 2rem;
    }

    .login-card {
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

    .forgot-password {
        text-align: right;
        margin-bottom: 2rem;
    }

    .forgot-password a {
        color: #0f62fe;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .forgot-password a:hover {
        text-decoration: underline;
    }

    :global(.login-card .button) {
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

    .create-account {
        text-align: center;
    }

    .create-account a {
        color: #0f62fe;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .create-account a:hover {
        text-decoration: underline;
    }

    .error-message {
        background-color: #fde7e7;
        color: #d32f2f;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        text-align: center;
    }

    .google-login:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    @media (max-width: 480px) {
        .login-container {
            padding: 1rem;
        }

        .login-card {
            padding: 2rem 1.5rem;
        }

        .header h1 {
            font-size: 2rem;
        }
    }
</style>
