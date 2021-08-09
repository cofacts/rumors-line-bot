<script>
  import { t, ngettext, msgid } from 'ttag';
  import { format } from 'src/lib/sharedUtils';
  import Card from './Card.svelte';

  /**
   * The userArticleLink from GraphQL
   */
  export let userArticleLink;

  const replyCount = userArticleLink.article?.articleReplies.length || 0;
  const viewedAt = userArticleLink.lastViewedAt ?
    new Date(userArticleLink.lastViewedAt) :
    new Date(userArticleLink.createdAt);
  const newArticleReplyCount = userArticleLink.article?.articleReplies.filter(
    ar => new Date(ar.createdAt) > viewedAt
  ).length || 0;

  const unreadStr = ngettext(msgid`${newArticleReplyCount} new reply`, `${newArticleReplyCount} new replies`, newArticleReplyCount);
  const repliesStr = ngettext(msgid`${replyCount} reply`, `${replyCount} replies`, replyCount);

  let viewedAtStr = '';
  $: {
    const dateString = format(viewedAt);
    viewedAtStr = t`Viewed on ${dateString}`;
  }
</script>

<style>
  :global(.ViewedArticle-root) {
    cursor: pointer;
    --gap: 8px;
  }

  header {
    display: flex;
    justify-content: space-between;
    color: var(--secondary200);
  }
  .unread {
    color: #fff;
    background: var(--primary500);
    padding: 0 4px;
    border-radius: 4px;
    font-weight: bold;
  }
  main {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
</style>

<Card class="ViewedArticle-root" on:click>
  <header>
    <span class={newArticleReplyCount ? 'unread' : ''}>
      {#if replyCount === 0}
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
    {userArticleLink.article?.text || ''}
  </main>
</Card>