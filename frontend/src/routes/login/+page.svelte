<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { logger } from "$lib/utils/logger";
    import { currentUser } from "$lib/utils/auth";

    let email = "";
    let password = "";
    let loading = false;
    let checkingSession = true; // New state for initial session check
    let errorMessage = "";

    onMount(() => {
        // Check if we're already logged in
        const unsubscribe = currentUser.subscribe((user) => {
            if (user) {
                logger.info("User already logged in, redirecting...");
                // redirect to aluno home or professor home
                if (user.tipo === "aluno") {
                    goto("/aluno");
                } else {
                    goto("/professor/turmas");
                }
            }
            checkingSession = false;
        });

        return () => {
            unsubscribe();
        };
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

            // Auth state change will handle the rest
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

            // Auth state change will handle the rest
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
        <h1>Login</h1>

        {#if errorMessage}
            <div class="error-message">
                {errorMessage}
            </div>
        {/if}

        <form on:submit|preventDefault={handleLogin}>
            <div class="form-group">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    required
                    disabled={loading}
                />
            </div>

            <div class="form-group">
                <label for="password">Senha</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    disabled={loading}
                />
            </div>

            <div class="button-group">
                <Button
                    type="submit"
                    disabled={loading}
                    {loading}
                    variant="primary"
                >
                    {loading ? "Entrando..." : "Entrar"}
                </Button>

                <Button
                    type="button"
                    on:click={handleGoogleLogin}
                    disabled={loading}
                    {loading}
                    variant="secondary"
                >
                    {loading ? "Entrando..." : "Entrar com Google"}
                </Button>
            </div>
        </form>

        <div class="links">
            <a href="/register">Criar conta</a>
            <a href="/forgot-password">Esqueceu a senha?</a>
        </div>
    </div>
{/if}

<style>
    .login-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h1 {
        text-align: center;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .links {
        margin-top: 1.5rem;
        text-align: center;
        display: flex;
        justify-content: space-between;
    }

    .links a {
        color: #666;
        text-decoration: none;
    }

    .links a:hover {
        text-decoration: underline;
    }

    .error-message {
        background-color: #fee;
        color: #c00;
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }

    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
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
</style>
