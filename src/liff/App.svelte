<script>
  import { t } from 'ttag';
  import { page, parsedToken } from './lib';
  import Source from './pages/Source.svelte';
  import Reason from './pages/Reason.svelte';
  import PositiveFeedback from './pages/PositiveFeedback.svelte';
  import NegativeFeedback from './pages/NegativeFeedback.svelte';

	const routes = {
    source: Source,
    reason: Reason,
    'feedback/yes': PositiveFeedback,
    'feedback/no': NegativeFeedback,
  };

  const expired = (parsedToken.exp || -Infinity) < Date.now() / 1000;
</script>

{#if expired}
  <p>{t`Sorry, the button is expired.`}</p>
{:else}
  <svelte:component this={routes[$page]} />
{/if}
