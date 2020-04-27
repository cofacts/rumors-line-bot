<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button, { Label } from '@smui/button';
  import Textfield, { Input, Textarea } from '@smui/textfield';
  import { UPVOTE_PREFIX } from 'src/lib/sharedUtils';
  import { gql } from '../lib';

  let processing = false;
  let comment = '';

  // Submitting feedback without comment first
  onMount(() => gql`
    mutation VoteUp {
      voteReply(vote: UPVOTE)
    }
  `());

  const handleSubmit = async () => {
    processing = true;

    await liff.sendMessages([
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

<p>{t`It's glad to see the reply is helpful.`}</p>

<Textfield
  fullwidth
  textarea
  bind:value={comment}
  label={t`Do you have anything to add to the reply?`}
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