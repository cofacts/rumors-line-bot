<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import Pagination from "./Pagination.svelte";
</script>

<Meta
  title="Pagination"
  component={Pagination}
  argTypes={{
    onPrev: {action: 'onPrev'},
    onNext: {action: 'onNext'},
  }}
/>

<Template let:args>
  <Pagination {...args} on:prev={args.onPrev} on:next={args.onNext} />
</Template>

<Story
  name="No Data"
/>

<Story
  name="pageInfo and edges given"
  args={{
    pageInfo: {
      firstCursor: '0',
      lastCursor: '5',
    },
    edges: [
      {cursor: '2'},
      {cursor: '3'},
    ]
  }}
/>

<Story
  name="disabled"
  args={{
    disabled: true,
    pageInfo: {
      firstCursor: '0',
      lastCursor: '5',
    },
    edges: [
      {cursor: '2'},
      {cursor: '3'},
    ]
  }}
/>