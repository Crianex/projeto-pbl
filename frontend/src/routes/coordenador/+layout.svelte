<script lang="ts">
    import AppLayout from "$lib/design_system/components/AppLayout.svelte";
    import { currentUser } from "$lib/utils/auth";
</script>

<AppLayout userType={$currentUser?.tipo}>
    <slot />
</AppLayout>
