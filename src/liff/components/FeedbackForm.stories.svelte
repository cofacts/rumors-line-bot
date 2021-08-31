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
    vote: {
      options: [null, 'UPVOTE', 'DOWNVOTE'],
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
  args={{ vote: 'UPVOTE' }}
/>

<Story
  name="Downvoted"
  args={{ vote: 'DOWNVOTE' }}
/>