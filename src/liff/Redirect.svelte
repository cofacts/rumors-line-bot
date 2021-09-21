<script>
  import { t } from 'ttag';
  import Button from './components/Button.svelte';
  import AppBar from './components/AppBar.svelte';
  import multipleRepliesBanner from '../assets/multiple-replies.png';

  const currentParams = new URLSearchParams(location.search);
  const articleId = currentParams.get('articleId');
  const replyId = currentParams.get('replyId');
  const newParamsObj = { p: 'article' };
  if(articleId) newParamsObj.articleId = articleId;
  if(replyId) newParamsObj.replyId = replyId;
  const LIFF_URL = `https://liff.line.me/${LIFF_ID}?${new URLSearchParams(newParamsObj).toString()}`;

  const handleClick = () => {
    location.href = LIFF_URL;
  }
</script>
<style>
  .appbar-link {
    color: var(--blue1);
  }

  main {
    display: grid;
    grid-auto-flow: column;
    align-items: center;

    row-gap: 24px;
    padding: 24px;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.75px;
    text-align: center;
  }

  p {
    font-size: 16px;
    letter-spacing: 0.25px;
  }

  :global(.redirectButton) {
    color: var(--blue1);
  }
</style>

<AppBar>
  <a class="appbar-link" href={LIFF_URL}>
    {t`Proceed`}
  </a>
</AppBar>

<main>
  <img src={multipleRepliesBanner} alt="Multiple replies available" />
  <h1>{t`Let's check the message, together!`}</h1>
  <p>
    {t`You are going to proceed to Cofacts to read the reply written by fact-check volunteers.`}
  </p>
  <p>
    {t`If the reply and the reference is helpful to you, feel free to provide positive feedback to encourage the volunteers!`}
  </p>
  <Button on:click={handleClick} variant="outlined" class="redirectButton">
    {t`Proceed to read the reply`}
  </Button>
</main>

