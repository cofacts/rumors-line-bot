<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import FeedbackForm from '../components/FeedbackForm.svelte' ;

  const params = new URLSearchParams(location.search);

  // Feedback parameters
  //
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');
  let vote = params.get('vote'); // 'UPVOTE' | 'DOWNVOTE'. User may change vote.
  let comment = '';

  // Loading states
  //
  let isInitializing = true;
  let isSubmitting = false;

  // Submitting feedback with existing comment first
  //
  onMount(async () => {
    dataLayer.push({articleId, replyId});

    // Load searchedText and previous comment
    const { data, errors } = await gql`
      query GetCurrentUserFeedbackInLIFF($articleId: String!, $replyId: String!) {
        ListArticleReplyFeedbacks(
          filter: {
            articleId: $articleId
            replyId: $replyId
            selfOnly: true
          }
        ) {
          edges {
            node {
              id
              comment
            }
          }
        }
      }
    `({articleId, replyId});

    isInitializing = false;

    if(errors) {
      alert(errors[0].message);
      return;
    }

    // Loads previous comment
    // (previous vote will be overwritten by current vote)
    comment = data.ListArticleReplyFeedbacks.edges[0]?.node.comment ?? '';

    dataLayer.push({event: 'dataLoaded', doc: data.ListArticleReplyFeedbacks.edges[0]})
    await submitFeedback();
  });

  const handleVote = (e) => {
    vote = e.detail;
    submitFeedback();
  }

  const handleComment = async (e) => {
    comment = (e.detail || '').trim();
    isSubmitting = true;

    const { data, errors } = await submitFeedback();
    isSubmitting = false;

    if(errors) {
      alert(t`Cannot record your feedback. Try again later?`);
      return;
    }

    const otherFeedbackCount = data.CreateOrUpdateArticleReplyFeedback.feedbackCount - 1;
    alert(
      otherFeedbackCount > 0
        ? t`We've received feedback from you and ${otherFeedbackCount} other users!`
        : t`Thanks. You're the first one who gave feedback on this reply!`
    );

    liff.closeWindow();
  }

  /**
   * Submit feedback with current parameters
   */
  function submitFeedback() {
    dataLayer.push({event: 'feedbackVote'});

    return gql`
      mutation SubmitFeedbackInLIFF(
        $articleId: String!
        $replyId: String!
        $vote: CofactsAPIFeedbackVote!
        $comment: String!
      ) {
        CreateOrUpdateArticleReplyFeedback(
          articleId: $articleId
          replyId: $replyId
          vote: $vote
          comment: $comment
        ) {
          feedbackCount
        }
      }
    `({ articleId, replyId, vote, comment });
  }
</script>

<svelte:head>
  {#if vote === 'UPVOTE'}
    <title>{t`Report reply helpful`}</title>
  {:else}
  <title>{t`Report not helpful`}</title>
  {/if}
</svelte:head>

<style>
  :global(.form) {
    flex: 1;
  }
</style>

<FeedbackForm
  class="form"
  vote={vote}
  comment={comment}
  disabled={isInitializing || isSubmitting}
  on:vote={handleVote}
  on:comment={handleComment}
/>