<script>
	import { classNames } from "$lib/utils/utils";
	export let title = "";
	export let subtitle = "";
	export let metrics = "";
	export let bgColor = "#F2F4F8";
	export let textColor = "#21272A";
	export let subtitleColor = "#697077";
	export let href = "";

	let className = "";
	$: className = $$props.class;
</script>

<a
	{href}
	class={classNames("card-section", className)}
	style="background-color: {bgColor};"
>
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
		padding: 1rem;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: block;
		text-decoration: none;
		color: inherit;
		border: 1px solid var(--color-nature-glass-border);
		backdrop-filter: blur(10px);
		box-sizing: border-box;
		box-shadow:
			0 8px 20px var(--color-nature-shadow-light),
			0 3px 8px var(--color-nature-shadow-light);
	}

	.card-section:hover {
		transform: translateY(-2px);
		box-shadow:
			0 15px 30px var(--color-nature-shadow),
			0 8px 15px var(--color-nature-shadow-light);
	}

	.content {
		max-width: 1376px;
		margin: 0 auto;
	}

	.icon {
		margin-bottom: 12px;
	}

	.icon :global(svg) {
		color: var(--color-nature-main);
	}

	.title {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 4px 0;
		line-height: 1.3;
	}

	.subtitle {
		font-size: 13px;
		margin: 0 0 8px 0;
		line-height: 1.4;
	}

	.metrics {
		font-size: 16px;
		font-weight: 500;
		margin: 0;
	}

	@media (max-width: 768px) {
		.card-section {
			padding: 12px 16px;
		}

		.title {
			font-size: 18px;
		}

		.metrics {
			font-size: 14px;
		}
	}
</style>
