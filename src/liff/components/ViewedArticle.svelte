<script>
  import { t, ngettext, msgid } from 'ttag';
  import Card, { PrimaryAction, Content } from '@smui/card';
  import { formatDistanceToNow } from 'src/lib/sharedUtils';

  /**
   * The userArticleLink from GraphQL
   */
  export let userArticleLink;

  /**
   * The article from Cofacts API. null when still loading.
   */
  export let article = null;

  $: replyCount = article ? article.articleReplies.length : 0;
  $: viewedAt = userArticleLink.lastViewedAt ?
    userArticleLink.lastViewedAt :
    userArticleLink.createdAt;
  $: newArticleReplyCount = article ? article.articleReplies.map(ar => ar.createdAt > viewedAt ).length : 0;

  // String translation setup:
  // Svelte template will mess up with variable names, thus strings with variables
  // must be translated within <script> tag
  //
  $: unreadStr = ngettext(msgid`${newArticleReplyCount} new reply`, `${newArticleReplyCount} new replies`, newArticleReplyCount);
  $: repliesStr = ngettext(msgid`${replyCount} reply`, `${replyCount} replies`, replyCount);

  let viewedAtStr = '';
  $: {
    const fromNow = formatDistanceToNow(new Date(viewedAt));
    viewedAtStr = t`Viewed ${fromNow} ago`;
  }

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
  .unread {
    color: #fff;
    background: #FFB600;
    padding: 0 4px;
    border-radius: 4px;
    font-weight: bold;
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

<Card style="margin-bottom: 8px;">
  <PrimaryAction on:click>
    <Content>
      <header>
        <span class={newArticleReplyCount ? 'unread' : ''}>
          {#if !article}
            {t`Loading`}...
          {:else if article.articleReplies.length === 0}
            {t`No replies yet`}
          {:else if newArticleReplyCount > 0}
            {unreadStr}
          {:else}
            {repliesStr}
          {/if}
        </span>
        <span>{viewedAtStr}</span>
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