<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import { gaTitle, getArticleURL, VIEW_ARTICLE_PREFIX } from 'src/lib/sharedUtils';
  import AppBar from '../components/AppBar.svelte';
  import SingleColorLogo from '../components/icons/SingleColorLogo.svelte';
  import FullpagePrompt from '../components/FullpagePrompt.svelte';
  import Header from '../components/Header.svelte';
  import ArticleCard from '../components/ArticleCard.svelte';
  import ArticleReplyCard from '../components/ArticleReplyCard.svelte';
  import Spacer from '../components/Spacer.svelte';
  import Terms from '../components/Terms.svelte';
  import Button from '../components/Button.svelte';
  import { ArticleReplyCard_articleReply } from '../components/fragments';
  import improveBanner from '../assets/improve-reply-banner.png';
  import multipleRepliesBanner from '../assets/multiple-replies.png';
  import NewWindowIcon from './icons/NewWindowIcon.svelte';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');
  const articleUrl = getArticleURL(articleId);

  let articleData;
  let articleReplies = [];
  // These article replies are collapsed by default. Used when replyId is specified from URL.
  let collapsedArticleReplies = [];
  let expanded = false; // Collapse above article replies by default
  let createdAt;

  const loadData = async () => {
    const {
      data: { GetArticle },
    } = await gql`
      query GetArticleInLIFF($id: String) {
        GetArticle(id: $id) {
          text
          replyRequestCount
          requestedForReply
          createdAt

          articleReplies(status: NORMAL) {
            ...ArticleReplyCard_articleReply
          }
        }
      }
      ${ArticleReplyCard_articleReply}
    `({id: articleId});

    const {articleReplies: list, ...rest} = GetArticle;

    articleReplies = !replyId ? list : list.filter(({reply}) => reply.id === replyId);
    collapsedArticleReplies = !replyId ? [] : list.filter(({reply}) => reply.id !== replyId);
    articleData = rest;
    createdAt = new Date(articleData.createdAt);

    // Send event to Google Analytics
    gtag('set', { page_title: gaTitle(articleData.text) });
    gtag('event', 'ViewArticle', {
      event_category: 'LIFF',
      event_label: articleId,
    });
    articleReplies.forEach(({reply}) => {
      gtag('event', 'ViewReply', {
        event_category: 'LIFF',
        event_label: reply.id,
      });
    })
  }

  const setViewed = async () => {
    await gql`
      mutation SetViewedInLIFF($id: String!) {
        setViewed(articleId: $id) { lastViewedAt }
      }
    `({id: articleId});
  }

  onMount(() => {
    loadData();
    setViewed();
  });

  let isRequestingReply = false;
  const handleRequestReply = async () => {
    isRequestingReply = true;

    const resp = await gql`
      mutation RequestReplyInArticleLIFF($articleId: String!) {
        CreateOrUpdateReplyRequest (articleId: $articleId) {
          replyRequestCount
          requestedForReply
        }
      }
    `({articleId});

    isRequestingReply = false;
    articleData = {...articleData, ...resp.data.CreateOrUpdateReplyRequest};
  }

  $: replySectionTitle = articleReplies.length === 1
    ? t`Cofacts volunteer's reply to the message above`
    : t`Cofacts volunteers have published ${articleReplies.length} replies to the message above`

  const appbarHref = liff.isInClient() ?
    `https://line.me/R/oaMessage/@cofacts?${encodeURIComponent(`${VIEW_ARTICLE_PREFIX}${articleUrl}`)}` :
    getArticleURL(articleId);
</script>

<style>
  .appbar-link {
    color: var(--secondary300);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.25px;
    text-decoration: none;
    display: flex;
    align-items: center;
  }

  .appbar-link > :global(svg) {
    margin-left: 8px;
  }

  .improve-banner > img {
    margin-top: 24px;
    width: 100%;
  }

  .multiple-replies-banner {
    margin-top: 24px;
    padding: 24px 16px;
    background: var(--primary50);
    display: grid;
    grid-auto-flow: row;
    row-gap: 16px;
  }

  .multiple-replies-banner > img {
    width: 72.8%;
    margin: 0 auto;
  }
</style>

<svelte:head>
  <title>{t`IM check`} | {t`Cofacts chatbot`}</title>
</svelte:head>

{#if !articleData }
  <FullpagePrompt>{t`Loading IM data...`}</FullpagePrompt>
{:else}
  <AppBar>
    {#if articleId }
      <a class="appbar-link" href={appbarHref}>
        {t`Open in Cofacts`}
        <NewWindowIcon />
      </a>
    {/if}
  </AppBar>
  <Header>
    {t`Suspicious messages`}
  </Header>
  <ArticleCard
    text={articleData.text}
    replyRequestCount={articleData.replyRequestCount}
    createdAt={createdAt}
  />

  {#if articleReplies.length === 0}
    <p>有 {articleData.replyRequestCount} 人回報說看到此訊息。</p>
    <button type="button" on:click={handleRequestReply} disabled={isRequestingReply || articleData.requestedForReply}>
      {#if articleData.requestedForReply}
        已回報此訊息
      {:else}
        我也要回報此訊息！
      {/if}
    </button>
  {:else}
    <Header style="position: relative; overflow: hidden;">
      {replySectionTitle}
      <SingleColorLogo style="position: absolute; right: -4px; bottom: -9px; color: var(--secondary100); z-index: -1;"/>
    </Header>
    {#each articleReplies as articleReply, idx (articleReply.reply.id)}
      {#if idx > 0}
        <Spacer style="--dot-size: 8px" />
      {/if}
      <ArticleReplyCard articleReply={articleReply} />
    {/each}

    {#if collapsedArticleReplies.length > 0 }
      {#if expanded}
        <Header>
          {t`Other replies`}
        </Header>
        {#each collapsedArticleReplies as articleReply, idx (articleReply.reply.id)}
          {#if idx > 0}
            <Spacer style="--dot-size: 8px" />
          {/if}
          <ArticleReplyCard articleReply={articleReply} />
        {/each}
      {:else}
        <footer class="multiple-replies-banner">
          <img src={multipleRepliesBanner} alt="Multiple replies available" />
          {t`There are different replies for the message. We suggest read them all here before you make judgements.`}
          <Button variant="outlined" on:click={() => { expanded = true; }}>
            {t`Read other replies`}
          </Button>
        </footer>
      {/if}
    {/if}

    {#if collapsedArticleReplies.length === 0 || expanded}
      <a class="improve-banner" href={articleUrl} target="_blank">
        <img src={improveBanner} alt="Help improve replies" />
      </a>
    {/if}
  {/if}
  <Terms />
{/if}
