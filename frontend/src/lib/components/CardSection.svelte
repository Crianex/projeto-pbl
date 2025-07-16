<script>
	export let title = '';
	export let subtitle = '';
	export let metrics = '';
	export let bgColor = '#F2F4F8';
	export let textColor = '#21272A';
	export let subtitleColor = '#697077';
</script>

<div class="card-section" style="background-color: {bgColor};">
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
		<slot />
	</div>
</div>

<style>
	.card-section {
		width: 100%;
		padding: 20px 32px;
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.content {
		max-width: 1376px;
		margin: 0 auto;
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