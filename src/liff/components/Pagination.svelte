<script>
  import { t } from 'ttag';
  import Button, { Label } from '@smui/button';
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
  }
</style>

{#if pageInfo && edges }
  <div class="container">
    {#if pageInfo && pageInfo.firstCursor !== edges[0].cursor}
      <Button
        on:click={() => dispatch('prev') }
        disabled={disabled}
        variant="raised"
        color="secondary"
      >
        <Label>{t`Prev`}</Label>
      </Button>
    {/if}
    {#if pageInfo && pageInfo.lastCursor !== edges[edges.length-1].cursor}
      <Button
        on:click={() => dispatch('next') }
        disabled={disabled}
        variant="raised"
        color="secondary"
        style="margin-left: auto;"
      >
        <Label>{t`Next`}</Label>
      </Button>
    {/if}
  </div>
{/if}
