<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button, { Label } from '@smui/button';
  import Textfield from '@smui/textfield';
  import { DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession } from '../lib';

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

    await liff.sendMessages([
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

<p>{t`Your feedback has been recorded. We are sorry that the reply is not useful to you.`}</p>

<Textfield
  fullwidth
  textarea
  bind:value={comment}
  label={t`How can we make it useful to you?`}
  input$rows={8}
/>

<Button
  style="display: block; width: 100%; margin: 8px 0;"
  variant="raised"
  on:click={handleSubmit}
  disabled={processing}
>
  <Label>{t`Submit`}</Label>
</Button>