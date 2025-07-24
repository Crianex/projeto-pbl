<script lang="ts">
	import { page } from "$app/stores";
	import { fade } from "svelte/transition";

	// Use the pathname as key to trigger transitions on route changes
	$: key = $page.url.pathname;
	
	// Check if current page is home to avoid layout constraints
	$: isHomePage = $page.url.pathname === '/';
</script>

<div class="app">
	<main class:home={isHomePage}>
		{#key key}
			<div
				class="page-container"
				class:home={isHomePage}
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

	/* Default layout for non-home pages */
	.page-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	
	/* Remove layout constraints for home page */
	.page-container.home {
		position: static;
		height: auto;
		min-height: 100vh;
		justify-content: flex-start;
		align-items: stretch;
	}
	
	main.home {
		height: auto;
		min-height: 100vh;
	}
</style>
