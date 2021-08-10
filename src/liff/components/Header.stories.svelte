<script>
  import { Meta, Story } from "@storybook/addon-svelte-csf";
  import Header from "./Header.svelte";
  import { argsToStyle } from "./storiesUtils"
</script>

<Meta
  title="Header"
  component={Header}
  args={{
    text: 'Section header text here'
  }}
/>

<Story name="Default" let:args>
  <Header>
    {args.text}
  </Header>
</Story>
