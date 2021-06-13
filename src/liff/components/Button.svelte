<script>
  import clsx from 'clsx';

  // primary || outlined
  export let variant = 'outlined';
</script>

<style>
  .btn {
    appearance: none;
    padding: 8px;
  }

  .outlined {
    background: transparent;
    border: 2px solid currentColor;
  }

  .outlined:hover {
    background: rgba()
  }

  .primary {
    background: #fff;
  }

  .btn:disabled {
    pointer-events: none;
  }
</style>

<button class={clsx('btn', variant)} {...$$restProps}>
  <slot />
</button>
