<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import FeedbackSummary from "./FeedbackSummary.svelte";
</script>

<Meta
  title="FeedbackSummary"
  component={FeedbackSummary}
  argTypes={{
    onEdit: {action: 'onEdit'},
    feedbackCount: 1,
    ownVote: {
      options: [1, -1],
      control: {type: 'radio'}
    }
  }}
/>

<Template let:args>
  <FeedbackSummary
    {...args}
    on:edit={args.onEdit}
  />
</Template>

<Story
  name="Upvoted"
  args={{ ownVote: 1 }}
/>

<Story
  name="Downvoted"
  args={{ ownVote: -1 }}
/>