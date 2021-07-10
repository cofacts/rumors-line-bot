<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import FeedbackForm from '../components/FeedbackForm.svelte' ;
  import { DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession, sendMessages, page } from '../lib';

  let processing = false;

  // Submitting feedback without comment first
  onMount(async () => {
    assertInClient();
    await assertSameSearchSession();
    gql`
      mutation VoteDown {
        voteReply(vote: DOWNVOTE)
      }
    `();
  });

  const handleVote = (e) => {
    if(e.detail === 1) {
      page.set('feedback/yes')
    }
  }

  const handleComment = async (e) => {
    processing = true;
    const comment = (e.detail || '').trim();

    await sendMessages([
      {
        type: 'text', text: `${DOWNVOTE_PREFIX}${comment}`,
      }
    ]);

    processing = false;
    liff.closeWindow();
  }
</script>

<svelte:head>
  <title>{t`Report not useful`}</title>
</svelte:head>

<style>
  :global(.negative-form) {
    flex: 1;
  }
</style>

<FeedbackForm
  class="negative-form"
  score={-1}
  on:vote={handleVote}
  on:comment={handleComment}
/>
