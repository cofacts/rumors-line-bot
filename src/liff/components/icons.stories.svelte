<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import CollapseIcon from "./icons/CollapseIcon.svelte";
  import ThumbsUpIcon from "./icons/ThumbsUpIcon.svelte";
  import ThumbsDownIcon from "./icons/ThumbsDownIcon.svelte";
  import ThumbsUpOutlineIcon from "./icons/ThumbsUpOutlineIcon.svelte";
  import ThumbsDownOutlineIcon from "./icons/ThumbsDownOutlineIcon.svelte";
  import NotRumorIcon from "./icons/NotRumorIcon.svelte";
  import NotArticleIcon from "./icons/NotArticleIcon.svelte";
  import RumorIcon from "./icons/RumorIcon.svelte";
  import OpinionatedIcon from "./icons/OpinionatedIcon.svelte";
  import SingleColorLogo from "./icons/SingleColorLogo.svelte";
</script>

<Meta
  title="Icons"
  argTypes={{width: {type: 'number'}, height: {type: 'number'}}}
/>

<Template let:args={{components, color, width, height, strokeWidth}}>
  {#each components as iconComp}
    <figure style={`color: ${color}`}>
      <svelte:component this={iconComp} {width} {height} {strokeWidth} />
      <figcaption>{iconComp.name}</figcaption>
    </figure>
  {/each}
</Template>

<Story
  name="Icons"
  args={{
    components: [
      CollapseIcon,
      ThumbsUpIcon,
      ThumbsUpOutlineIcon,
      ThumbsDownIcon,
      ThumbsDownOutlineIcon,
      SingleColorLogo,
    ],
    color: 'var(--primary800)',
  }}
/>

<Story
  name="Reply types"
  args={{
    components: [
      NotRumorIcon,
      RumorIcon,
      OpinionatedIcon,
      NotArticleIcon,
    ],
    strokeWidth: 0,
  }}
/>

<style>
  figure {
    display: inline-block;
    text-align: center;
  }
</style>