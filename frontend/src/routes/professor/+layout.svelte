<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="layout">
    <aside class="sidebar">
        <nav>
            <a
                href="/professor/relatorios"
                class:active={$page.url.pathname.includes("/relatorios")}
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
                    />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                </svg>
                Relatórios
            </a>
            <a
                href="/professor/turmas"
                class:active={$page.url.pathname.includes("/turmas")}
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Turmas
            </a>
            <a
                href="/professor/perfil"
                class:active={$page.url.pathname.includes("/perfil")}
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
            <button
                on:click={() => {
                    /* TODO: Implement logout */
                }}
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
    }

    .sidebar {
        width: 250px;
        background-color: #f8f9fa;
        border-right: 1px solid #e9ecef;
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
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
        padding: 0.75rem 1rem;
        color: #495057;
        text-decoration: none;
        border-radius: 6px;
        transition:
            background-color 0.2s,
            color 0.2s;
    }

    nav a:hover,
    .logout button:hover {
        background-color: #e9ecef;
        color: #212529;
    }

    .active {
        background-color: #e9ecef;
        color: #212529;
        font-weight: 500;
    }

    .logout button {
        width: 100%;
        border: none;
        background: none;
        cursor: pointer;
        color: #dc3545;
    }

    main {
        flex: 1;
        padding: 2rem;
        background-color: #fff;
    }
</style>
