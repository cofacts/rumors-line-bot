<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import ArticleReplyCard from "./ArticleReplyCard.svelte";

  // Should match ArticleReplyCard_articleReply fragment
  const mockedArticleReply = {
    // --- ArticleReplyHeader_articleReply
    replyType: 'RUMOR',
    user: {
      name: 'Editor',
      avatarUrl: 'https://placekitten.com/100/100',
      level: 7,
    },
    createdAt: '2020-01-01T00:00:00.000Z',
    // ---

    articleId: 'foo',
    reply: {
      id: 'bar',
      text: 'This is reply text',
      reference: 'This is reference text\nhttps://google.com',
      positiveFeedbackCount: 5,
      negativeFeedbackCount: 6,
      ownVote: null
    }
  };
</script>

<Meta
  title="Card/ArticleReplyCard"
  component={ArticleReplyCard}
  args={{
    replyRequestCount: 1,
  }}
/>

<Template let:args>
  <ArticleReplyCard {...args} />
</Template>

<Story
  name="Rumor"
  args={{articleReply: mockedArticleReply}}
/>

<Story
  name="Opinionated, yesterday"
  args={{articleReply: {
    ...mockedArticleReply,
    replyType: 'OPINIONATED',
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
  }}}
/>

<Story
  name="No reference"
  args={{articleReply: {
    ...mockedArticleReply,
    replyType: 'NOT_ARTICLE',
    reply: {
      ...mockedArticleReply.reply,
      reference: null,
    }
  }}}
/>
