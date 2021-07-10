<script>
  import { createEventDispatcher } from 'svelte';
  import { t } from 'ttag';

  import TextArea from './TextArea.svelte';
  import Button from './Button.svelte';
  import ThumbsUpIcon from './icons/ThumbsUpIcon.svelte';
  import ThumbsUpOutlineIcon from './icons/ThumbsUpOutlineIcon.svelte';
  import ThumbsDownIcon from './icons/ThumbsDownIcon.svelte';
  import ThumbsDownOutlineIcon from './icons/ThumbsDownOutlineIcon.svelte';

  /** Vote status. Values: null | 1 | -1 */
  export let score = null;
  export let disabled = false;
  export let comment = '';

  const dispatch = createEventDispatcher();
  const handleCommentSubmit = () => {
    dispatch('comment', comment);
  }
</script>

<style>
  section {
    padding: 16px;
    display: flex;
    flex-flow: column;
    gap: 4px;
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
    display: flex;
    gap: 8px;
  }

  .buttons > :global(*) {
    flex: 1;
  }

  form {
    display: flex;
    flex-flow: column;
    position: relative; /* for .bg-icon */
    flex: 1; /* extend to container size */
    gap: 4px;
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
    margin-top: 12px;
    min-height: 80px;
    flex: 1; /* extend to container size */
  }

  .emphasize {
    font-weight: 700;
  }
</style>

<section
  class:notVotedYet={score === null}
  class:upvoted={score === 1}
  class:downvoted={score === -1}
  {...$$restProps}
>
  {#if score === null}
    <p>{t`Please help Cofacts editors`}</p>
  {/if}
  <p class:emphasize={score === null}>
    {t`Is the reply helpful?`}
  </p>
  <div class="buttons" style={`margin: 8px 0 ${ score === null ? 4 : 16 }px`}>
    <Button
      variant={score === -1 ? 'outlined' : 'contained'}
      style={`color: ${score === -1 ? '#fff' : 'var(--bg)'};`}
      {disabled}
      on:click={() => dispatch('vote', 1)}
    >
      {#if score === 1}
        <ThumbsUpIcon />
      {:else}
        <ThumbsUpOutlineIcon />
      {/if}
      {t`Yes`}
    </Button>
    <Button
      variant={score === 1 ? 'outlined' : 'contained'}
      style={`color: ${score === 1 ? '#fff' : 'var(--bg)'};`}
      {disabled}
      on:click={() => dispatch('vote', -1)}
    >
      {#if score === -1}
        <ThumbsDownIcon />
      {:else}
        <ThumbsDownOutlineIcon />
      {/if}
      {t`No`}
    </Button>
  </div>

  {#if score !== null}
    <form on:submit|preventDefault={handleCommentSubmit}>
      {#if score === 1}
        <ThumbsUpIcon class="bg-icon" />
        <p>{t`It's glad to see the reply is helpful.`}</p>
        <p class="emphasize">
          {t`Do you have anything to add about the reply?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is useful and I want to add`}
          bind:value={comment}
        />
      {:else if score === -1}
        <ThumbsDownIcon class="bg-icon" />
        <p>{t`We are sorry that the reply is not useful to you.`}</p>
        <p class="emphasize">
          {t`How can we make it useful to you?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is not useful and I suggest`}
          bind:value={comment}
        />
      {/if}
      <div class="buttons" style="margin-top: 16px;">
        <Button type="submit" disabled={disabled || (score === -1 && comment.length === 0)}>
          {#if comment.length > 0}
            {t`Submit`}
          {:else if score === -1}
            {t`Please provide your comment above`}
          {:else}
            {t`Close`}
          {/if}
        </Button>
      </div>
    </form>
  {/if}
</section>