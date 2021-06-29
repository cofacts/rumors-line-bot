<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Switch from "./Switch.svelte";
</script>

<Meta
  title="Switch"
  component={Switch}
  argTypes={{
    onChange: {action: 'onChange'},
  }}
/>

<Template let:args>
  <Switch {...args} on:change={args.onChange} />
</Template>

<Story name="Default" />
