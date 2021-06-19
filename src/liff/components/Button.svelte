<script>
  import clsx from 'clsx';

  // outlined | 'contained'
  export let variant = 'outlined';

  let className = '';
  export { className as class };
</script>

<style>
  .btn {
    appearance: none;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 32px;
  }

  .outlined {
    background: transparent;
    border: 2px solid currentColor;
    padding: 6px 10px; /* shrink padding for border */
  }

  .outlined:hover {
    background: rgba(255, 255, 255, 0.8);
  }

  .contained {
    background: var(--secondary50);
    border: 0;
  }

  .contained:hover {
    background: #fff;
  }

  .btn:disabled {
    pointer-events: none;
    opacity: 0.4;
  }
</style>

<button
  class={clsx('btn', className, variant)}
  type="button"
  {...$$restProps}
  on:click
>
  <slot />
</button>
