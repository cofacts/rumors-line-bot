<script>
  import { page } from './lib';
  import Article from './pages/Article.svelte';
  import Articles from './pages/Articles.svelte';
  import Comment from './pages/Comment.svelte';
  import UserSetting from './pages/UserSetting.svelte';
  import Feedback from './pages/Feedback.svelte';

  const routes = {
    article: Article,
    articles: Articles,
    setting: UserSetting,
    comment: Comment,
    feedback: Feedback,
  };

  // Send pageview with correct path on each page change.
  // delay a bit for page components for onMount() to be invoked.
  page.subscribe(p => {
    setTimeout(() => {
      dataLayer.push({ event: 'routeChangeComplete', pagePath: p });
    }, 10)
  });
</script>

<svelte:component this={routes[$page]} />
