<script lang="ts">
    import Card from "./Card.svelte";
    export let title: string | null = null;
    export let subtitle: string | null = null;
    export let variant: "centered" | "two-column" = "centered";
    export let error: string | null = null;
    export let fullWidth: boolean = false;
</script>

{#if variant === "two-column"}
    <section class="hero" class:full-width={fullWidth}>
        <Card variant="elevated" padding="lg" {fullWidth}>
            <div class="hero-content">
                <div class="hero-text">
                    {#if title}
                        <h1 class="hero-title">{title}</h1>
                    {:else}
                        <slot name="title" />
                    {/if}
                    {#if subtitle}
                        <p class="hero-description">{subtitle}</p>
                    {:else}
                        <slot name="subtitle" />
                    {/if}
                    <div class="hero-buttons">
                        <slot name="actions" />
                    </div>
                    {#if error}
                        <p class="hero-error">{error}</p>
                    {/if}
                </div>
                {#if $$slots.right}
                    <div class="hero-illustration">
                        <slot name="right" />
                    </div>
                {/if}
            </div>
        </Card>
    </section>
{:else}
    <section class="hero" class:full-width={fullWidth}>
        {#if fullWidth}
            <div class="hero-inner">
                {#if title}
                    <h1 class="hero-title">{title}</h1>
                {:else}
                    <slot name="title" />
                {/if}
                {#if subtitle}
                    <p class="hero-subtitle">{subtitle}</p>
                {:else}
                    <slot name="subtitle" />
                {/if}
                <div class="hero-actions">
                    <slot name="actions" />
                </div>
                <p class="hero-meta"><slot name="meta" /></p>
                {#if error}
                    <p class="hero-error">{error}</p>
                {/if}
            </div>
        {:else}
            <Card variant="elevated" padding="lg">
                <div class="hero-inner">
                    {#if title}
                        <h1 class="hero-title">{title}</h1>
                    {:else}
                        <slot name="title" />
                    {/if}
                    {#if subtitle}
                        <p class="hero-subtitle">{subtitle}</p>
                    {:else}
                        <slot name="subtitle" />
                    {/if}
                    <div class="hero-actions">
                        <slot name="actions" />
                    </div>
                    <p class="hero-meta"><slot name="meta" /></p>
                    {#if error}
                        <p class="hero-error">{error}</p>
                    {/if}
                </div>
            </Card>
        {/if}
    </section>
{/if}

<style>
    .hero {
        display: flex;
        align-items: center;
        padding: 2rem 0 0rem 0;
        position: relative;
        width: 100%;
        justify-content: center;
    }

    .hero-inner {
        max-width: 1100px;
        margin: 0 auto;
        text-align: left;
    }

    .hero-title {
        font-size: 3rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
        color: var(--color-font-heading-dark);
        text-align: left !important;
    }

    .hero-subtitle,
    .hero-description {
        color: var(--color-font-body-dark);
        font-size: 1.2rem;
        line-height: 1.6;
        margin: 0.75rem 0 0 0;
        opacity: 0.9;
    }

    .hero-actions,
    .hero-buttons {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-start;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .hero-meta {
        color: var(--color-font-caption);
        margin-top: 0.75rem;
    }

    .hero-error {
        margin-top: 0.5rem;
        color: var(--color-error-main);
    }

    /* Two-column variant */
    .hero-content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
    }

    /* Full-width variant */
    .hero.full-width .hero-content {
        max-width: none;
        width: 100%;
    }

    .hero.full-width .hero-inner {
        max-width: none;
        width: 100%;
    }
    .hero-text {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
    }
    .hero-illustration {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    /* Note: shape styles should live where slot content is defined */

    @keyframes float {
        0%,
        100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-20px);
        }
    }

    @media (max-width: 1024px) {
        .hero-content {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: left;
        }
    }

    @media (max-width: 768px) {
        .hero {
            padding: 0.5rem 0 1rem 0;
        }
        .hero-title {
            font-size: 2.2rem;
        }
        /* Place hero-top-line below the title on mobile */
        .hero :global(.hero-top-line) {
            position: static !important;
            margin-top: 0.5rem;
            align-self: flex-start;
        }
    }
</style>
