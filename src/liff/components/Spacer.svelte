<script>
  export let style;
</script>
<style>
  div {
    display: flex;
    justify-content: center;
    color: var(--secondary100);
    --dot-size: 4px;
    padding: var(--dot-size);
  }

  div::before {
    content: '';
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: var(--dot-size);
    background: currentColor;

    box-shadow: calc(2 * var(--dot-size)) 0 currentColor,
      calc(-2 * var(--dot-size)) 0 currentColor;
  }
</style>
<div {style} />
