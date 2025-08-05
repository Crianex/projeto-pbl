<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";
    import { currentUser, initializeAuth } from "$lib/utils/auth";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Container from "$lib/components/Container.svelte";
    import Toast from "$lib/components/Toast.svelte";

    let loading = true;
    let loadingText = "Processando login...";
    let showError = false;
    let errorMessage = "";

    onMount(() => {
        logger.info("Auth callback page loaded", {
            url: window.location.href,
            searchParams: window.location.search,
            hash: window.location.hash,
        });

        loadingText = "Verificando autenticação...";
        logger.info("Starting authentication verification process");

        // Initialize auth to ensure backend account creation
        initializeAuth().catch((error) => {
            logger.error("Failed to initialize auth", { error });
        });

        // Set a timeout to handle cases where auth doesn't complete
        const timeout = setTimeout(() => {
            if (loading) {
                logger.error("Auth callback timeout - redirecting to login", {
                    timeoutDuration: 15000,
                    currentTime: new Date().toISOString(),
                    url: window.location.href,
                });
                errorMessage =
                    "Tempo limite de autenticação excedido. Redirecionando...";
                showError = true;

                setTimeout(() => {
                    logger.info("Redirecting to login due to timeout");
                    goto("/login");
                }, 2000);
            }
        }, 15000); // 15 second timeout

        // Handle the OAuth callback - only handle redirects, auth state is managed globally
        const unsubscribe = currentUser.subscribe((user) => {
            logger.info("Current user subscription triggered", {
                hasUser: !!user,
                userId: user?.id,
                userType: user?.tipo,
                userEmail: user?.email,
            });

            if (user) {
                logger.info(
                    "User signed in and created/retrieved successfully",
                    {
                        userId: user.id,
                        userType: user.tipo,
                        userEmail: user.email,
                        timestamp: new Date().toISOString(),
                    },
                );

                loadingText = "Login realizado com sucesso! Redirecionando...";
                logger.info("Login successful, preparing redirect", {
                    userType: user.tipo,
                    targetPath:
                        user.tipo === "professor"
                            ? "/professor/turmas"
                            : user.tipo == "coordenador"
                              ? "/coordenador/turmas"
                              : "/aluno",
                });

                // Clear timeout since we succeeded
                clearTimeout(timeout);
                logger.info("Cleared authentication timeout");

                // Add a small delay to show success message
                setTimeout(() => {
                    loading = false;
                    logger.info("Setting loading to false, redirecting user", {
                        userType: user.tipo,
                        targetPath:
                            user.tipo === "professor"
                                ? "/professor/turmas"
                                : user.tipo == "coordenador"
                                  ? "/coordenador/turmas"
                                  : "/aluno",
                    });

                    // Redirect based on user type
                    if (user.tipo === "professor") {
                        logger.info(
                            "Redirecting professor to /professor/turmas",
                        );
                        goto("/professor/turmas");
                    } else if (user.tipo == "coordenador") {
                        logger.info(
                            "Redirecting student to /coordenador/turmas",
                        );
                        goto("/coordenador/turmas");
                    } else {
                        logger.info("Redirecting student to /aluno");
                        goto("/aluno");
                    }
                }, 1500);
            } else {
                logger.info(
                    "No user found in currentUser subscription - this might be normal during auth initialization",
                );
            }
        });

        // Handle auth errors
        supabase.auth.onAuthStateChange((event, session) => {
            logger.info("Supabase auth state change", {
                event: event,
                hasSession: !!session,
                sessionUserId: session?.user?.id,
                timestamp: new Date().toISOString(),
            });

            if (event === "SIGNED_IN") {
                logger.info(
                    "User signed in event received - backend account creation will be triggered",
                );
                loadingText = "Configurando conta...";
            } else if (event === "SIGNED_OUT") {
                logger.warn("User signed out event received", {
                    wasLoading: loading,
                    timestamp: new Date().toISOString(),
                });

                if (loading) {
                    logger.error("Auth callback failed - user signed out", {
                        event: event,
                        hasSession: !!session,
                        timestamp: new Date().toISOString(),
                    });
                    errorMessage = "Falha na autenticação. Redirecionando...";
                    showError = true;
                    loading = false;

                    setTimeout(() => {
                        logger.info("Redirecting to login due to sign out");
                        goto("/login");
                    }, 2000);
                }
            } else {
                logger.info("Other auth state change", {
                    event: event,
                    hasSession: !!session,
                });
            }
        });

        // Log initial auth state
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                logger.error("Error getting initial session", { error });
            } else {
                logger.info("Initial session check", {
                    hasSession: !!data.session,
                    sessionUserId: data.session?.user?.id,
                    sessionEmail: data.session?.user?.email,
                });
            }
        });

        return () => {
            logger.info("Cleaning up auth callback page");
            unsubscribe();
            clearTimeout(timeout);
        };
    });
