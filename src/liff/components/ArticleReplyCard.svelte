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
  const repliedAt = t`Replied ${ repliedAtWord }`;

</script>

<style>
  header {
    display: flex;
    align-items: center;
  }

  .avatar {
    flex-shrink: 0;
    position: relative;
    margin: 0;
    height: 44px;
    margin-right: 12px;
  }
  .avatar > img {
    width: 32px;
    height: 32px;
    border-radius: 16px;
  }
  .avatar > figcaption {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 0);
    border: 1px solid #fff;
    background: var(--secondary500);
    color: #fff;
    white-space: nowrap;
    border-radius: 8px;
    font-size: 10px;
    line-height: 14px;
    padding: 0 5px;
  }
  .avatar :global(.replyTypeIcon) {
    width: 16px;
    height: 16px;
    position: absolute;
    top: -3px;
    right: -5px;
  }

  .title {
    font-weight: 700;
  }
  .title.opinionated {
    color: var(--blue1);
  }
  .title.notArticle {
    color: var(--secondary900);
  }
  .title.rumor {
    color: var(--red1);
  }
  .title.notRumor {
    color: var(--green1);
  }
  time {
    color: var(--secondary200);
  }
  article {
    white-space: pre-line;
  }
  hr {
    border: 0;
    margin: 0;
    border-top: 1px dashed var(--secondary100);
  }
  h3 {
    color: var(--secondary200);
    font-size: 16px;
    margin: 0;
  }
</style>

<Card>
  <header>
    {#if articleReply.user.avatarUrl }
      <figure class="avatar">
        <ReplyTypeIcon class="replyTypeIcon" width={16} height={16} strokeWidth={4}/>
        <img src={articleReply.user.avatarUrl} alt={articleReply.user.name} />
        <figcaption>Lv{articleReply.user.level}</figcaption>
      </figure>
    {/if}
    <div>
      <div
        class="title"
        class:opinionated={articleReply.replyType === 'OPINIONATED'}
        class:notArticle={articleReply.replyType === 'NOT_ARTICLE'}
        class:notRumor={articleReply.replyType === 'NOT_RUMOR'}
        class:rumor={articleReply.replyType === 'RUMOR'}
      >
        {title}
      </div>
      <time>{repliedAt}</time>
    </div>
  </header>
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
</Card>