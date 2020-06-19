<script>
  import { page } from './lib';
  import Articles from './pages/Articles.svelte';
  import Source from './pages/Source.svelte';
  import Reason from './pages/Reason.svelte';
  import PositiveFeedback from './pages/PositiveFeedback.svelte';
  import NegativeFeedback from './pages/NegativeFeedback.svelte';

  const routes = {
    articles: Articles,
    source: Source,
    reason: Reason,
    'feedback/yes': PositiveFeedback,
    'feedback/no': NegativeFeedback,
  };
</script>

<svelte:component this={routes[$page]} />
