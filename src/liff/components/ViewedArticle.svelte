<script>
  import { t } from 'ttag';
  import Card, { PrimaryAction, Content } from '@smui/card';

  export let userArticleLink;

  // The article from Cofacts API. null when still loading.
  export let article = null;

  $: viewedAt = userArticleLink.lastViewedAt ?
    userArticleLink.lastViewedAt :
    userArticleLink.createdAt;
  $: newArticleReplies = article ? article.articleReplies.map(ar => ar.createdAt > viewedAt ) : [];
</script>

<style>
  header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    line-height: 20px;
    color: #ADADAD;
    letter-spacing: 0.25px;
  }
  main {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.25px;
  }
</style>

<Card>
  <PrimaryAction on:click>
    <Content>
      <header>
        <span>
          {#if !article}
            {t`Loading`}...
          {:else if article.articleReplies.length === 0}
            {t`No replies yet`}
          {:else if newArticleReplies.length > 0}
            {newArticleReplies.length} {t`unread`}
          {:else}
            {article.articleReplies.length} {t`reply(s)`}
          {/if}
        </span>
        <span>
          {viewedAt}
        </span>
      </header>
      <main>
        {#if !article}
          {t`Loading`}...
        {:else}
          {article.text}
        {/if}
      </main>
    </Content>
  </PrimaryAction>
</Card>