<script lang="ts">
    export let title: string = "";
    export let subtitle: string = "";
    export let centerContent: boolean = false;
    export let padding: "sm" | "md" | "lg" = "md";
    export let maxWidth: string | undefined;
</script>

<section class="page-section {padding}" class:center={centerContent}>
    <div class="section-inner" style="max-width: {maxWidth};">
        {#if title || subtitle}
            <div class="section-header">
                {#if title}
                    <h2 class="section-title">{title}</h2>
                {/if}
                {#if subtitle}
                    <p class="section-subtitle">{subtitle}</p>
                {/if}
            </div>
        {/if}

        <div class="section-content">
            <slot />
        </div>
    </div>
</section>

<style>
    .page-section {
        width: 100%;
        box-sizing: border-box;
    }

    .page-section.sm {
        padding: 1.5rem 0;
    }

    .page-section.md {
        padding: 3rem 0;
    }

    .page-section.lg {
        padding: 4rem 0;
    }

    .section-inner {
        margin: 0 auto;
        width: 100%;
    }

    .page-section.center .section-inner {
        text-align: center;
    }

    .section-header {
        margin-bottom: 2rem;
    }

    .section-title {
        font-size: 2.25rem;
        font-weight: 800;
        color: var(--color-font-heading-dark);
        margin: 0 0 1rem 0;
        line-height: 1.2;
    }

    .section-subtitle {
        color: var(--color-font-body-dark);
        font-size: 1.125rem;
        margin: 0;
        opacity: 0.9;
        line-height: 1.6;
    }

    .section-content {
        width: 100%;
        gap: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    @media (max-width: 768px) {
        .page-section.sm {
            padding: 1rem 0;
        }

        .page-section.md {
            padding: 2rem 0;
        }

        .page-section.lg {
            padding: 2.5rem 0;
        }

        .section-title {
            font-size: 1.875rem;
        }

        .section-subtitle {
            font-size: 1rem;
        }
    }
</style>
