<script>
	import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { page, gql } from '../lib';

  let data = null;

  // Demo purpose, will remove in next PR
  onMount(() => {
    gql`{
      context {
        state
        data {
          sessionId
        }
      }
    }`().then(d => {
      data = d;
    })
  })
</script>

<svelte:head>
  <title>{t`Provide more info on the message`} (1/2)</title>
</svelte:head>

<p>Source select</p>

<pre>{JSON.stringify(data)}</pre>

<!-- Fake; demonstrates how to navigate through pages -->
<button on:click={() => page.set('reason')}>Go to reason</button>