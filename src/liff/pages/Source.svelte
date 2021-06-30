<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button from '../components/Button.svelte';

  import { page, assertInClient, assertSameSearchSession, sendMessages, isArticleSubmission } from '../lib';
  import { ARTICLE_SOURCE_OPTIONS, SOURCE_PREFIX_NOT_YET_REPLIED, SOURCE_PREFIX_FRIST_SUBMISSION } from 'src/lib/sharedUtils';

  let processing = false;
  onMount(async () => {
    assertInClient();
    await assertSameSearchSession();
  });
  const handleClick = async ({label, valid}) => {
    processing = true;

    await sendMessages([
      {
        type: 'text',
        text: isArticleSubmission ? `${SOURCE_PREFIX_FRIST_SUBMISSION}${label}`:`${SOURCE_PREFIX_NOT_YET_REPLIED}${label}`,
      }
    ]);

    if(valid) {
      page.set('reason');
    } else {
      liff.closeWindow();
    }

    processing = false;
  }
</script>

<svelte:head>
  <title>{t`Provide more info`} (1/2)</title>
</svelte:head>

<style>
  main {
    padding: 16px;
    display: flex;
    flex-flow: column;
    gap: 8px;
  }
  main :global(.button) {
    color: var(--primary900);
    padding: 8px 16px;
  }
</style>

<main>
  <p>
    {t`How did you get the message?`}
  </p>

  {#each ARTICLE_SOURCE_OPTIONS as option}
    <Button
      class="button"
      variant="outlined"
      on:click={() => handleClick(option)}
      disabled={processing}
    >
      {option.label}
    </Button>
  {/each}
</main>