<script>
  import { t, ngettext, msgid } from 'ttag';
  import { format } from 'src/lib/sharedUtils';
  import Card from './Card.svelte';

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
    new Date(userArticleLink.lastViewedAt) :
    new Date(userArticleLink.createdAt);
  $: newArticleReplyCount = article ? article.articleReplies.filter(ar => new Date(ar.createdAt) > viewedAt).length : 0;

  // String translation setup:
  // Svelte template will mess up with variable names, thus strings with variables
  // must be translated within <script> tag
  //
  $: unreadStr = ngettext(msgid`${newArticleReplyCount} new reply`, `${newArticleReplyCount} new replies`, newArticleReplyCount);
  $: repliesStr = ngettext(msgid`${replyCount} reply`, `${replyCount} replies`, replyCount);

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
  .img {
    max-width: 100%;
    max-height: 120px;
  }
</style>

<Card class="ViewedArticle-root" on:click>
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
    {:else if article.articleType === 'IMAGE'}
      <img class="img" src={article.attachmentUrl} alt={article.text} />
    {:else}
      {article.text}
    {/if}
  </main>
</Card>