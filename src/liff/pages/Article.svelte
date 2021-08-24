<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import FullpagePrompt from '../components/FullpagePrompt.svelte';
  import Header from '../components/Header.svelte';
  import ArticleCard from '../components/ArticleCard.svelte';
  import ArticleReplyCard from '../components/ArticleReplyCard.svelte';
  import Spacer from '../components/Spacer.svelte';
  import Terms from '../components/Terms.svelte';
  import { ArticleReplyCard_articleReply } from '../components/fragments';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');

  let articleData;
  let articleReplies = [];
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

  $: replySectionTitle = articleReplies.length === 1
    ? t`Cofacts reply`
    : t`There are ${articleReplies.length} Cofacts replies for this message`
</script>

<svelte:head>
  <title>{t`IM check`} | {t`Cofacts chatbot`}</title>
</svelte:head>

{#if !articleData }
  <FullpagePrompt>{t`Loading IM data...`}</FullpagePrompt>
{:else}
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
    <Header>{replySectionTitle}</Header>
    {#each articleReplies as articleReply, idx (articleReply.reply.id)}
      {#if idx > 0}
        <Spacer />
      {/if}
      <ArticleReplyCard articleReply={articleReply} />
      <!-- <li>
        <article>
          {articleReply.reply.text}
        </article>
        <button type="button" on:click={() => handleVote(articleReply.reply.id, 'UPVOTE')}>
          Upvote ({articleReply.positiveFeedbackCount})
        </button>
        <button type="button" on:click={() => handleVote(articleReply.reply.id, 'DOWNVOTE')}>
          Downvote ({articleReply.negativeFeedbackCount})
        </button>
      </li> -->
    {/each}
  {/if}
  <Terms />
{/if}
