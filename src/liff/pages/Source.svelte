<script>
	import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { page } from '../lib';

  // Demo purpose, will remove in next PR
  export let context;
</script>

<svelte:head>
  <title>{t`Provide more info on the message`} (1/2)</title>
</svelte:head>

<p>Source select</p>

<pre>{JSON.stringify(context, null, '  ')}</pre>

<!-- Fake; demonstrates how to navigate through pages -->
<button on:click={() => page.set('reason')}>Go to reason</button>