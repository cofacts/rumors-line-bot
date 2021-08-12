<script>
  export let style;
</script>
<style>
  h1 {
    font-weight: 700;
    font-size: 1em;
    color: var(--secondary300);
    margin: 24px 16px 8px;
  }

  h1:first-of-type {
    margin-top: 8px;
  }
</style>
<h1 {style}>
  <slot />
</h1>
