<script>
  export let style;
</script>
<style>
  div {
    display: flex;
    justify-content: center;
    color: var(--secondary100);
    --default-dot-size: 4px;
    padding: var(--dot-size, var(--default-dot-size));
  }

  div::before {
    content: '';
    width: var(--dot-size, var(--default-dot-size));
    height: var(--dot-size, var(--default-dot-size));
    border-radius: var(--dot-size, var(--default-dot-size));
    background: currentColor;

    box-shadow: calc(2 * var(--dot-size, var(--default-dot-size))) 0 currentColor,
      calc(-2 * var(--dot-size, var(--default-dot-size))) 0 currentColor;
  }
</style>
<div {style} />
