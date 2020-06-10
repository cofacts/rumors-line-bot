<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button, { Label } from '@smui/button';
  import Textfield, { Input, Textarea } from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text/index';
  import { REASON_PREFIX } from 'src/lib/sharedUtils';
  import { assertInClient } from '../lib';

  export let context;

  const SUFFICIENT_REASON_LENGTH = 40;
  const LENGHEN_HINT = /* t: Guidance in LIFF */ t`
You may try:
1. Express your thought more
2. Google for more info
3. Look for similar content using search box on Facebook`;

  const REASON_SUGGESTION = /* t: Guidance in LIFF */ t`
It would help fact-checking editors a lot if you provide more info :)

${LENGHEN_HINT}

To provide more info, please press "Cancel"; otherwise, press "OK" to submit the current info directly.`;

  const DUP_SUGGESTION = /* t: Guidance in LIFF */ t`
The info you provide should not be identical to the message itself.

${LENGHEN_HINT}`

  let processing = false;
  let reason = '';
  
  onMount(() => {
    assertInClient();
  });
  const handleSubmit = async () => {
    if(context && context.data.searchedText.trim() === reason.trim()) {
      alert(DUP_SUGGESTION);
      return;
    }

    if(
      reason.length < SUFFICIENT_REASON_LENGTH &&
      !confirm(REASON_SUGGESTION)
    ) {
      return;
    }

    processing = true;

    await liff.sendMessages([
      {
        type: 'text', text: `${REASON_PREFIX}${reason}`,
      }
    ]);

    processing = false;
    liff.closeWindow();
  }
</script>

<svelte:head>
  <title>{t`Provide more info`} (2/2)</title>
</svelte:head>

<p>{t`To help with fact-checking, please tell the editors:`}</p>

<Textfield
  fullwidth
  textarea
  bind:value={reason}
  label={t`Why do you think this is a hoax?`}
  input$rows={8}
  input$aria-controls="helper-text"
  input$aria-describedby="helper-text"
/>
<HelperText id="helper-text">
  {t`Ex: I googled using (some keyword) and found that... / I found different opinion on (some website) saying that...`}
</HelperText>

<Button
  style="display: block; width: 100%; margin: 8px 0;"
  variant="raised"
  color={ reason.length >= SUFFICIENT_REASON_LENGTH ? 'primary' : 'secondary'}
  on:click={handleSubmit}
  disabled={processing}
>
  <Label>{t`Submit`}</Label>
</Button>