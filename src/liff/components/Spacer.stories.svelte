<script>
  import { Meta, Story } from "@storybook/addon-svelte-csf";
  import Spacer from "./Spacer.svelte";
  import { argsToStyle } from "./storiesUtils"
</script>

<Meta
  title="Spacer"
  component={Spacer}
  args={{
    color: '--secondary100',
    '--dot-size': '4px',
  }}
/>

<Story name="Default" let:args>
  <Spacer style={argsToStyle(args)} />
</Story>
