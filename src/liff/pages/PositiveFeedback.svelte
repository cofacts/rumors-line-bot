<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import FeedbackForm from '../components/FeedbackForm.svelte' ;

  import { UPVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession, sendMessages, page } from '../lib';

  let processing = false;

  // Submitting feedback without comment first
  onMount(async () => {
    assertInClient();
    await assertSameSearchSession();
    gql`
      mutation VoteUp {
        voteReply(vote: UPVOTE)
      }
    `();
  });

  const handleVote = (e) => {
    if(e.detail === -1) {
      page.set('feedback/no')
    }
  }

  const handleComment = async (e) => {
    processing = true;
    const comment = (e.detail || '').trim();

    await sendMessages([
      {
        type: 'text', text: `${UPVOTE_PREFIX}${comment}`,
      }
    ]);

    processing = false;
    liff.closeWindow();
  }
</script>

<svelte:head>
  <title>{t`Report reply helpful`}</title>
</svelte:head>

<style>
  :global(.positive-form) {
    flex: 1;
  }
</style>

<FeedbackForm
  class="positive-form"
  score={1}
  on:vote={handleVote}
  on:comment={handleComment}
/>