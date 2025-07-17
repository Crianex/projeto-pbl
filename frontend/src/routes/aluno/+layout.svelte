<script lang="ts">
    import { page } from "$app/stores";
    import { logout } from "$lib/utils/auth";
    import { logger } from "$lib/utils/logger";

    let sidebarOpen = false;

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
        sidebarOpen = false;
    }
</script>

<div class="layout">
    <!-- Mobile menu button -->
    <button class="mobile-menu-btn" on:click={toggleSidebar}>
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
    {#if sidebarOpen}
        <div class="sidebar-overlay" on:click={closeSidebar}></div>
    {/if}

    <aside class="sidebar" class:open={sidebarOpen}>
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
                Problemas
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
                Avaliações
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
                Notas
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
                Perfil
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
    </aside>
    <main>
        <slot />
    </main>
</div>

<style>
    .layout {
        display: flex;
        min-height: 100vh;
        width: 100%;
        position: relative;
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

    .mobile-menu-btn:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    }

    .sidebar {
        width: 250px;
        background: rgba(248, 249, 250, 0.95);
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(233, 236, 239, 0.8);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
        transition: transform 0.3s ease;
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    nav a,
    .logout button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        color: #495057;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.2s ease;
        font-weight: 500;
        border: 1px solid transparent;
    }

    nav a:hover,
    .logout button:hover {
        background: rgba(255, 255, 255, 0.8);
        color: #212529;
        border-color: rgba(233, 236, 239, 0.5);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .active:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        color: white;
        transform: translateX(2px);
    }

    .logout {
        margin-top: auto;
    }

    .logout button {
        width: 100%;
        border: none;
        background: none;
        cursor: pointer;
        color: #dc3545;
        margin-top: 1rem;
    }

    .logout button:hover {
        background: rgba(220, 53, 69, 0.1);
        color: #c82333;
        border-color: rgba(220, 53, 69, 0.2);
    }

    main {
        flex: 1;
        min-width: 0; /* Fix overflow issues */
        overflow-x: hidden;
        max-width: calc(100vw - 250px);
    }

    /* Large screens optimization */
    @media (min-width: 1200px) {
        .sidebar {
            width: 280px;
            padding: 3rem 1.5rem;
        }
        
        nav a,
        .logout button {
            padding: 1rem 1.25rem;
            font-size: 1rem;
        }
        
        main {
            max-width: calc(100vw - 280px);
        }
    }

    @media (min-width: 1600px) {
        .sidebar {
            width: 320px;
            padding: 4rem 2rem;
        }
        
        nav a,
        .logout button {
            padding: 1.125rem 1.5rem;
            font-size: 1.05rem;
            gap: 1rem;
        }
        
        main {
            max-width: calc(100vw - 320px);
        }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .mobile-menu-btn {
            display: block;
        }

        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            background: rgba(248, 249, 250, 0.98);
        }

        .sidebar.open {
            transform: translateX(0);
        }

        .sidebar-overlay {
            display: block;
        }

        main {
            padding-top: 4rem; /* Space for mobile menu button */
        }
    }

    @media (max-width: 480px) {
        .sidebar {
            width: 280px;
            padding: 1.5rem 1rem;
        }

        nav a,
        .logout button {
            padding: 1rem;
            font-size: 0.95rem;
        }
    }
</style>
