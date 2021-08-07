<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import ArticleCard from '../components/ArticleCard.svelte';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');

  let articleData;
  let articleReplies = [];
  let createdAt;

  const articleReplyFields = `
    ownVote
    positiveFeedbackCount
    negativeFeedbackCount
    reply {
      id
      text
    }
  `

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
            ${articleReplyFields}
          }
        }
      }
    `({id: articleId});

    const {articleReplies: list, ...rest} = GetArticle;

    articleReplies = list.filter(({reply}) => replyId ? reply.id === replyId : true);
    articleData = rest;
    createdAt = new Date(articleData.createdAt);

    // Send event to Google Analytics
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

  const handleVote = async (replyId, vote) => {
    const resp = await gql`
      mutation VoteInArticleLIFF($articleId: String!, $replyId: String!, $vote: CofactsAPIFeedbackVote!) {
        CreateOrUpdateArticleReplyFeedback(
          articleId: $articleId
          replyId: $replyId
          vote: $vote
        ) {
          ${articleReplyFields}
        }
      }
    `({articleId, replyId, vote});

    const newArticleReply = resp.data.CreateOrUpdateArticleReplyFeedback;
    articleReplies = articleReplies.map(articleReply =>
      articleReply.reply.id === replyId ? newArticleReply : articleReply
    )
  }

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
</script>

<style>
  h1 {
    font-weight: 700;
    font-size: 1em;
    color: var(--secondary300);
    margin: 24px 16px 8px;
  }

  h1:first-of-type {
    margin-top: 8px;
  }
</style>

<svelte:head>
  <title>{t`IM check`} | {t`Cofacts chatbot`}</title>
</svelte:head>

{#if !articleData }
  <p style="align-self: center; margin: auto 0;">{t`Loading IM data...`}</p>
{:else}
  <h1>
    {t`Suspicious messages`}
  </h1>
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
    <ul>
      {#each articleReplies as articleReply (articleReply.reply.id)}
        <li>
          <article>
            {articleReply.reply.text}
          </article>
          <button type="button" on:click={() => handleVote(articleReply.reply.id, 'UPVOTE')}>
            Upvote ({articleReply.positiveFeedbackCount})
          </button>
          <button type="button" on:click={() => handleVote(articleReply.reply.id, 'DOWNVOTE')}>
            Downvote ({articleReply.negativeFeedbackCount})
          </button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}