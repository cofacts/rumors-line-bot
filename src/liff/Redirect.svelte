<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button from './components/Button.svelte';

  const currentParams = new URLSearchParams(location.search);
  const articleId = currentParams.get('articleId');
  const replyId = currentParams.get('replyId');
  const newParamsObj = { p: 'article' };
  if(articleId) newParamsObj.articleId = articleId;
  if(replyId) newParamsObj.replyId = replyId;
  const LIFF_URL = `https://liff.line.me/${LIFF_ID}?${new URLSearchParams(newParamsObj).toString()}`;

  onMount(() => {
    document.getElementById('loading').remove();
  });

  const handleClick = () => {
    location.href = LIFF_URL;
  }
</script>
<style>
</style>

<Button on:click={handleClick} variant="outlined">
  {t`前往真的假的看回應`}
</Button>
