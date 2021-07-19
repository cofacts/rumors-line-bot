<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import { action } from "@storybook/addon-actions";
  import Button from "./Button.svelte";
</script>

<style>
  .colorBg {
    padding: 8px;
    background: var(--primary500);
    color: #fff;
  }
</style>

<Meta
  title="Button"
  component={Button}

  argTypes={{
    variant: {
      options: ['outlined', 'contained'],
      control: {type: 'radio'}
    }
  }}
/>

<Template let:args>
  <Button {...args} on:click={action('onClick')}>
    Button text
  </Button>
</Template>

<Story name="Button"
  args={{
    disabled: false,
    style: "color: var(--primary600)"
  }}
/>

<Story name="Variants">
  <Button variant="contained">variant = contained</Button>
  <Button variant="outlined">variant = outlined</Button>
  <div class="colorBg">
    <Button variant="contained">variant = contained</Button>
    <Button variant="outlined">variant = outlined</Button>
  </div>
</Story>

<Story name="Font colors">
  <div class="colorBg">
    <Button variant="contained" style="color: rebeccapurple;">rebeccapurple</Button>
    <Button variant="outlined" style="color: rebeccapurple;">rebeccapurple</Button>
  </div>
</Story>