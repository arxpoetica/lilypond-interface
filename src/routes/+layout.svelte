<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-base-50 min-h-screen text-4xl">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		{@render children()}
	</div>
</div>
