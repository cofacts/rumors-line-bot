<script>
  export let style;
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

<div class="card" {style}>
  <slot />
</div>