<script>
  import clsx from 'clsx';

  export let style;
  let className = '';
  export { className as class };
</script>

<style>
  .card {
    display: grid;
    grid-auto-flow: row;
    row-gap: var(--gap, 16px);

    padding: 16px;

    background: var(--background, #fff);
    color: var(--color, var(--secondary500));
  }
</style>

<div class={clsx('card', className)} {style} on:click>
  <slot />
</div>
