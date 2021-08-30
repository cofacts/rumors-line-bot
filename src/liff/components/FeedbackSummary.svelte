<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from 'ttag';
  import Card from './Card.svelte';
  import Button from './Button.svelte';

  export let ownVote; // 1 | -1
  export let feedbackCount = 1;

  /* # of feedbacks from others */
  const otherFeedbackCount = feedbackCount - 1

  const summaryText = otherFeedbackCount > 0
    ? t`We've received feedback from you and ${otherFeedbackCount} other users!`
    : t`Thanks. You're the first one who gave feedback on this reply!`;

  const dispatch = createEventDispatcher();
</script>

<style>
  :global(.feedbackSummary) {
    --color: #fff;
  }
  .buttons {
    display: grid;
    grid-auto-flow: column;
    column-gap: 8px;
  }
</style>

<Card
  class="feedbackSummary"
  style={`--background: var(${ownVote === 1 ? '--green2' : '--red2'})`}
>
  {summaryText}
  <div class="buttons">
    <Button on:click={() => dispatch('edit')}>
      {t`Edit feedback`}
    </Button>
  </div>
</Card>