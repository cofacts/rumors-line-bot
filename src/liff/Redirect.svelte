<script>
  import { t } from 'ttag';
  import { onMount } from 'svelte';
  import Button from './components/Button.svelte';
  import AppBar from './components/AppBar.svelte';
  import multipleRepliesBanner from './assets/multiple-replies.png';

  const currentParams = new URLSearchParams(location.search);

  const newParams = new URLSearchParams(
    [['p', 'article']].concat(
      Array.from(currentParams).filter(([key]) =>
        key === 'articleId' ||
        key === 'replyId' ||
        key.startsWith('utm_')
      )
    )
  );
  const LIFF_URL = `https://liff.line.me/${LIFF_ID}?${newParams.toString()}`;

  onMount(() => {
    dataLayer.push({
      event: 'routeChangeComplete',
      pagePath: 'redirect',
      articleId: currentParams.get('articleId'),
      replyId: currentParams.get('replyId'),
    });
  });

  const handleClick = () => {
    location.href = LIFF_URL;
  }
</script>
<style>
  .appbar-link {
    color: var(--blue1);
    text-decoration: none;
  }

  main {
    display: grid;
    grid-auto-flow: row;
    justify-items: center;

    row-gap: 24px;
    padding: 24px;
  }

  .main-img {
    max-width: 100%;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.75px;
    text-align: center;
    margin: 0;
  }

  p {
    font-size: 16px;
    letter-spacing: 0.25px;
    margin: 0;
  }

  :global(.redirectButton.redirectButton) {
    color: var(--blue1);
    min-width: 240px;
    width: 100%;
    max-width: 500px;
  }
</style>

<AppBar>
  <a class="appbar-link" href={LIFF_URL}>
    {t`Proceed`}
  </a>
</AppBar>

<main>
  <img class="main-img" src={multipleRepliesBanner} alt="Let's check message together" />
  <h1>{t`Let's check the message, together!`}</h1>
  <p>
    {t`You are going to proceed to Cofacts to read the reply for you written by fact-check volunteers.`}
  </p>
  <p>
    {t`If the reply and the reference is helpful to you, please provide positive feedback. If existing replies can be improved, please login the website and provide new fact-check replies.`}
  </p>
  <Button on:click={handleClick} variant="outlined" class="redirectButton">
    {t`Proceed to read the reply`}
  </Button>
</main>

