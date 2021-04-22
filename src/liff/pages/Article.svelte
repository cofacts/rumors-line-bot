<script>
  import { onMount } from 'svelte';
  import { gql } from '../lib';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');

  let articleData;
  let articleReplies = [];

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

          articleReplies(status: NORMAL) {
            ${articleReplyFields}
          }
        }
      }
    `({id: articleId});

    const {articleReplies: list, ...rest} = GetArticle;

    articleReplies = list.filter(({reply}) => replyId ? reply.id === replyId : true);
    articleData = rest;

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

<svelte:head>
  <title>Cofacts 網友協作回應</title>
</svelte:head>

{#if !articleData }
  <p>載入中...</p>
{:else}
  <details>
    <summary>網友回報可疑訊息</summary>
    {articleData.text}
  </details>

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