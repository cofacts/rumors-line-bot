<script>
  import { t } from 'ttag';
  import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
  import logo from '../assets/logo.svg';
  import NewWindowIcon from './icons/NewWindowIcon.svelte';

  export let articleId;

  const articleUrl = getArticleURL(articleId);
  const openLink = liff.isInClient() ?
    `https://line.me/R/oaMessage/@cofacts?${encodeURIComponent(`${VIEW_ARTICLE_PREFIX}${articleUrl}`)}` :
    getArticleURL(articleId);
</script>

<style>
  header {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    background: #fff;
    border-bottom: 2px solid var(--secondary50);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .logo {
    margin-right: auto;
  }

  a {
    color: var(--secondary300);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.25px;
    text-decoration: none;
    display: flex;
    align-items: center;
  }

  a > :global(svg) {
    margin-left: 8px;
  }
</style>

<header>
  <img class="logo" src={logo} alt="Cofacts 真的假的" />
  {#if articleId }
    <a href={openLink}>
      {t`Open in Cofacts`}
      <NewWindowIcon />
    </a>
  {/if}
</header>