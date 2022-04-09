<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import ReplyRequestForm from "./ReplyRequestForm.svelte";
</script>

<Meta
  title="ReplyRequestForm"
  component={ReplyRequestForm}
  argTypes={{
    searchedText: {type: 'string'},
    disabled: {type: 'boolean'},
    reason: {type: 'string'},
    onSubmit: {action: 'onSubmit'},
  }}
/>

<Template let:args>
  <ReplyRequestForm
    {...args}
    on:submit={args.onSubmit}
  />
</Template>

<Story name="Default"/>

<Story
  name="Blocks identical message"
  args={{
    reason: 'This message is identical to searchText, will be blocked on submit',
    searchedText: 'This message is identical to searchText, will be blocked on submit',
  }}
/>
