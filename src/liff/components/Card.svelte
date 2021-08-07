<script>
  export let style;
</script>

<style>
  .card {
    background: var(--background, #fff);
    color: var(--color, var(--secondary500));

    padding: 16px;

    /* For iOS devices < 14.7, which does not support flexbox gap... */
    display: grid;
    grid-auto-flow: row;

    /* Introduces "--gap" variable */
    row-gap: var(--gap, 16px);
  }
</style>

<div class="card" {style}>
  <slot />
</div>