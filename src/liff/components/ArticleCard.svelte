<script>
  import { t, msgid, ngettext } from 'ttag';
  import { format } from 'src/lib/sharedUtils';
  import Card from './Card.svelte';
  const MAX_TEXT_HEIGHT = 100; // px

  export let article;
  const {
    createdAt,
    text,
    replyRequestCount,
    articleType,
    attachmentUrl,
  } = article;
  const createdAtStr = createdAt ? format(new Date(createdAt)) : '';
  const firstReportedStr = t`First reported on ${createdAtStr}`;

  const reportCountText = ngettext(
    msgid`${replyRequestCount} person reported`,
    `${replyRequestCount} people reported`,
    replyRequestCount
  );

  // Measured text height.
  // Default to MAX to trigger collapsed view to avoid too much flicker.
  //
  let textHeight = MAX_TEXT_HEIGHT;

  let isExpanded = false;
  $: isTooLong = textHeight >= MAX_TEXT_HEIGHT;

  function handleExpandClick() {
    isExpanded = !isExpanded;
  }
</script>

<style>
  .measurerContainer {
    height: 0;
    padding: 0 16px;
    overflow: hidden;
  }
  .measurer {
    white-space: pre-line;
  }
  aside {
    color: var(--secondary200);
  }
  article {
    white-space: pre-line;
  }
  article.truncated {
    /* collapse line breaks when truncated to fit in more text */
    white-space: normal;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .expandLink {
    cursor: pointer;
    color: var(--blue1);
    text-decoration: none;
  }
  .replacedContent {
    max-width: 100%;
    max-height: 640px;
  }
</style>
{#if text}
  <div class="measurerContainer">
    <div class="measurer" bind:clientHeight={textHeight}>
      {text}
    </div>
  </div>
{/if}
<Card style="--gap: 8px">
  <aside>{firstReportedStr}｜{reportCountText}</aside>
  {#if articleType === 'IMAGE'}
    <img class="replacedContent" src={attachmentUrl} alt={text} />
  {:else if articleType === 'VIDEO'}
    {#if !attachmentUrl}
      {t`A video`} ({t`Preview not supported yet`})
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video class="replacedContent" src={attachmentUrl} controls />
    {/if}
  {:else if articleType === 'AUDIO'}
    {#if !attachmentUrl}
      {t`An audio`} ({t`Preview not supported yet`})
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <audio src={attachmentUrl} controls />
    {/if}
  {/if}
  {#if text}
    <article class:truncated={isTooLong && !isExpanded}>
      {text}
    </article>
  {/if}
  {#if text && isTooLong }
    <!-- svelte-ignore a11y-missing-attribute -->
    <a class="expandLink" role="button" on:click={handleExpandClick}>
      {isExpanded ? `${t`Show Less`} ▲` : `${t`Show More`} ▼`}
    </a>
  {/if}
</Card>