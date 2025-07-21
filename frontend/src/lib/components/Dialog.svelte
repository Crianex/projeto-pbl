<script lang="ts">
	import { fade, scale } from "svelte/transition";
	import { createEventDispatcher } from "svelte";

	export let open = false;
	export let closeOnClickOutside = true;

	const dispatch = createEventDispatcher();

	function handleClose() {
		if (closeOnClickOutside) {
			dispatch("close");
		}
	}

	function handleDialogClick(event: MouseEvent) {
		// Prevent clicks inside dialog from closing it
		event.stopPropagation();
	}
</script>

{#if open}
	<div
		class="dialog-overlay"
		on:click={handleClose}
		transition:fade={{ duration: 200 }}
	>
		<div
			class="dialog"
			on:click={handleDialogClick}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="dialog-header">
				<slot name="header" />
			</div>
			<div class="dialog-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
		backdrop-filter: blur(12px);
		z-index: 1000;
	}

	.dialog {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow:
			0 30px 60px rgba(0, 0, 0, 0.15),
			0 20px 40px rgba(0, 0, 0, 0.1),
			0 10px 20px rgba(0, 0, 0, 0.08);
		max-width: 90vw;
		max-height: 90vh;
		overflow-x: hidden;
		overflow-y: auto;
		animation: dialog-appear 0.3s ease-out;
		transition: all 0.3s ease;
	}

	.dialog-header {
		padding: 2rem 2.5rem 1rem 2.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dialog-content {
		padding: 1rem 2.5rem 2rem 2.5rem;
	}

	@keyframes dialog-appear {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Scrollbar styling */
	.dialog::-webkit-scrollbar {
		width: 8px;
	}

	.dialog::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.dialog::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	.dialog::-webkit-scrollbar-thumb:hover {
		background: #555;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.dialog {
			max-width: 95vw;
			max-height: 95vh;
			border-radius: 20px;
			margin: 1rem;
		}

		.dialog-header {
			padding: 1.5rem 2rem 1rem 2rem;
		}

		.dialog-content {
			padding: 1rem 2rem 1.5rem 2rem;
		}
	}

	@media (max-width: 480px) {
		.dialog {
			max-width: 100vw;
			max-height: 100vh;
			border-radius: 16px;
			margin: 0.5rem;
		}

		.dialog-header {
			padding: 1.25rem 1.5rem 0.75rem 1.5rem;
		}

		.dialog-content {
			padding: 0.75rem 1.5rem 1.25rem 1.5rem;
		}

		.dialog-overlay {
			backdrop-filter: blur(8px);
		}
	}
</style>
