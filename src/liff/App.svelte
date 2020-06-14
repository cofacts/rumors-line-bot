<script>
  import { page } from './lib';
  import ArticleList from './pages/ArticleList.svelte';
  import Source from './pages/Source.svelte';
  import Reason from './pages/Reason.svelte';
  import PositiveFeedback from './pages/PositiveFeedback.svelte';
  import NegativeFeedback from './pages/NegativeFeedback.svelte';

  const routes = {
    articles: ArticleList,
    source: Source,
    reason: Reason,
    'feedback/yes': PositiveFeedback,
    'feedback/no': NegativeFeedback,
  };
</script>

<svelte:component this={routes[$page]} />
