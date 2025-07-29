<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import Input from "$lib/components/Input.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import BackButton from "$lib/components/BackButton.svelte";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { logger } from "$lib/utils/logger";
    import { currentUser } from "$lib/utils/auth";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let email = "";
    let password = "";
    let loading = false;
    let checkingSession = true; // New state for initial session check
    let errorMessage = "";

    onMount(() => {
        // Check if we're already logged in
        const unsubscribe = currentUser.subscribe((user) => {
            // Only stop checking when we get a definitive answer (user or null)
            // and the auth system has been initialized
            if (user !== undefined) {
                if (user) {
                    logger.info("User already logged in, redirecting...");
                    // redirect to aluno home or professor home
                    if (user.tipo === "aluno") {
                        goto("/aluno");
                    } else {
                        goto("/professor/turmas");
                    }
                } else {
                    logger.info("User not logged in, showing login form");
                }
                checkingSession = false;
            }
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
    <LoadingSpinner
        size="lg"
        color="primary"
        message="Verificando sessão..."
        overlay={true}
    />
{:else}
    <PageHeader title="Login" backUrl="/" />

    {#if errorMessage}
        <div class="error-message">
            {errorMessage}
        </div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
            <Input
                type="email"
                id="email"
                label="Email"
                bind:value={email}
                placeholder="seu@email.com"
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
                placeholder="Digite sua senha"
                required
                disabled={loading}
                autocomplete="current-password"
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
                {loading ? "Entrando..." : "Entrar com Google"}
            </Button>
        </div>
    </form>

    <div class="links">
        <a href="/register">Criar conta</a>
        <a href="/forgot-password">Esqueceu a senha?</a>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100dvh;
        background: var(--color-bg-gradient);
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
        width: 100%;
    }

    .login-container {
        width: 100%;
        max-width: 420px;
        background: #fff; /* Match main-card */
        border-radius: 20px; /* Match main-card */
        padding: 2rem; /* Match main-card */
        box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.08),
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 3px 8px rgba(0, 0, 0, 0.04); /* Match main-card */
        border: none;
        transition: all 0.3s ease;
        /* Remove glass effect */
        backdrop-filter: none;
    }

    .login-container :global(.back-btn) {
        margin-bottom: 1.5rem;
    }

    .login-container:hover {
        box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.12),
            0 15px 30px rgba(0, 0, 0, 0.08),
            0 8px 15px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
    }

    h1 {
        text-align: center;
        margin-bottom: 2.5rem;
        color: var(--color-text-primary);
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.025em;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 2rem;
        align-items: center;
        width: 100%;
    }

    .button-group :global(button) {
        width: 100%;
        max-width: 300px;
    }

    .links {
        margin-top: 2rem;
        text-align: center;
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .links a {
        color: var(--color-nature-main);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        padding: 0.5rem;
        border-radius: 6px;
        text-align: center;
    }

    .links a:hover {
        color: var(--color-nature-light);
        background: var(--color-nature-background);
        text-decoration: none;
        transform: translateY(-1px);
    }

    .error-message {
        background: var(--color-error-background);
        color: var(--color-error-dark);
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        border: 1px solid var(--color-error-border);
        font-weight: 500;
        box-shadow: 0 4px 12px var(--color-shadow-error);
        text-align: center;
    }

    .google-icon {
        display: flex;
        align-items: center;
    }

    /* Mobile Responsivity */
    @media (max-width: 640px) {
        :global(main) {
            padding: 0;
            align-items: center;
            min-height: 100dvh;
            justify-content: center;
        }

        .login-container {
            max-width: 100%;
            width: 100%;
            height: 100dvh;
            padding: 1.5rem 1.5rem; /* Increased left/right padding for mobile */
            border-radius: 12px;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #fff;
            box-shadow:
                0 8px 20px rgba(0, 0, 0, 0.06),
                0 3px 8px rgba(0, 0, 0, 0.04);
        }
        .login-container:hover {
            transform: none;
            box-shadow:
                0 15px 30px rgba(0, 0, 0, 0.08),
                0 8px 15px rgba(0, 0, 0, 0.06);
        }

        h1 {
            font-size: 1.75rem;
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }

        .button-group {
            margin-top: 1.5rem;
            gap: 0.875rem;
            width: 100%;
        }

        .button-group :global(button) {
            width: 100%;
            max-width: 300px;
        }

        .links {
            margin-top: 1.5rem;
            flex-direction: column;
            gap: 0.75rem;
            text-align: center;
            width: 100%;
        }

        .links a {
            font-size: 0.95rem;
            padding: 0.75rem;
            display: block;
            text-align: center;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
        }

        .error-message {
            padding: 0.875rem;
            font-size: 0.9rem;
            margin-bottom: 1.25rem;
        }
    }

    @media (max-width: 480px) {
        :global(main) {
            padding: 0;
        }

        .login-container {
            padding: 1rem 1rem; /* Increased left/right padding for smaller mobile */
            border-radius: 12px;
            width: 80%;
            height: fit-content;
        }

        h1 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
            gap: 0.75rem;
        }

        .button-group :global(button) {
            max-width: 100%;
        }

        .links {
            margin-top: 1.25rem;
        }

        .links a {
            max-width: 100%;
        }
    }

    /* Landscape phones */
    @media (max-height: 640px) and (orientation: landscape) {
        :global(main) {
            align-items: stretch;
            padding: 0;
        }

        .login-container {
            height: 100dvh;
            border-radius: 0;
            justify-content: center;
        }

        h1 {
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .button-group {
            margin-top: 1.25rem;
        }

        .links {
            margin-top: 1rem;
        }
    }
</style>
