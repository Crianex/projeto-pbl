<script lang="ts">
    export let maxWidth: "sm" | "md" | "lg" | "xl" | "full" = "lg";
    export let padding: "none" | "sm" | "md" | "lg" = "md";
    export let center = true;
    export let glass = false;
    export let shadow = true;
    export let rounded = true;
    export let needsContainerStyle = false;

    // Compute class string
    $: containerClass = [
        needsContainerStyle ? "container" : "",
        center ? "center" : "",
        glass ? "glass" : "",
        shadow ? "shadow" : "",
        rounded ? "rounded" : "",
        maxWidth ? `max-${maxWidth}` : "",
        padding ? `pad-${padding}` : "",
    ]
        .filter(Boolean)
        .join(" ");
</script>

<div class={containerClass}>
    <slot />
</div>

<style>
    .container {
        width: 100%;
        transition: all 0.3s ease;
    }

    .center {
        margin: 0 auto;
    }

    /* Max Width Variants */
    .max-sm {
        max-width: 640px;
    }
    .max-md {
        max-width: 768px;
    }
    .max-lg {
        max-width: 1024px;
    }
    .max-xl {
        max-width: 1280px;
    }
    .max-full {
        max-width: 100%;
    }

    /* Padding Variants */
    .pad-none {
        padding: 0;
    }
    .pad-sm {
        padding: 1rem;
    }
    .pad-md {
        padding: 2rem;
    }
    .pad-lg {
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
        .max-sm,
        .max-md,
        .max-lg,
        .max-xl {
            padding-left: 1rem;
            padding-right: 1rem;
        }
        .max-lg {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
        }
        .max-md {
            padding-top: 1rem;
            padding-bottom: 1rem;
        }
        .rounded {
            border-radius: 12px;
        }
    }
    @media (max-width: 768px) {
        .max-lg,
        .max-xl {
            max-width: 100%;
            margin: 0;
        }
        .rounded {
            border-radius: 16px;
        }
        .glass {
            backdrop-filter: blur(15px);
        }
    }
    @media (max-width: 480px) {
        .max-sm,
        .max-md,
        .max-lg,
        .max-xl {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            max-width: 100%;
            margin: 0;
        }
        .max-lg {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
        }
        .max-md {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }
        .rounded {
            border-radius: 12px;
        }
        .glass {
            backdrop-filter: blur(10px);
        }
    }
</style>
