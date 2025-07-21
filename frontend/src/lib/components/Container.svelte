<script lang="ts">
    export let maxWidth: "sm" | "md" | "lg" | "xl" | "full" = "lg";
    export let padding: "none" | "sm" | "md" | "lg" = "md";
    export let center = true;
    export let glass = false;
    export let shadow = true;
    export let rounded = true;
</script>

<div
    class="container {maxWidth} {padding} {$$props.class || ''}"
    class:center
    class:glass
    class:shadow
    class:rounded
>
    <slot />
</div>

<style>
    .container {
        max-width: 100%;

        width: 100%;
        transition: all 0.3s ease;
    }

    .center {
        margin: 0 auto;
    }

    /* Max Width Variants */
    .sm {
        max-width: 640px;
    }

    .md {
        max-width: 768px;
    }

    .lg {
        max-width: 1024px;
    }

    .xl {
        max-width: 1280px;
    }

    .full {
        max-width: 100%;
    }

    /* Padding Variants */
    .none {
        padding: 0;
    }

    .sm {
        padding: 1rem;
    }

    .md {
        padding: 2rem;
    }

    .lg {
        padding: 3rem;
    }

    /* Glass Effect */
    .glass {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Shadow Effect */
    .shadow {
        box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.08),
            0 8px 20px rgba(0, 0, 0, 0.06),
            0 3px 8px rgba(0, 0, 0, 0.04);
    }

    .shadow:hover {
        box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.12),
            0 15px 30px rgba(0, 0, 0, 0.08),
            0 8px 15px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
    }

    /* Rounded Corners */
    .rounded {
        border-radius: 20px;
    }

    /* Responsive Design */
    @media (max-width: 640px) {
        .sm,
        .md,
        .lg,
        .xl {
            padding-left: 1rem;
            padding-right: 1rem;
        }

        .lg {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
        }

        .md {
            padding-top: 1rem;
            padding-bottom: 1rem;
        }

        .rounded {
            border-radius: 12px;
        }
    }

    @media (max-width: 768px) {
        .lg,
        .xl {
            max-width: 95%;
        }

        .rounded {
            border-radius: 16px;
        }

        .glass {
            backdrop-filter: blur(15px);
        }
    }

    @media (max-width: 480px) {
        .sm,
        .md,
        .lg,
        .xl {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
        }

        .lg {
            padding-top: 1rem;
            padding-bottom: 1rem;
        }

        .md {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
        }

        .rounded {
            border-radius: 8px;
        }

        .glass {
            backdrop-filter: blur(10px);
        }
    }
</style>
