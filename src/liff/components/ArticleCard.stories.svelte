<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import ArticleCard from "./ArticleCard.svelte";

  const DEFAULT_ARGS = {
    article: {
      replyRequestCount: 1,
      createdAt: new Date(new Date() - 86400000).toISOString(),
      articleType: 'TEXT',
      text: '',
    }
  }
</script>

<Meta
  title="Card/ArticleCard"
  component={ArticleCard}
  args={DEFAULT_ARGS}
/>

<Template let:args>
  <ArticleCard {...args} />
</Template>

<Story
  name="Short text"
  args={{
    article: {
      ...DEFAULT_ARGS.article,
      text: 'Short text\nwith one line break',
    },
  }}
/>

<Story
  name="Long text"
  args={{
    article: {
      ...DEFAULT_ARGS.article,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    }
  }}
/>

<Story
  name="Many line breaks"
  args={{
    article: {
      ...DEFAULT_ARGS.article,
      text: 'So\nmany\n\n\nline\nbreaks',
    }
  }}
/>

<Story name="Image">
  Vertical
  <ArticleCard article={{
    ...DEFAULT_ARGS.article,
    articleType: 'IMAGE',
    attachmentUrl: 'https://placekitten.com/600/900'
  }} />

  Horizontal
  <ArticleCard article={{
    ...DEFAULT_ARGS.article,
    articleType: 'IMAGE',
    attachmentUrl: 'https://placekitten.com/600/400'
  }} />
</Story>

<Story name="Video">
  Vertical
  <ArticleCard article={{
    ...DEFAULT_ARGS.article,
    articleType: 'VIDEO',
    attachmentUrl: 'https://drive.google.com/uc?id=1SQ9lc1-ghzw-SL6Dyb_UMN6hAPBAckvK&confirm=t'
  }} />

  Horizontal
  <ArticleCard article={{
    ...DEFAULT_ARGS.article,
    articleType: 'VIDEO',
    attachmentUrl: 'https://drive.google.com/uc?id=1DczThMYTmGV3GvDCAU2EPnhsBwVcoFQi&confirm=t'
  }} />
</Story>

<Story
  name="Audio"
  args={{
    article: {
      ...DEFAULT_ARGS.article,
      articleType: 'AUDIO',
      attachmentUrl: 'https://drive.google.com/uc?id=1D-K8hVcOw7UNbu80uJkAYMJd1HilAFOp&confirm=t',
    }
  }}
/>
