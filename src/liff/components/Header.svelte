<script>
  export let style;
</script>
<style>
  h1 {
    font-weight: 700;
    font-size: 1em;
    color: var(--secondary300);
    margin: 0;
    padding: 24px 16px 8px;
  }

  h1:first-of-type {
    padding-top: 8px;
  }
</style>
<h1 {style}>
  <slot />
</h1>
