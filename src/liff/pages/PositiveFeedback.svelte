<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import TextArea from '../components/TextArea.svelte';
  import Button from '../components/Button.svelte';

  import { UPVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession, sendMessages } from '../lib';

  let processing = false;
  let comment = '';

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

  const handleSubmit = async () => {
    processing = true;

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
  <title>{t`Report reply useful`}</title>
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
  <p>{t`We have recorded your feedback. It's glad to see the reply is helpful.`}</p>

  <strong>{t`Do you have anything to add about the reply?`}</strong>

  <TextArea
    class="input"
    bind:value={comment}
    rows={8}
    placeholder={t`I think the reply is useful and I want to add`}
  />

  <Button
    on:click={handleSubmit}
    disabled={processing}
  >
    {t`Submit`}
  </Button>
</main>