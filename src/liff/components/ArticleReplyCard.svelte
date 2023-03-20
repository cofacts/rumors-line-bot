<script>
  import { t } from 'ttag';
  import { linkify, gql } from '../lib';
  import Card from './Card.svelte';
  import ArticleReplyHeader from './ArticleReplyHeader.svelte';
  import FeedbackForm from './FeedbackForm.svelte';
  import FeedbackSummary from './FeedbackSummary.svelte';
  import { ArticleReplyCard_articleReply } from '../components/fragments';

  /** fragments.ArticleReplyCard_articleReply */
  let articleReplyFromProps;
  export { articleReplyFromProps as articleReply };

  // Initialize articleReply from props
  let articleReply = articleReplyFromProps;
  // 'UPVOTE' | 'DOWNVOTE' | null
  let ownVote = articleReply.ownVote || null;

  // Show feedback form if the user never casted a vote
  let showFeedbackForm = ownVote === null;
  let isSubmittingComment = false;

  /**
   * @param vote {CofactsAPIFeedbackVote}
   * @param comment {string | null}
   * @returns {Promise<ArticleReplyCard_articleReply>}
   */
  const submitVote = async (vote, comment = null) => {
    dataLayer.push({
      event: 'feedbackVote',
      articleId: articleReply.articleId,
      replyId: articleReply.reply.id
    });

    const resp = await gql`
      mutation VoteInArticleLIFF(
        $articleId: String!
        $replyId: String!
        $vote: CofactsAPIFeedbackVote!
        $comment: String
      ) {
        CreateOrUpdateArticleReplyFeedback(
          articleId: $articleId
          replyId: $replyId
          vote: $vote
          comment: $comment
        ) {
            ...ArticleReplyCard_articleReply
          }
      }
      ${ArticleReplyCard_articleReply}
    `({
      articleId: articleReply.articleId,
      replyId: articleReply.reply.id,
      vote,
      comment,
    });

    return resp.data.CreateOrUpdateArticleReplyFeedback;
  };

  const handleVote = async e => {
    // Optimistic update for ownVote
    ownVote = e.detail;

    // Use the new articleReply to replace articleReply passed from parent
    articleReply = await submitVote(ownVote);
  }

  const handleComment = async e => {
    isSubmittingComment = true;

    const comment = (e.detail || '').trim();
    // Use the new articleReply to replace articleReply passed from parent
    articleReply = await submitVote(ownVote, comment);
    isSubmittingComment = false;
    showFeedbackForm = false;
  }

  const handleEdit = () => {
    showFeedbackForm = true;
    // TODO: load own comment and populate, etc
  }
</script>

<style>
  article {
    white-space: pre-line;
  }
  hr {
    border: 0;
    margin: 0;
    border-top: 1px dashed var(--secondary100);
  }
  h3 {
    color: var(--secondary200);
    font-size: 16px;
    margin: 0;
  }
  .noReference {
    color: var(--red2);
    margin: 0;
  }
</style>

<Card>
  <ArticleReplyHeader articleReply={articleReply} />
  <article>
    {articleReply.reply.text}
  </article>
  <hr />
  {#if articleReply.reply.reference}
    <h3>
      {articleReply.replyType === 'OPINIONATED' ? t`Opinion Sources` : t`References`}
    </h3>
    <article>
      {@html linkify(articleReply.reply.reference, 'target="_blank"')}
    </article>
  {:else}
    <p class="noReference">
      ⚠️️ {t`There is no reference for this reply. Its truthfulness may be doubtful.`}
    </p>
  {/if}
</Card>
{#if showFeedbackForm}
  <FeedbackForm
    vote={ownVote}
    disabled={isSubmittingComment}
    on:vote={handleVote}
    on:comment={handleComment}
  />
{:else}
  <FeedbackSummary
    ownVote={ownVote}
    feedbackCount={articleReply.feedbackCount}
    on:edit={handleEdit}
  />
{/if}