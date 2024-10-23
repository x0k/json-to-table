<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props()
</script>

<div class="flex flex-col gap-4 p-8 max-w-6xl mx-auto">
  <h1 class="text-3xl font-bold">JSON to Table</h1>
  {@render children()}
</div>
