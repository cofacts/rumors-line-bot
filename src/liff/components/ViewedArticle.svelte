<script>
  import { t, ngettext, msgid } from 'ttag';
  import { format } from 'src/lib/sharedUtils';

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
  article {
    margin: 0 0 12px;
    padding: 16px;
    background: #fff;
    cursor: pointer;
  }

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

<article on:click>
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
</article>