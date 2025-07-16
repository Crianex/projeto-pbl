<script>
	export let metrics = [];
	// metrics format: [{ label: 'Label', value: '100', fraction: '7/100' }]
</script>

<div class="metrics-row">
	{#each metrics as metric}
		<div class="metric-item">
			<div class="metric-value">{metric.value}</div>
			{#if metric.fraction}
				<div class="metric-fraction">{metric.fraction}</div>
			{/if}
			<div class="metric-label">{metric.label}</div>
		</div>
	{/each}
</div>

<style>
	.metrics-row {
		display: flex;
		gap: 48px;
		align-items: flex-start;
		justify-content: flex-start;
		flex-wrap: wrap;
		padding: 20px 0;
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 120px;
	}

	.metric-value {
		font-size: 32px;
		font-weight: 700;
		color: #21272A;
		line-height: 1.2;
		margin-bottom: 4px;
	}

	.metric-fraction {
		font-size: 14px;
		color: #697077;
		margin-bottom: 8px;
		line-height: 1.3;
	}

	.metric-label {
		font-size: 14px;
		color: #697077;
		line-height: 1.4;
		text-transform: lowercase;
	}

	@media (max-width: 768px) {
		.metrics-row {
			gap: 24px;
			justify-content: space-between;
		}
		
		.metric-item {
			min-width: 100px;
		}
		
		.metric-value {
			font-size: 24px;
		}
	}

	@media (max-width: 480px) {
		.metrics-row {
			flex-direction: column;
			gap: 16px;
		}
		
		.metric-item {
			width: 100%;
		}
	}
</style> 