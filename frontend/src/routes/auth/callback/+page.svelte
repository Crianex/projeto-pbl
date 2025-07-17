<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabase";
    import { logger } from "$lib/utils/logger";
    import { currentUser } from "$lib/utils/auth";

    onMount(() => {
        logger.info("Auth callback page loaded, waiting for session...");

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

                // Redirect based on user type
                if (user.tipo === "professor") {
                    goto("/professor/turmas");
                } else {
                    goto("/aluno");
                }
            }
        });

        return () => {
            unsubscribe();
        };
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