</script>

{#if loading}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="callback-container">
            <LoadingSpinner size="lg" color="nature" message={loadingText} />

            <div class="progress-steps">
                <div
                    class="step"
                    class:active={loadingText.includes("Verificando")}
                >
                    <div class="step-icon">1</div>
                    <span>Verificando dados</span>
                </div>
                <div
                    class="step"
                    class:active={loadingText.includes("Configurando")}
                >
                    <div class="step-icon">2</div>
                    <span>Configurando conta</span>
                </div>
                <div
                    class="step"
                    class:active={loadingText.includes("sucesso")}
                >
                    <div class="step-icon">3</div>
                    <span>Redirecionando</span>
                </div>
            </div>
        </div>
    </Container>
{:else}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="success-container">
            <div class="success-icon">✓</div>
            <h1>Login Realizado!</h1>
            <p>Redirecionando você agora...</p>
        </div>
    </Container>
{/if}

{#if showError}
    <Toast
        type="error"
        title="Erro de Autenticação"
        message={errorMessage}
        persistent={true}
    />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100dvh;
        background: linear-gradient(
            135deg,
            var(--color-nature-background-light, #e3fbec) 0%,
            var(--color-bg-white, #ffffff) 50%,
            var(--color-bg-light, #f8f9fa) 100%
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

    .callback-container {
        text-align: center;
        padding: 2rem;
    }

    .progress-steps {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        opacity: 0.4;
        transition: all 0.3s ease;
    }

    .step.active {
        opacity: 1;
        transform: scale(1.05);
    }

    .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(
            135deg,
            var(--color-nature-background, #e3fbec) 0%,
            var(--color-nature-light, #22c55e) 100%
        );
        color: var(--color-nature-dark, #014619);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .step.active .step-icon {
        background: var(
            --color-nature-gradient,
            linear-gradient(135deg, #168f41 0%, #22c55e 100%)
        );
        color: white;
        border-color: rgba(34, 197, 94, 0.3);
        box-shadow:
            0 8px 20px rgba(34, 197, 94, 0.18),
            0 4px 12px rgba(34, 197, 94, 0.12);
    }

    .step span {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-nature-dark, #014619);
        text-align: center;
    }

    .step.active span {
        color: var(--color-nature-main, #168f41);
        font-weight: 600;
    }

    /* Success State */
    .success-container {
        text-align: center;
        padding: 2rem;
    }

    .success-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(
            --color-nature-gradient,
            linear-gradient(135deg, #168f41 0%, #22c55e 100%)
        );
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: bold;
        margin: 0 auto 2rem auto;
        box-shadow:
            0 15px 35px rgba(34, 197, 94, 0.18),
            0 8px 20px rgba(34, 197, 94, 0.12);
        animation: successBounce 0.6s ease-out;
    }

    @keyframes successBounce {
        0% {
            transform: scale(0.3);
            opacity: 0;
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .success-container h1 {
        color: var(--color-nature-main, #168f41);
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
    }

    .success-container p {
        color: var(--color-nature-dark, #014619);
        font-size: 1.1rem;
        margin: 0;
        opacity: 0.9;
    }

    /* Responsive Design */
    @media (max-width: 640px) {
        :global(main) {
            padding: 1rem;
        }

        .callback-container {
            padding: 1.5rem;
        }

        .progress-steps {
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .step-icon {
            width: 35px;
            height: 35px;
            font-size: 0.9rem;
        }

        .step span {
            font-size: 0.8rem;
        }

        .success-container h1 {
            font-size: 1.75rem;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
        }
    }
</style>
