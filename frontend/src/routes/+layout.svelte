<script lang="ts">
	import { page } from "$app/stores";
	import { fade } from "svelte/transition";

	// Use the pathname as key to trigger transitions on route changes
	$: key = $page.url.pathname;
</script>

<div class="app">
	<main>
		{#key key}
			<div
				class="page-container"
				in:fade={{ duration: 500 }}
				out:fade={{ duration: 500 }}
			>
				<slot></slot>
			</div>
		{/key}
	</main>
</div>

<style>
	:global(body) {
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			Oxygen-Sans,
			Ubuntu,
			Cantarell,
			"Helvetica Neue",
			sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.app {
		height: 100vh;
		width: 100vw;
		display: flex;
	}

	main {
		flex: 1;
		margin: 0;
		padding: 0;
		height: 100vh;
		width: 100vw;
		position: relative;
	}

	.page-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
	}
</style>
