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
			<slot />
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
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.dialog {
		background-color: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 90vw;
		max-height: 90vh;
		overflow-x: hidden;
		overflow-y: auto;
		animation: dialog-appear 0.2s ease-out;
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
</style>
