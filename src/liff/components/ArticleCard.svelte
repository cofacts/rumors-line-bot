<script>
  import { t, msgid, ngettext } from 'ttag';
  import { format } from 'src/lib/sharedUtils';
  import Card from './Card.svelte';
  const MAX_TEXT_HEIGHT = 100; // px

  export let createdAt;
  const createdAtStr = createdAt ? format(createdAt) : '';
  const firstReportedStr = t`First reported on ${createdAtStr}`;

  export let replyRequestCount;
  const reportCountText = ngettext(
    msgid`${replyRequestCount} person reported`,
    `${replyRequestCount} people reported`,
    replyRequestCount
  );

  export let text = '';

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
</style>
<div class="measurerContainer">
  <div class="measurer" bind:clientHeight={textHeight}>
    {text}
  </div>
</div>
<Card style="--gap: 8px">
  <aside>{firstReportedStr}｜{reportCountText}</aside>
  <article
    class:truncated={isTooLong && !isExpanded}
  >{text}</article>
  {#if isTooLong }
    <!-- svelte-ignore a11y-missing-attribute -->
    <a class="expandLink" role="button" on:click={handleExpandClick}>
      {isExpanded ? `${t`Show Less`} ▲` : `${t`Show More`} ▼`}
    </a>
  {/if}
</Card>