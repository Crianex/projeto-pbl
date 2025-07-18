<script lang="ts">
</script>

<div class="app">
	<main>
		<slot></slot>
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
	}
</style>
