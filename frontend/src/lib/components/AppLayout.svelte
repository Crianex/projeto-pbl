<script lang="ts">
    import { page } from "$app/stores";
    import { logout } from "$lib/utils/auth";
    import { logger } from "$lib/utils/logger";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { goto } from "$app/navigation";

    export let userType: "aluno" | "professor" = "aluno";

    let sidebarOpen = false;
    let isMobile = false;

    onMount(() => {
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    });

    function checkMobile() {
        isMobile = window.innerWidth < 768;
        if (!isMobile && !sidebarOpen) {
            sidebarOpen = true;
        }
    }

    async function handleLogout() {
        try {
            await logout();
            // O redirecionamento já é feito pela função logout()
        } catch (error) {
            logger.error("Erro durante logout:", error);
            console.error("Erro durante logout:", error);
        }
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    function closeSidebar() {
        if (isMobile) {
            sidebarOpen = false;
        }
    }

    // Navigation items based on user type
    $: navItems =
        userType === "aluno"
            ? [
                  {
                      href: "/aluno/problemas",
                      icon: `<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>`,
                      text: "Problemas",
                      active: $page.url.pathname === "/aluno/problemas",
                  },
                  {
                      href: "/aluno/perfil",
                      icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`,
                      text: "Perfil",
                      active: $page.url.pathname === "/aluno/perfil",
                  },
              ]
            : [
                  {
                      href: "/professor/relatorios",
                      icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />`,
                      text: "Relatórios",
                      active: $page.url.pathname.includes("/relatorios"),
                  },
                  {
                      href: "/professor/turmas",
                      icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />`,
                      text: "Turmas",
                      active: $page.url.pathname.includes("/turmas"),
                  },
                  {
                      href: "/professor/perfil",
                      icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`,
                      text: "Perfil",
                      active: $page.url.pathname.includes("/perfil"),
                  },
              ];
</script>

<div class="layout">
    <!-- Mobile menu button -->
    <button
        class="mobile-menu-btn"
        class:visible={isMobile}
        on:click={toggleSidebar}
        transition:fade
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>

    <!-- Sidebar overlay for mobile -->
    {#if sidebarOpen && isMobile}
        <div
            class="sidebar-overlay"
            on:click={closeSidebar}
            transition:fade={{ duration: 200 }}
        ></div>
    {/if}

    <aside
        class="sidebar"
        class:open={sidebarOpen}
        class:mobile={isMobile}
        transition:fly={{ x: -300, duration: 300 }}
    >
        <div class="sidebar-content">
            <nav>
                {#each navItems as item}
                    <a
                        href={item.href}
                        class:active={item.active}
                        on:click={closeSidebar}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            {@html item.icon}
                        </svg>
                        {item.text}
                    </a>
                {/each}
            </nav>
            <div class="logout">
                <button on:click={handleLogout}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sair
                </button>
            </div>
        </div>
    </aside>

    <main class="main-content">
        <slot />
    </main>
</div>

<style>
    .layout {
        display: flex;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }

    .mobile-menu-btn {
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1001;
        background: var(--color-layout-sidebar-bg);
        border: 1px solid var(--color-layout-sidebar-border);
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        color: var(--color-layout-sidebar-text);
        box-shadow: 0 2px 4px var(--color-shadow-main);
        transition: all 0.2s ease;
    }

    .mobile-menu-btn.visible {
        display: block;
    }

    .mobile-menu-btn:hover {
        background: var(--color-layout-sidebar-hover);
        color: var(--color-layout-sidebar-active);
    }

    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-layout-overlay);
        z-index: 999;
    }

    .sidebar {
        width: 250px;
        background-color: var(--color-layout-sidebar-bg);
        border-right: 1px solid var(--color-layout-sidebar-border);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow-y: auto;
        z-index: 1000;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        box-sizing: border-box;
    }

    .sidebar-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 0;
    }

    .sidebar.mobile {
        transform: translateX(-100%);
    }

    .sidebar.mobile.open {
        transform: translateX(0);
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        overflow-y: auto;
        margin-bottom: 1rem;
    }

    nav a,
    .logout button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: var(--color-layout-sidebar-text);
        text-decoration: none;
        border-radius: 6px;
        transition:
            background-color 0.2s,
            color 0.2s;
        white-space: nowrap;
    }

    nav a:hover,
    .logout button:hover {
        background-color: var(--color-layout-sidebar-hover);
        color: var(--color-layout-sidebar-active);
    }

    .active {
        background-color: var(--color-layout-sidebar-hover);
        color: var(--color-layout-sidebar-active);
        font-weight: 500;
    }

    .logout {
        flex-shrink: 0;
        margin-top: auto;
    }

    .logout button {
        width: 100%;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--color-layout-logout);
    }

    .main-content {
        flex: 1;
        background-color: var(--color-bg-white);
        overflow-y: auto;
        height: 100vh;
        margin-left: 250px;
    }

    @media (max-width: 768px) {
        .main-content {
            margin-left: 0;
            padding-top: 4rem;
        }

        .sidebar {
            width: 280px;
            padding: 1.5rem 0.75rem;
        }

        nav a,
        .logout button {
            padding: 1rem 0.75rem;
            font-size: 1rem;
        }

        .mobile-menu-btn {
            top: 0.75rem;
            left: 0.75rem;
            padding: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .main-content {
            padding-top: 3.5rem;
        }

        .sidebar {
            width: 100%;
            padding: 1rem 0.5rem;
        }

        nav a,
        .logout button {
            padding: 1.25rem 1rem;
            font-size: 1.1rem;
        }

        .mobile-menu-btn {
            top: 0.5rem;
            left: 0.5rem;
            padding: 0.875rem;
        }
    }
</style>
