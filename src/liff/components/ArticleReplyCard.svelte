<script>
  import { t } from 'ttag';
  import { createTypeWords, format } from 'src/lib/sharedUtils';
  import Card from './Card.svelte';
  import NotArticleIcon from './icons/NotArticleIcon.svelte';
  import NotRumorIcon from './icons/NotRumorIcon.svelte';
  import RumorIcon from './icons/RumorIcon.svelte';
  import OpinionatedIcon from './icons/OpinionatedIcon.svelte';

  /** fragments.ArticleReplyCard_articleReply */
  export let articleReply;

  const ReplyTypeIcon = (() => {
    switch(articleReply.replyType) {
      case 'OPINIONATED': return OpinionatedIcon;
      case 'NOT_ARTICLE': return NotArticleIcon;
      case 'NOT_RUMOR': return NotRumorIcon;
      case 'RUMOR': return RumorIcon;
    }
  })();

  const replyTypeWord = createTypeWords(articleReply.replyType).toLowerCase();
  const title = t`${articleReply.user.name} mark this message ${replyTypeWord}`;
  const repliedAtWord = format(new Date(articleReply.createdAt));
  const repliedAt = t`replied ${ repliedAtWord }`;

</script>

<style>
  header {

  }

  .avatar > img {
    width: 32px;
    height: 32px;
  }
  .avatar > figcaption {
    
  }
  .avatar :global(.replyTypeIcon) {
    width: 16px;
    height: 16px;
  }

  article {
    white-space: pre-line;
  }
</style>

<Card>
  <header>
    {#if articleReply.user.avatarUrl }
    <figure class="avatar">
      <ReplyTypeIcon class="replyTypeIcon" width={16} height={16} strokeWidth={2}/>
      <img src={articleReply.user.avatarUrl} alt={articleReply.user.name} />
      <figcaption>{articleReply.user.level}</figcaption>
    </figure>
    {/if}
    <div>
      <span class="title">{title}</span>
      <time>{repliedAt}</time>
    </div>
  </header>
  <main>
    <article>
      {articleReply.reply.text}
    </article>
    <hr />
    {#if articleReply.reply.reference}
      <h3>
        {articleReply.replyType === 'OPINIONATED' ? t`Opinion Sources` : t`References`}
      </h3>
      <article>
        {articleReply.reply.reference}
      </article>
    {:else}
      ⚠️️ {t`There is no reference for this reply. Its truthfulness may be doubtful.`}
    {/if}
  </main>
</Card>