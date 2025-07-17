<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";
    import { currentUser } from "$lib/utils/auth";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import Container from "$lib/components/Container.svelte";
    import Toast from "$lib/components/Toast.svelte";

    let loading = true;
    let loadingText = "Processando login...";
    let showError = false;
    let errorMessage = "";

    onMount(() => {
        logger.info("Auth callback page loaded, waiting for session...");
        loadingText = "Verificando autenticação...";

        // Set a timeout to handle cases where auth doesn't complete
        const timeout = setTimeout(() => {
            if (loading) {
                logger.error("Auth callback timeout - redirecting to login");
                errorMessage = "Tempo limite de autenticação excedido. Redirecionando...";
                showError = true;
                
                setTimeout(() => {
                    goto("/login");
                }, 2000);
            }
        }, 15000); // 15 second timeout

        // Handle the OAuth callback - only handle redirects, auth state is managed globally
        const unsubscribe = currentUser.subscribe((user) => {
            if (user) {
                logger.info(
                    "User signed in and created/retrieved successfully",
                    {
                        userId: user.id,
                        userType: user.tipo,
                    },
                );

                loadingText = "Login realizado com sucesso! Redirecionando...";
                
                // Clear timeout since we succeeded
                clearTimeout(timeout);
                
                // Add a small delay to show success message
                setTimeout(() => {
                    loading = false;
                    
                    // Redirect based on user type
                    if (user.tipo === "professor") {
                        goto("/professor/turmas");
                    } else {
                        goto("/aluno");
                    }
                }, 1500);
            }
        });

        // Handle auth errors
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                loadingText = "Configurando conta...";
            } else if (event === 'SIGNED_OUT') {
                if (loading) {
                    logger.error("Auth callback failed - user signed out");
                    errorMessage = "Falha na autenticação. Redirecionando...";
                    showError = true;
                    loading = false;
                    
                    setTimeout(() => {
                        goto("/login");
                    }, 2000);
                }
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    });
</script>

{#if loading}
    <Container maxWidth="md" glass={true} shadow={true}>
        <div class="callback-container">
            <LoadingSpinner 
                size="lg" 
                color="primary" 
                text={loadingText}
                center={true}
            />
            
            <div class="progress-steps">
                <div class="step active">
                    <div class="step-icon">1</div>
                    <span>Verificando dados</span>
                </div>
                <div class="step" class:active={loadingText.includes('Configurando')}>
                    <div class="step-icon">2</div>
                    <span>Configurando conta</span>
                </div>
                <div class="step" class:active={loadingText.includes('sucesso')}>
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

    .callback-container {
        text-align: center;
        padding: 2rem;
    }

    .progress-steps {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 3rem;
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
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
        color: #4a5568;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .step.active .step-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: rgba(102, 126, 234, 0.3);
        box-shadow: 
            0 8px 20px rgba(102, 126, 234, 0.3),
            0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .step span {
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
        text-align: center;
    }

    .step.active span {
        color: #2d3748;
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
        color: #2d3748;
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
    }

    .success-container p {
        color: #4a5568;
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
