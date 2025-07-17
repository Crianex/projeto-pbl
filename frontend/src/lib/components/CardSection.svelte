<script>
	export let title = "";
	export let subtitle = "";
	export let metrics = "";
	export let bgColor = "#F2F4F8";
	export let textColor = "#21272A";
	export let subtitleColor = "#697077";
	export let href = "";
</script>

<a {href} class="card-section" style="background-color: {bgColor};">
	<div class="content">
		{#if title}
			<h2 class="title" style="color: {textColor};">{title}</h2>
		{/if}
		{#if subtitle}
			<p class="subtitle" style="color: {subtitleColor};">{subtitle}</p>
		{/if}
		{#if metrics}
			<div class="metrics" style="color: {textColor};">{metrics}</div>
		{/if}
		<div class="icon">
			<slot name="icon" />
		</div>
		<slot />
	</div>
</a>

<style>
	.card-section {
		width: 100%;
		padding: 2rem 2.5rem;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: block;
		text-decoration: none;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		box-shadow: 
			0 15px 35px rgba(0, 0, 0, 0.08),
			0 8px 20px rgba(0, 0, 0, 0.06),
			0 3px 8px rgba(0, 0, 0, 0.04);
	}

	.card-section:hover {
		transform: translateY(-4px);
		box-shadow: 
			0 25px 50px rgba(0, 0, 0, 0.12),
			0 15px 30px rgba(0, 0, 0, 0.08),
			0 8px 15px rgba(0, 0, 0, 0.06);
	}

	.content {
		max-width: 1376px;
		margin: 0 auto;
	}

	.icon {
		margin-bottom: 16px;
	}

	.icon :global(svg) {
		color: #1a1a1a;
	}

	.title {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 8px 0;
		line-height: 1.3;
	}

	.subtitle {
		font-size: 14px;
		margin: 0 0 12px 0;
		line-height: 1.4;
	}

	.metrics {
		font-size: 18px;
		font-weight: 500;
		margin: 0;
	}

	@media (max-width: 768px) {
		.card-section {
			padding: 16px 20px;
		}

		.title {
			font-size: 20px;
		}

		.metrics {
			font-size: 16px;
		}
	}
</style>
