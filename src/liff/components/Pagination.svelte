<script>
  import { t } from 'ttag';
  import Button from './Button';
  import { createEventDispatcher } from 'svelte';

  /**
   * If we should disable the prev & next button
   */
  export let disabled = false;

  /**
   * PageInfo from GraphQL
   */
  export let pageInfo;

  /**
   * edges from GraphQL
   */
  export let edges;

  const dispatch = createEventDispatcher();
</script>

<style>
  .container {
    margin: 8px 0;
    display: flex;
    color: var(--secondary500);
  }
</style>

{#if pageInfo && edges }
  <div class="container">
    {#if pageInfo && pageInfo.firstCursor !== edges[0].cursor}
      <Button
        on:click={() => dispatch('prev') }
        disabled={disabled}
      >
        {t`Prev`}
      </Button>
    {/if}
    {#if pageInfo && pageInfo.lastCursor !== edges[edges.length-1].cursor}
      <Button
        on:click={() => dispatch('next') }
        disabled={disabled}
        style="margin-left: auto;"
      >
        {t`Next`}
      </Button>
    {/if}
  </div>
{/if}
