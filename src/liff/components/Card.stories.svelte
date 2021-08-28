<script>
  import { Meta, Story } from "@storybook/addon-svelte-csf";
  import Card from "./Card.svelte";
  import { argsToStyle } from "./storiesUtils"
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

<Story name="Basic Card" let:args>
  <Card style={argsToStyle(args)}>
    <div>Content 1</div>
    <div>Content 2</div>
  </Card>
</Story>
