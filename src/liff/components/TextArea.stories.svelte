<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import { action } from "@storybook/addon-actions";
  import TextArea from "./TextArea.svelte";
</script>

<style>
  .colorBg {
    padding: 8px;
    background: var(--primary500);
    color: #fff;
  }
</style>

<Meta
  title="TextArea"
  component={TextArea}
/>

<Template let:args>
  <div class="colorBg">
    <TextArea {...args} />
  </div>
</Template>

<Story
  name="Textarea"
  args={{
    placeholder: 'Placeholder here'
  }}
  argTypes={{
    value: { type: 'string' },
  }}
/>
