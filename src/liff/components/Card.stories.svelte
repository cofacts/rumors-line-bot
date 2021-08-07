<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Card from "./Card.svelte";

  function argsToStyle(args) {
    return Object.entries(args)
      .map(([key, value]) => value && `${key}: ${value};`)
      .filter(s => s)
      .join('')
  }

</script>

<Meta
  title="Card"
  component={Card}
  argTypes={{
    '--color': {control: {type: 'color'}},
    '--background': {control: {type: 'color'}},
    '--gap': {control: {type: 'text'}},
  }}
/>

<Story name="Demo" let:args>
  <Card style={argsToStyle(args)}>
    <div>Content 1</div>
    <div>Content 2</div>
  </Card>
</Story>
