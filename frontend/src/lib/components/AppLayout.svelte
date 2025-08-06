<script lang="ts">
    import { page } from "$app/stores";
    import { logout } from "$lib/utils/auth";
    import { logger } from "$lib/utils/logger";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { goto } from "$app/navigation";
    import Container from "./Container.svelte";
    import Toast from "./Toast.svelte";
    import { toastStore } from "$lib/utils/toast";

    export let userType: "aluno" | "professor" | "coordenador" | "generic" =
        "aluno";

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
            : userType === "professor"
              ? [
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
                ]
              : userType === "coordenador"
                ? [
                      {
                          href: "/professor/relatorios",
                          icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />`,
                          text: "Relatórios",
                          active: $page.url.pathname.includes("/relatorios"),
                      },
                      {
                          href: "/coordenador/turmas",
                          icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />`,
                          text: "Turmas",
                          active: $page.url.pathname.includes("/turmas"),
                      },
                  ]
                : [];
</script>

<div class="layout">
    {#if userType !== "generic"}
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
    {/if}

    {#if userType !== "generic"}
        <!-- Sidebar overlay for mobile -->
        {#if sidebarOpen && isMobile}
            <div
                class="sidebar-overlay"
                on:click={closeSidebar}
                transition:fade={{ duration: 200 }}
            ></div>
        {/if}

        {#if !isMobile || sidebarOpen}
            <aside
                class="sidebar"
                class:open={sidebarOpen}
                class:mobile={isMobile}
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
                                <path
                                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                                />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Sair
                        </button>
                    </div>
                </div>
            </aside>
        {/if}
    {/if}

    <main
        class="main-content"
        class:sidebar-open={sidebarOpen && isMobile}
        class:generic-layout={userType === "generic"}
        style="margin-left: {userType === 'generic' || isMobile
            ? '0'
            : '250px'};"
    >
        <div
            class="main-card"
            class:generic-card={userType === "generic"}
            style="max-width: {userType === 'generic'
                ? '30rem'
                : isMobile
                  ? '90vw'
                  : '60vw'};"
        >
            <slot />
        </div>
    </main>

    <!-- Global Toast -->
    {#if $toastStore}
        <Toast
            message={$toastStore.message}
            type={$toastStore.type}
            title={$toastStore.title}
            duration={$toastStore.duration}
            dismissible={$toastStore.dismissible}
            persistent={$toastStore.persistent}
            on:close={() => toastStore.hide()}
        />
    {/if}
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
        bottom: 1rem;
        right: 1rem;
        z-index: 1001;
        background: var(--color-layout-sidebar-bg);
        border: 1px solid var(--color-layout-sidebar-border);
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        color: var(--color-layout-sidebar-text);
        box-shadow: 0 2px 4px var(--color-shadow-main);
        transition: all 0.2s ease;
        height: 40px;
        width: 40px;
        align-items: center;
        justify-content: center;
    }

    .mobile-menu-btn.visible {
        display: flex;
    }

    .mobile-menu-btn:hover {
        background: var(--color-layout-sidebar-hover);
        color: var(--color-layout-sidebar-active);
    }

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100dvh;
        min-height: 100dvh;
        overflow: hidden !important;
        overflow-y: hidden !important;
        z-index: 3000;
        box-shadow: 2px 0 16px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 0.98) !important;
        border: none !important;
        padding-bottom: 0 !important;
        transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        width: 250px;
        max-width: 250px;
        height: 100dvh;
        min-height: 100dvh;
        overflow-y: visible;
        padding-left: 1.2rem;
        padding-right: 1.2rem;
        display: block;
        flex-direction: initial;
        align-items: initial;
        transform: translateX(0);
    }
    .sidebar.mobile {
        transform: translateX(-100%);
    }
    .sidebar.mobile.open {
        transform: translateX(0);
    }
    .sidebar-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100dvh;
        padding: 0.5rem 0;
        align-items: flex-start;
    }
    nav {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        flex: 1;
        overflow: visible !important;
        margin-bottom: 1.5rem;
        align-items: flex-start;
        width: 100%;
    }
    nav a {
        display: flex;
        align-items: center;
        gap: 1.1rem;
        padding: 0.9rem 1.2rem;
        color: #222;
        text-decoration: none;
        border-radius: 8px;
        font-size: 1.08rem;
        font-weight: 500;
        transition:
            background 0.12s,
            color 0.12s;
        width: 100%;
        justify-content: flex-start;
        text-align: left;
    }
    nav a.active {
        background: #f3f4f6;
        color: #222;
    }
    nav a:hover {
        background: #f0f0f0;
        color: #111;
    }
    .logout {
        flex-shrink: 0;
        margin-top: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-bottom: 1rem;
        border: none !important;
        background: none !important;
        box-shadow: none !important;
        position: sticky;
        bottom: 0;
    }
    .logout button {
        width: 100%;
        border: none;
        background: none;
        cursor: pointer;
        color: #dc3545;
        padding: 0.9rem 1.2rem;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        gap: 1.1rem;
        border-radius: 8px;
        transition:
            background 0.12s,
            color 0.12s;
        justify-content: flex-start;
        text-align: left;
    }
    .logout button:hover {
        background: #fbe9e7;
        color: #b71c1c;
    }

    .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.55);
        z-index: 2000;
        transition: opacity 0.15s;
    }

    .main-content {
        flex: 1;
        background-color: var(--color-bg-white);
        overflow-y: auto;
        margin-left: 250px;
        display: flex;
        grid-template-columns: 1fr;
        align-items: flex-start;
        justify-content: center;
        transition: all 0.3s ease;
        padding: 2rem;
        height: 100dvh;
        min-height: 100dvh;
        box-sizing: border-box;
    }

    .main-content.generic-layout {
        align-items: center;
    }

    .main-content.sidebar-open {
        pointer-events: none;
        filter: blur(2px) grayscale(0.2);
    }

    .main-card {
        background: #fff;
        border-radius: 20px;
        width: 100%;
        padding: 1rem;
        flex-direction: column;

        box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.08),
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 3px 8px rgba(0, 0, 0, 0.04);
        margin: 0;
        transition: all 0.3s ease;
    }

    .main-card.generic-card {
        margin-top: 5rem;
    }
    .main-card:hover {
        box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.12),
            0 15px 30px rgba(0, 0, 0, 0.08),
            0 8px 15px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
    }
    @media (max-width: 768px) {
        .mobile-menu-btn {
            display: flex;
        }

        .main-card {
            margin: 0;
            padding: 0.5rem;
            max-width: 100vw;
            box-sizing: border-box;
            border-radius: 16px;
            width: 100%;
            text-align: left;
            justify-self: center;
        }
        .layout {
            overflow: visible;
        }
        .sidebar,
        .sidebar-content,
        nav,
        .logout {
            align-items: flex-start;
            text-align: left;
        }
        nav a,
        .logout button {
            justify-content: flex-start;
            text-align: left;
        }
        .sidebar {
            width: 75vw;
            max-width: 300px;
            background: #fff !important;
            overflow: hidden !important;
            overflow-y: hidden !important;
            transform: translateX(-100%);
        }
        .sidebar.open {
            transform: translateX(0);
        }
        .sidebar.mobile {
            width: 75vw;
            max-width: 300px;
            transform: translateX(-100%);
        }
        .sidebar-content {
            gap: 1rem;
            padding: 0.5rem 0;
        }
        nav {
            gap: 0.5rem;
        }
        nav a,
        .logout button {
            padding: 0.75rem 0.5rem;
            font-size: 1rem;
        }
        .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100dvh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
        }
        .main-content {
            padding: 0.8rem;
            margin-left: 0;
            width: 100vw;
            min-width: 0;
            display: grid;
            min-height: 100dvh;
            transition: all 0.3s ease;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            position: relative;
            justify-content: center;
        }

        .main-content.generic-layout {
            align-items: center;
            justify-content: center;
            padding: 0.8rem;
        }
    }
    @media (max-width: 480px) {
        .sidebar {
            width: 75vw;
            max-width: 300px;
            padding: 0.75rem 0.25rem;
        }
        .sidebar.mobile {
            width: 75vw;
            max-width: 300px;
        }
        nav a,
        .logout button {
            padding: 1rem 0.5rem;
            font-size: 1.05rem;
        }
        .sidebar-content,
        nav,
        .logout {
            align-items: flex-start;
            text-align: left;
        }
        nav a,
        .logout button {
            justify-content: flex-start;
            text-align: left;
        }
        .main-content {
            align-items: center;
            justify-content: center;
        }
    }
</style>
