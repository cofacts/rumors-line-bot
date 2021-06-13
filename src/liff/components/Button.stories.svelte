<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Button from "./Button.svelte";
</script>

<Meta
  title="Button"
  component={Button}
  argTypes={{
    onClick: {action: 'onClick'},
  }}
/>

<Template let:args>
  <Button {...args} on:click={args.onClick}>
    Button text
  </Button>
</Template>

<Story
  name="Empty button"
/>

<Story name="Variants">
  <Button variant="primary">variant = primary</Button>
  <Button variant="outlined">variant = outlined</Button>
</Story>

<Story name="Passed props"
  args={{
    disabled: true,
  }}
/>