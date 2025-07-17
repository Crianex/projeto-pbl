<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";
    import { currentUser, createOrGetUser } from "$lib/utils/auth";

    onMount(() => {
        logger.info("Auth callback page loaded, waiting for session...");

        // Handle the OAuth callback
        supabase.auth.onAuthStateChange(async (event, session) => {
            logger.info("Auth state changed", { event });

            if (event === "SIGNED_IN" && session) {
                try {
                    const user = await createOrGetUser(session);
                    currentUser.set(user);

                    logger.info(
                        "User signed in and created/retrieved successfully",
                        {
                            userId: user?.id,
                            userType: user?.tipo,
                        },
                    );

                    // Redirect based on user type
                    if (user?.tipo === "professor") {
                        goto("/professor/turmas");
                    } else {
                        goto("/aluno");
                    }
                } catch (error) {
                    logger.error("Failed to create/get user", { error });
                    goto("/login?error=user-creation-failed");
                }
            } else if (event === "SIGNED_OUT") {
                logger.warn("User signed out during callback");
                currentUser.set(null);
                goto("/login");
            }
        });
    });
</script>

<div class="callback-container">
    <p>Processando login...</p>
</div>

<style>
    .callback-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 1.2rem;
        color: #666;
    }
</style>
