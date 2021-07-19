<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import FeedbackForm from "./FeedbackForm.svelte";
</script>

<Meta
  title="FeedbackForm"
  component={FeedbackForm}
  argTypes={{
    onVote: {action: 'onVote'},
    onComment: {action: 'onComment'},
    score: {
      options: [null, 1, -1],
      control: {type: 'radio'}
    }
  }}
/>

<Template let:args>
  <FeedbackForm
    {...args}
    on:vote={args.onVote}
    on:comment={args.onComment}
  />
</Template>

<Story name="No Data"/>

<Story
  name="Upvoted"
  args={{ score: 1 }}
/>

<Story
  name="Downvoted"
  args={{ score: -1 }}
/>