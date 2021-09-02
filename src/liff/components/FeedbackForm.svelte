<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from 'ttag';

  import TextArea from './TextArea.svelte';
  import Button from './Button.svelte';
  import ThumbsUpIcon from './icons/ThumbsUpIcon.svelte';
  import ThumbsUpOutlineIcon from './icons/ThumbsUpOutlineIcon.svelte';
  import ThumbsDownIcon from './icons/ThumbsDownIcon.svelte';
  import ThumbsDownOutlineIcon from './icons/ThumbsDownOutlineIcon.svelte';

  /** CofactsAPIFeedbackVote | null ;  'UPVOTE' | 'DOWNVOTE' | null */
  export let vote = null;
  export let disabled = false;
  export let comment = '';

  const dispatch = createEventDispatcher();
  const handleCommentSubmit = () => {
    dispatch('comment', comment);
  }
</script>

<style>
  section {
    display: flex;
    flex-flow: column;
    padding: 16px;

    color: #fff;
    font-size: 16px;
    background: var(--bg);
  }

  section.notVotedYet {
    --bg: var(--primary500);
  }

  section.upvoted {
    --bg: var(--green1);
  }

  section.downvoted {
    --bg: var(--red1);
  }

  p {
    margin: 0;
  }

  .buttons {
    display: grid;
    grid-auto-flow: column;
    column-gap: 8px;
  }

  form {
    display: flex;
    flex-flow: column;

    position: relative; /* for .bg-icon */
    flex: 1; /* extend to container size */
    margin: 0; /* reset browser native style */
  }

  form :global(.bg-icon) {
    position: absolute;
    width: 76px;
    height: 76px;
    top: -12px;
    right: -12px;
    opacity: 0.16;
  }

  form :global(textarea) {
    margin: 16px 0 20px;
    min-height: 80px;
    flex: 1; /* extend to container size */
  }

  .emphasize {
    font-weight: 700;
  }
</style>

<section
  class:notVotedYet={vote === null}
  class:upvoted={vote === 'UPVOTE'}
  class:downvoted={vote === 'DOWNVOTE'}
  {...$$restProps}
>
  {#if vote === null}
    <p style="margin-bottom: 4px;">{t`Please help Cofacts editors`}</p>
  {/if}
  <p class:emphasize={vote === null}>
    {t`Is the reply helpful?`}
  </p>
  <div class="buttons" style={`margin: 12px 0 ${ vote === null ? 0 : 20 }px`}>
    <Button
      variant={vote === 'DOWNVOTE' ? 'outlined' : 'contained'}
      style={`color: ${vote === 'DOWNVOTE' ? '#fff' : 'var(--bg)'};`}
      {disabled}
      on:click={() => dispatch('vote', 'UPVOTE')}
    >
      {#if vote === 'UPVOTE'}
        <ThumbsUpIcon />
      {:else}
        <ThumbsUpOutlineIcon />
      {/if}
      {t`Yes`}
    </Button>
    <Button
      variant={vote === 'UPVOTE' ? 'outlined' : 'contained'}
      style={`color: ${vote === 'UPVOTE' ? '#fff' : 'var(--bg)'};`}
      {disabled}
      on:click={() => dispatch('vote', 'DOWNVOTE')}
    >
      {#if vote === 'DOWNVOTE'}
        <ThumbsDownIcon />
      {:else}
        <ThumbsDownOutlineIcon />
      {/if}
      {t`No`}
    </Button>
  </div>

  {#if vote !== null}
    <form on:submit|preventDefault={handleCommentSubmit}>
      {#if vote === 'UPVOTE'}
        <ThumbsUpIcon class="bg-icon" />
        <p>{t`It's glad to see the reply is helpful.`}</p>
        <p class="emphasize" style="margin-top: 4px;">
          {t`Do you have anything to add about the reply?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is helpful and I want to add...`}
          bind:value={comment}
        />
      {:else if vote === 'DOWNVOTE'}
        <ThumbsDownIcon class="bg-icon" />
        <p>{t`We are sorry that the reply is not helpful to you.`}</p>
        <p class="emphasize" style="margin-top: 4px;">
          {t`How can we make it helpful to you?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is not helpful and I suggest...`}
          bind:value={comment}
        />
      {/if}
      <div class="buttons">
        <Button type="submit" disabled={disabled || (vote === 'DOWNVOTE' && comment.length === 0)}>
          {#if comment.length > 0}
            {t`Submit`}
          {:else if vote === 'DOWNVOTE'}
            {t`Please provide your comment above`}
          {:else}
            {t`Close`}
          {/if}
        </Button>
      </div>
    </form>
  {/if}
</section>