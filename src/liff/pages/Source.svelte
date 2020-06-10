<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Button, { Label } from '@smui/button';

  import { page } from '../lib';
  import { ARTICLE_SOURCE_OPTIONS, SOURCE_PREFIX } from 'src/lib/sharedUtils';
  import { assertInClient } from '../lib';

  let processing = false;
  onMount(() => {
    assertInClient();
  });
  const handleClick = async ({label, valid}) => {
    processing = true;

    await liff.sendMessages([
      {
        type: 'text',
        text: `${SOURCE_PREFIX}${label}`,
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

<p>
  {t`How did you get the message?`}
</p>

{#each ARTICLE_SOURCE_OPTIONS as option}
  <Button
    style="display: block; width: 100%; margin-bottom: 8px;"
    variant="raised"
    on:click={() => handleClick(option)}
    disabled={processing}
  >
    <Label>{option.label}</Label>
  </Button>
{/each}