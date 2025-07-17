<script lang="ts">
    import { page } from "$app/stores";
</script>

<div class="layout">
    <aside class="sidebar">
        <nav>
            <a
                href="/aluno/problemas"
                class:active={$page.url.pathname === "/aluno/problemas"}
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
