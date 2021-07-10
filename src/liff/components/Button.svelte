<script>
  import clsx from 'clsx';

  // outlined | 'contained'
  export let variant = 'outlined';

  let className = '';
  export { className as class };
</script>

<style>
  .btn {
    font-size: 18px;
    line-height: inherit;
    appearance: none;
    padding: 8px 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border-radius: 32px;
    transition: background-color .2s;
    cursor: pointer;
    color: inherit;
  }

  .outlined {
    background: transparent;
    border: 2px solid currentColor;
    padding: 6px 10px; /* shrink padding for border */

    position: relative;
  }

  .outlined::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: currentColor;
    border-radius: 32px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .outlined:hover::before {
    opacity: 0.2;
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
