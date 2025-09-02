<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabase";

    export let backUrl: string | null = null;
    export let backText: string = "Voltar";
    export let title: string | undefined = undefined;

    export let showNavigation: boolean = false; // Flag to show navigation links

    // Navigation items for protected pages
    const navItems = [{ href: "/download", label: "Download", icon: "📥" }];

    async function handleLogout() {
        await supabase.auth.signOut();
        goto("/login");
    }
</script>

<div class="header">
    {#if showNavigation}
        <!-- Navigation header for protected pages -->
        <div class="nav-header">
            <div class="nav-container">
                <div class="nav-left">
                    <!-- Logo/Brand -->
                    <div class="brand">
                        <h1 class="brand-title">Avali</h1>
                    </div>
                </div>

                <!-- Navigation Links -->
                <nav class="nav-links">
                    {#each navItems as item}
                        <a
                            href={item.href}
                            class="nav-link {$page.url.pathname === item.href
                                ? 'active'
                                : ''}"
                        >
                            <span class="nav-icon">{item.icon}</span>
                            <span class="nav-text">{item.label}</span>
                        </a>
                    {/each}
                </nav>

                <!-- User actions -->
                <div class="nav-right">
                    <button on:click={handleLogout} class="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .header {
        margin: 0;
    }

    /* Navigation header styles */
    .nav-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        margin-bottom: 1rem;
    }

    .nav-container {
        max-width: 80rem;
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 4rem;
    }

    .nav-left {
        display: flex;
        align-items: center;
    }

    .brand-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: #111827;
    }

    .nav-links {
        display: flex;
        gap: 1.5rem;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        transition: all 0.15s ease;
    }

    .nav-link:hover {
        color: #111827;
        background-color: #f3f4f6;
    }

    .nav-link.active {
        color: #4f46e5;
        background-color: #eef2ff;
    }

    .nav-icon {
        font-size: 1rem;
    }

    .nav-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .logout-btn {
        font-size: 0.875rem;
        color: #6b7280;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: color 0.15s ease;
    }

    .logout-btn:hover {
        color: #111827;
    }

    /* Title section styles */
    .title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 1rem;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;
        text-decoration: none;
        font-size: 0.875rem;
    }

    .back-link:hover {
        color: #0d6efd;
    }

    .back-text {
        display: inline;
    }

    h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: #1f2937;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .nav-container {
            padding: 0 0.75rem;
        }

        .nav-links {
            gap: 0.75rem;
        }

        .nav-text {
            display: none;
        }

        .nav-link {
            gap: 0;
            padding: 0.5rem;
        }

        .back-text {
            display: none;
        }

        .back-link {
            gap: 0;
        }

        h1 {
            font-size: 1.3rem;
        }
    }

    @media (max-width: 480px) {
        .nav-container {
            height: 3.5rem;
        }

        .brand-title {
            font-size: 1.1rem;
        }

        .nav-links {
            gap: 0.5rem;
        }

        .nav-link {
            padding: 0.375rem;
        }

        .nav-icon {
            font-size: 0.875rem;
        }

        h1 {
            font-size: 1.1rem;
        }

        .logout-btn {
            font-size: 0.8rem;
        }
    }
</style>
