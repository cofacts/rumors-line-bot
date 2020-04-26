<script>
  import { t } from 'ttag';
  import { page } from '../lib';
</script>

<svelte:head>
  <title>{t`Provide more info on the message`} (1/2)</title>
</svelte:head>

<p>Source select</p>

<!-- Fake; demonstrates how to navigate through pages -->
<button on:click={() => page.set('reason')}>Go to reason</button>