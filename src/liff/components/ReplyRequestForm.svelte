<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from 'ttag';

  import TextArea from './TextArea.svelte';
  import Button from './Button.svelte';

  /* The text of the article being asked */
  export let searchedText = '';
  export let disabled = false;
  export let reason = '';

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

  const dispatch = createEventDispatcher();
  const handleSubmit = () => {
    const trimmedReason = reason.trim();
    if(searchedText === trimmedReason) {
      alert(DUP_SUGGESTION);
      return;
    }

    if(
      trimmedReason.length < SUFFICIENT_REASON_LENGTH &&
      !confirm(REASON_SUGGESTION)
    ) {
      return;
    }

    dispatch('submit', trimmedReason);
  }
</script>

<style>
  form {
    display: flex;
    flex-flow: column;
    padding: 16px;

    flex: 1; /* extend to container size */
    margin: 0; /* reset browser native style */

    color: #fff;
    font-size: 16px;
    background: var(--orange1);
  }

  p {
    margin: 0;
  }

  .emphasize {
    font-weight: 700;
  }

  form :global(textarea) {
    margin: 16px 0 20px;
    min-height: 80px;
    flex: 1; /* extend to container size */
  }
</style>

<form on:submit|preventDefault={handleSubmit}>
  <p class="emphasize">
    {t`To help with fact-checking, please tell the editors:`}<br />
    {t`Why do you think this is a hoax?`}
  </p>

  <TextArea
    name="reason"
    bind:value={reason}
    placeholder={t`Ex: I googled using (some keyword) and found that... / I found different opinion on (some website) saying that...`}
  />

  <Button type="submit" disabled={disabled}>
    {#if reason.length === 0}
      {t`Submit`}
    {:else if vote === 'DOWNVOTE'}
      {t`Please provide your comment above`}
    {:else}
      {t`Close`}
    {/if}
  </Button>
</form>