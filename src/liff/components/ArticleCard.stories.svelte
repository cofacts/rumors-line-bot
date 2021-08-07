<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import ArticleCard from "./ArticleCard.svelte";
</script>

<Meta
  title="ArticleCard"
  component={ArticleCard}
  args={{
    replyRequestCount: 1,
    createdAt: new Date(new Date() - 86400000),
  }}
/>

<Template let:args>
  <ArticleCard {...args} />
</Template>

<Story
  name="Short text"
  args={{text: 'Short text\nwith one line break'}}
/>

<Story
  name="Long text"
  args={{text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}}
/>

<Story
  name="Many line breaks"
  args={{text: 'So\nmany\n\n\nline\nbreaks'}}
/>
