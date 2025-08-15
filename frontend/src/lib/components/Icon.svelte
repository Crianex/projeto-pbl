<script lang="ts">
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
    import * as icons from "../utils/fontawesome";

    export let name: string;
    export let icon: IconDefinition | undefined = undefined;
    export let size:
        | "xs"
        | "sm"
        | "lg"
        | "1x"
        | "2x"
        | "3x"
        | "4x"
        | "5x"
        | "6x"
        | "7x"
        | "8x"
        | "9x"
        | "10x" = "1x";
    export let color: string = "";
    export let className: string = "";
    export let spin: boolean = false;
    export let pulse: boolean = false;
    export let fixedWidth: boolean = false;
    export let rotation: 90 | 180 | 270 | undefined = undefined;
    export let flip: "horizontal" | "vertical" | "both" | undefined = undefined;
    export let transform: string = "";
    export let mask: IconDefinition | undefined = undefined;
    export let symbol: boolean = false;
    export let title: string = "";
    export let inverse: boolean = false;
    export let border: boolean = false;
    export let pull: "left" | "right" | undefined = undefined;
    export let style: string = "";

    // Get the icon definition from the name or use the provided icon
    $: iconDefinition = icon || (icons as any)[name];
</script>

<FontAwesomeIcon
    icon={iconDefinition}
    {size}
    class={className}
    {spin}
    {pulse}
    {fixedWidth}
    {rotation}
    {flip}
    {transform}
    {mask}
    {symbol}
    {title}
    {inverse}
    {border}
    {pull}
    {style}
/>
