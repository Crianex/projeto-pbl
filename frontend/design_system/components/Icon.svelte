<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {
        config,
        library,
        type IconDefinition,
    } from "@fortawesome/fontawesome-svg-core";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";

    // Configure Font Awesome
    config.autoAddCss = false;

    import type {
        IconProp,
        FlipProp,
        SizeProp,
        PullProp,
        FaSymbol,
    } from "@fortawesome/fontawesome-svg-core";
    import { capitalize } from "lodash-es";

    export let iconType: "solid" | "regular" | "brands" | "light" | "duotone" =
        "solid";
    export let iconName: string; // Icon name without "fa-" prefix, e.g. "clipboard", "user", "github"
    export let color: string = "#000000";
    export let className: string = "";
    export let rotate: 90 | 180 | 270 | undefined = undefined;
    export let style: string = "";
    export let size: SizeProp = "1x";
    export let flip: FlipProp | undefined = undefined;

    const dispatch = createEventDispatcher();

    let isLoading = false;

    // Convert iconType to Font Awesome prefix
    function getPrefix(iconType: string): string {
        switch (iconType) {
            case "solid":
                return "fa fa-solid";
            case "regular":
                return "fa fa-regular";
            case "brands":
                return "fa fa-brands";
            case "light":
                return "fa fa-light";
            case "duotone":
                return "fa fa-duotone";
            default:
                return "fa fa-solid";
        }
    }

    function getIconName(iconName: string): string {
        return `fa-${iconName}`;
    }

    onMount(() => {});
</script>

<i
    class={`${getPrefix(iconType)} ${getIconName(iconName)} ${className} ${
        rotate ? `fa-rotate-${rotate}` : ""
    } ${size ? `fa-${size}` : ""} ${flip ? `fa-flip-${flip}` : ""}`}
    style={`color: ${color}; ${style}`}
></i>

<style>
</style>
