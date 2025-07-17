<script lang="ts">
    import { page } from "$app/stores";
    import { logout } from "$lib/utils/auth";
    import { logger } from "$lib/utils/logger";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";

    let sidebarOpen = false;
    let isMobile = false;

    onMount(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
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
        } catch (error) {
            logger.error('Erro durante logout:', error);
            console.error('Erro durante logout:', error);
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
                <a
                    href="/aluno/problemas"
                    class:active={$page.url.pathname === "/aluno/problemas"}
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
                        <path
                            d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                        ></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <span class="nav-text">Problemas</span>
                </a>
                <a
                    href="/aluno/avaliacoes"
                    class:active={$page.url.pathname === "/aluno/avaliacoes"}
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
                        <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        ></path>
                        <path d="M14 2v6h6"></path>
                        <path d="M16 13H8"></path>
                        <path d="M16 17H8"></path>
                        <path d="M10 9H8"></path>
                    </svg>
                    <span class="nav-text">Avaliações</span>
                </a>
                <a
                    href="/aluno/notas"
                    class:active={$page.url.pathname === "/aluno/notas"}
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
                        <path
                            d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
                        ></path>
                        <line x1="4" y1="22" x2="4" y2="15"></line>
                    </svg>
                    <span class="nav-text">Notas</span>
                </a>
                <a
                    href="/aluno/perfil"
                    class:active={$page.url.pathname === "/aluno/perfil"}
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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span class="nav-text">Perfil</span>
                </a>
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
        <div class="content-wrapper">
            <slot />
        </div>
    </main>
</div>

<style>
    .layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        position: relative;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .mobile-menu-btn {
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1001;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 0.5rem;
        cursor: pointer;
        color: #495057;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .mobile-menu-btn.visible {
        display: block;
    }

    .mobile-menu-btn:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 999;
    }

    .sidebar {
        width: 280px;
        min-width: 280px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(233, 236, 239, 0.8);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
        z-index: 1000;
        height: 100vh;
        position: sticky;
        top: 0;
    }

    .sidebar.mobile {
        position: fixed;
        transform: translateX(-100%);
    }

    .sidebar.mobile.open {
        transform: translateX(0);
    }

    .sidebar-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    nav a,
    .logout button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        color: #495057;
        text-decoration: none;
        border-radius: 12px;
        transition: all 0.3s ease;
        font-weight: 500;
        border: 1px solid transparent;
        position: relative;
        overflow: hidden;
    }

    nav a::before,
    .logout button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
    }

    nav a:hover::before,
    .logout button:hover::before {
        opacity: 0.1;
    }

    nav a:hover,
    .logout button:hover {
        background: rgba(255, 255, 255, 0.8);
        color: #212529;
        border-color: rgba(233, 236, 239, 0.8);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .active:hover {
        transform: translateX(4px) !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-color: transparent !important;
    }

    .main-content {
        flex: 1;
        padding: 2rem;
        overflow-x: hidden;
    }

    .content-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        min-height: calc(100vh - 4rem);
    }

    .logout {
        margin-top: auto;
        padding-top: 2rem;
        border-top: 1px solid rgba(233, 236, 239, 0.8);
    }

    .logout button {
        width: 100%;
        background: transparent;
        cursor: pointer;
    }

    @media (max-width: 768px) {
        .sidebar {
            width: 260px;
            min-width: 260px;
        }

        .main-content {
            padding: 1rem;
            padding-top: 4rem;
        }

        .content-wrapper {
            padding: 1.5rem;
        }

        nav a,
        .logout button {
            padding: 0.875rem;
        }
    }

    @media (max-width: 480px) {
        .main-content {
            padding: 0.75rem;
            padding-top: 4rem;
        }

        .content-wrapper {
            padding: 1rem;
        }
    }
</style>
