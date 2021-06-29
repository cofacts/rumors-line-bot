<script>
  export let checked = false;
  export let disabled = false
</script>

<style>
  label {
    position: relative; /* for input */
  }

  input {
    opacity: 0;
    position: absolute;
    z-index: -1;
  }

  .track {
    height: 1em;
    width: 2.4em;
    border-radius: 1em;
    background: var(--secondary200);
    position: relative;
    transition: background-color .1s;
    cursor: pointer;
  }

  .knob {
    width: 1.2em;
    height: 1.2em;
    border-radius: 1em;
    border: 1px solid var(--secondary200);
    background: var(--secondary50);
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(0, -50%);
    transition: transform .1s ease-in-out;
  }

  input:checked ~ .track {
    background: var(--primary300);
  }

  input:checked ~ .track > .knob {
    background: var(--primary700);
    border-color: var(--primary700);
    transform: translate(100%, -50%);
  }

  input:disabled ~ .track {
    cursor: not-allowed;
    opacity: 0.3;
  }
</style>

<label {...$$restProps}>
  <input
    type="checkbox"
    bind:checked={checked}
    on:change
    {disabled}
  />
  <div class="track">
    <span class="knob" />
  </div>
</label>
