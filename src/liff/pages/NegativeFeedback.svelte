<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button from '../components/Button.svelte';
  import TextArea from '../components/TextArea.svelte';
  import { DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession, sendMessages } from '../lib';

  let processing = false;
  let comment = '';

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

  const handleSubmit = async () => {
    processing = true;

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
  main {
    padding: 16px;
    display: flex;
    flex-flow: column;
    gap: 8px;
  }

  main :global(.input) {
    border: 2px solid var(--secondary300);
  }
</style>

<main>
  <p>{t`Your feedback has been recorded. We are sorry that the reply is not useful to you.`}</p>
  <strong>{t`How can we make it useful to you?`}</strong>

  <TextArea
    class="input"
    bind:value={comment}
    rows={8}
    placeholder={t`I think the reply is not useful and I suggest`}
  />

  <Button
    on:click={handleSubmit}
    disabled={processing}
  >
    {t`Submit`}
  </Button>
</main>