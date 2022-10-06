<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import ViewedArticle from "./ViewedArticle.svelte";
</script>

<Meta
  title="ViewedArticle"
  component={ViewedArticle}
  argTypes={{
    onClick: {action: 'onClick'},
  }}
  args={{
    userArticleLink: {
      lastViewedAt: '2021-06-04T00:00:00.000Z',
      createdAt: '1989-06-04T00:00:00.000Z',
    }
  }}
/>

<Template let:args>
  <ViewedArticle {...args} on:click={args.onClick} />
</Template>

<Story
  name="No Data"
/>

<Story
  name="Article with no reply"
  args={{
    article: {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      articleReplies: [],
      articleType: 'TEXT',
    }
  }}
/>

<Story
  name="Article with two old replies"
  args={{
    article: {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      articleReplies: [{
        createdAt: '2020-06-04T00:00:00Z'
      }, {
        createdAt: '2019-06-04T00:00:00Z'
      }],
      articleType: 'TEXT',
    }
  }}
/>

<Story
  name="Article with 1 new and 1 old reply"
  args={{
    article: {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      articleReplies: [{
        createdAt: '2021-06-12T00:00:00Z'
      }, {
        createdAt: '2019-06-04T00:00:00Z'
      }],
      articleType: 'TEXT',
    }
  }}
/>

<Story
  name="Horizontal image"
  args={{
    article: {
      attachmentUrl: 'https://placekitten.com/400/240',
      articleReplies: [],
      articleType: 'IMAGE',
    }
  }}
/>

<Story
  name="Vertical image"
  args={{
    article: {
      attachmentUrl: 'https://placekitten.com/200/240',
      articleReplies: [],
      articleType: 'IMAGE',
    }
  }}
/>
