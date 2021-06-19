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

  const dispatch = createEventDispatcher();
  const handleCommentSubmit = event => {
    const comment = event.target.elements.comment.value;
    dispatch('comment', comment);
  }
</script>

<style>
  section {
    padding: 16px;
    display: flex;
    flex-flow: column;
    gap: 8px;
    color: #fff;
    font-size: 16px;
  }

  section.notVotedYet {
    background: var(--primary500);
  }

  section.upvoted {
    background: var(--green1);
  }

  section.downvoted {
    background: var(--red1);
  }

  .buttons {
    display: flex;
    gap: 8px;
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
    {t`Is this reply useful?`}
  </p>
  <div class="buttons">
    <Button
      variant={score === -1 ? 'outlined' : 'contained'}
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
        <p>{t`It's glad to see the reply is helpful.`}</p>
        <p class="emphasize">
          {t`Do you have anything to add about the reply?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is useful and I want to add`}
        />
      {:else if score === -1}
        <p>{t`We are sorry that the reply is not useful to you.`}</p>
        <p class="emphasize">
          {t`How can we make it useful to you?`}
        </p>
        <TextArea
          name="comment"
          placeholder={t`I think the reply is not useful and I suggest`}
        />
      {/if}
      <Button type="submit" {disabled}>
        {t`Submit`}
      </Button>
    </form>
  {/if}
</section>