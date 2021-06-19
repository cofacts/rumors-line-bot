<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import CollapseIcon from "./icons/CollapseIcon.svelte";
</script>

<Meta
  title="Icons"
/>

<Template let:args={{components, color, width, height}}>
  {#each components as iconComp}
    <figure style={`color: ${color}`}>
      <svelte:component this={iconComp} {width} {height} />
      <figcaption>{iconComp.name}</figcaption>
    </figure>
  {/each}
</Template>

<Story
  name="Icons"
  args={{
    components: [
      CollapseIcon
    ],
    color: 'var(--primary800)',
  }}
  argTypes={{width: {type: 'number'}, height: {type: 'number'}}}
/>

<style>
  figure {
    display: inline-block;
    text-align: center;
  }
</style>