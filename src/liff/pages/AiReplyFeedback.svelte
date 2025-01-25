<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { LangfuseWeb } from "langfuse";
  import FeedbackForm from '../components/FeedbackForm.svelte' ;

  const params = new URLSearchParams(location.search);

  const langfuseWeb = new LangfuseWeb({
    // rumors-api
    publicKey: "pk-lf-3bc0f98e-52d0-4b01-ab03-0e222fb9cfeb",
    baseUrl: "https://langfuse.cofacts.tw",
  });

  // Feedback parameters
  //
  const aiResponseId = params.get('aiResponseId');
  let vote = params.get('vote'); // 'UPVOTE' | 'DOWNVOTE'. User may change vote.
  let comment = '';

  // Loading states
  //
  let isSubmitting = false;

  // Submitting feedback with existing comment first
  //
  onMount(async () => {
    await submitFeedback();
  });

  const handleVote = (e) => {
    vote = e.detail;
    submitFeedback();
  }

  const handleComment = async (e) => {
    comment = (e.detail || '').trim();
    isSubmitting = true;

    const { errors } = await submitFeedback();
    isSubmitting = false;

    if(errors) {
      alert(t`Cannot record your feedback. Try again later?`);
      return;
    }

    alert(t`Thank you for providing feedback to the AI reply.`);

    liff.closeWindow();
  }

  const userId = liff.getContext().userId;

  /**
   * Submit feedback with current parameters
   */
  function submitFeedback() {
    langfuseWeb.score({
      id: `${aiResponseId}__${userId}`, // One user can only vote once
      traceId: aiResponseId,
      name: 'user-feedback',
      value: vote === 'UPVOTE' ? 1 : -1,
      comment,
    })
    return
  }
</script>

<svelte:head>
  {#if vote === 'UPVOTE'}
    <title>{t`Report AI reply helpful`}</title>
  {:else}
  <title>{t`Report AI not helpful`}</title>
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
  disabled={isSubmitting}
  on:vote={handleVote}
  on:comment={handleComment}
/>