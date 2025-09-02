<script lang="ts">
    import { typography } from "../tokens/typography";

    export let as: "h1" | "h2" | "h3" | "p" | "span" | "caption" = "p";
    export let color: "heading" | "body" | "caption" = "body";
    export let weight: number | undefined;
    export let className = "";
    export let id: string | undefined = undefined;

    $: styleObj = (() => {
        const scale = typography.scale;
        const base =
            as === "h1"
                ? scale.h1
                : as === "h2"
                  ? scale.h2
                  : as === "h3"
                    ? scale.h3
                    : as === "caption"
                      ? scale.caption
                      : scale.body;
        return {
            fontSize: base.fontSize,
            fontWeight: weight ? `${weight} !important` : base.fontWeight,
            lineHeight: base.lineHeight,
            color: typography.colors[color],
        } as any;
    })();
</script>

<svelte:element
    this={as === "caption" ? "span" : as}
    style={styleObj}
    class={className}
    {...id ? { id } : {}}
>
    <slot />
</svelte:element>
