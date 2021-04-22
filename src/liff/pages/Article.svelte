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
          articleReplies(status: NORMAL) {
            ${articleReplyFields}
          }
        }
      }
    `({id: articleId});

    articleData = GetArticle;
    articleReplies = GetArticle.articleReplies.filter(({reply}) => replyId ? reply.id === replyId : true);

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
      mutation VoteUpInArticleLIFF($articleId: String!, $replyId: String!, $vote: CofactsAPIFeedbackVote!) {
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
</script>

<svelte:head>
  <title>Cofacts 網友協作回應</title>
</svelte:head>

{#if !articleData }
  <p>載入中...</p>
{:else}
  <details>
    {articleData.text}
  </details>

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