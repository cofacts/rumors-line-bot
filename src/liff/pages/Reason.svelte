<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import TextArea from '../components/TextArea.svelte';
  import Button from '../components/Button.svelte';
  import { REASON_PREFIX } from 'src/lib/sharedUtils';
  import { gql, assertInClient, assertSameSearchSession, sendMessages } from '../lib';

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

  let searchedText = null;
  let processing = false;
  let reason = '';

  onMount(async () => {
    // assertInClient();
    // await assertSameSearchSession();

    // Load searchedText from API
    const {data, errors} = await gql`
      query GetSearchedTextForReason {
        context {
          data {
            searchedText
          }
        }
      }
    `();
    if(errors) {
      alert(errors[0].message);
      return;
    }

    searchedText = data.context.data.searchedText.trim();
  });

  const handleSubmit = async () => {
    if(searchedText === reason.trim()) {
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

    await sendMessages([
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
  <p>{t`To help with fact-checking, please tell the editors:`}</p>

  <strong>{t`Why do you think this is a hoax?`}</strong>
  <TextArea
    class="input"
    bind:value={reason}
    rows={8}
    placeholder={t`Ex: I googled using (some keyword) and found that... / I found different opinion on (some website) saying that...`}
  />

  <Button
    style="display: block; width: 100%; margin: 8px 0;"
    color={ reason.length >= SUFFICIENT_REASON_LENGTH ? 'primary' : 'secondary'}
    on:click={handleSubmit}
    disabled={processing || searchedText === null}
  >
    {searchedText === null ? t`Loading` : t`Submit`}
  </Button>
</main>