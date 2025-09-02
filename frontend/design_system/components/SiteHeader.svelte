<script lang="ts">
    import { Button } from "$lib/design_system";
    import { goto } from "$app/navigation";
    import { currentUser, logout } from "$lib/utils/auth";
    import { page } from "$app/stores";

    export let context: "landing" | "download" | "protected" = "landing";
    export let email: string | null = null;

    $: user = $currentUser;
    $: effectiveEmail = email ?? user?.email ?? null;

    // Navigation items for protected pages
    const protectedNavItems = [
        { href: "/home", label: "Dashboard", icon: "�" },
        { href: "/download", label: "Download", icon: "📥" },
    ];

    function onLogin() {
        goto("/login");
    }
    async function onLogout() {
        try {
            await logout();
        } catch (_) {
            // ignore
        }
    }
</script>

<header class="header">
    <div class="header-content">
        <div class="brand">
            <img src="/logo-com-texto.svg" alt="Avali" class="brand-logo-img" />
        </div>

        {#if context === "download"}
            <nav class="nav">
                <a href="/" class="nav-link">Home</a>
                <a href="/#contact" class="nav-link">Contato</a>
                {#if effectiveEmail}
                    <div class="user-menu">
                        <button
                            class="user-trigger"
                            aria-haspopup="true"
                            aria-expanded="false"
                            title={effectiveEmail}
                            aria-label="Abrir menu do usuário"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                class="user-icon"
                            >
                                <path
                                    d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                                />
                            </svg>
                        </button>
                        <div class="menu" role="menu">
                            <div class="menu-item email" aria-disabled="true">
                                {effectiveEmail}
                            </div>
                            <button
                                class="menu-item danger"
                                role="menuitem"
                                on:click={onLogout}>Sair</button
                            >
                        </div>
                    </div>
                {:else}
                    <Button variant="primary" size="sm" on:click={onLogin}
                        >Login</Button
                    >
                {/if}
            </nav>
        {:else if context === "protected"}
            <nav class="nav">
                {#each protectedNavItems as item}
                    <a
                        href={item.href}
                        class="nav-link {$page.url.pathname === item.href
                            ? 'active'
                            : ''}"
                    >
                        {item.label}
                    </a>
                {/each}
                {#if effectiveEmail}
                    <div class="user-menu">
                        <button
                            class="user-trigger"
                            aria-haspopup="true"
                            aria-expanded="false"
                            title={effectiveEmail}
                            aria-label="Abrir menu do usuário"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                class="user-icon"
                            >
                                <path
                                    d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                                />
                            </svg>
                        </button>
                        <div class="menu" role="menu">
                            <div class="menu-item email" aria-disabled="true">
                                {effectiveEmail}
                            </div>
                            <button
                                class="menu-item danger"
                                role="menuitem"
                                on:click={onLogout}>Sair</button
                            >
                        </div>
                    </div>
                {/if}
            </nav>
        {:else}
            <nav class="nav">
                <a href="/" class="nav-link">Home</a>
                <a href="/#pricing" class="nav-link">Preços</a>
                <a href="/#contact" class="nav-link">Contato</a>
                {#if effectiveEmail}
                    <div class="user-menu">
                        <button
                            class="user-trigger"
                            aria-haspopup="true"
                            aria-expanded="false"
                            title={effectiveEmail}
                            aria-label="Abrir menu do usuário"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                class="user-icon"
                            >
                                <path
                                    d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                                />
                            </svg>
                        </button>
                        <div class="menu" role="menu">
                            <div class="menu-item email" aria-disabled="true">
                                {effectiveEmail}
                            </div>
                            <button
                                class="menu-item danger"
                                role="menuitem"
                                on:click={onLogout}>Sair</button
                            >
                        </div>
                    </div>
                {:else}
                    <Button variant="primary" size="sm" on:click={onLogin}
                        >Login</Button
                    >
                {/if}
            </nav>
        {/if}
    </div>
</header>

<style>
    .header {
        width: 100%;
        padding: 0.75rem 0;
        box-sizing: border-box;
        background: var(--color-glass-white);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--color-nature-background-light);
        position: sticky;
        top: 0;
        z-index: 10;
    }
    .header-content {
        margin: 0 auto;
        padding: 0 2rem;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .brand-logo-img {
        height: 28px;
        display: block;
    }
    .nav {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .nav-link {
        color: var(--color-nature-dark);
        text-decoration: none;
        font-weight: 500;
    }
    .nav-link:hover {
        text-decoration: underline;
    }
    .nav-link.active {
        color: var(--color-nature-main);
        font-weight: 600;
    }
    /* .user-email removed: replaced by avatar + menu */

    /* User menu */
    .user-menu {
        position: relative;
    }
    .user-trigger {
        display: inline-grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 1px solid var(--color-border-light);
        background: var(--color-text-white);
        color: var(--color-font-body-dark);
        cursor: pointer;
        transition:
            box-shadow 0.2s ease,
            transform 0.2s ease,
            background 0.2s ease;
    }
    .user-trigger:hover {
        background: var(--color-nature-background-light);
        transform: translateY(-1px);
    }
    .user-icon {
        width: 20px;
        height: 20px;
    }
    .menu {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 220px;
        background: var(--color-text-white);
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        padding: 0.35rem;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-6px);
        transition:
            opacity 0.15s ease,
            transform 0.15s ease;
        z-index: 20;
    }
    .user-menu:hover .menu,
    .user-menu:focus-within .menu {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
    .menu-item {
        width: 100%;
        text-align: left;
        padding: 0.6rem 0.7rem;
        border-radius: 8px;
        color: var(--color-font-body-dark);
        background: transparent;
        border: none;
        cursor: default;
        font-size: 0.95rem;
    }
    .menu-item.email {
        opacity: 0.85;
        cursor: default;
    }
    .menu-item.danger {
        cursor: pointer;
        color: var(--color-nature-dark);
        font-weight: 700;
    }
    .menu-item.danger:hover {
        background: var(--color-nature-background-light);
    }

    @media (min-width: 1024px) {
        .header-content {
            max-width: none;
            width: 100%;
            margin: 0;
        }
    }
</style>
