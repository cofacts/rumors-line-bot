<script>
  import { t } from 'ttag';
  import { linkify } from '../lib';
  import Card from './Card.svelte';
  import ArticleReplyHeader from './ArticleReplyHeader.svelte';

  /** fragments.ArticleReplyCard_articleReply */
  export let articleReply;
</script>

<style>
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
  .noReference {
    color: var(--red2);
    margin: 0;
  }
</style>

<Card>
  <ArticleReplyHeader articleReply={articleReply} />
  <article>
    {articleReply.reply.text}
  </article>
  <hr />
  {#if articleReply.reply.reference}
    <h3>
      {articleReply.replyType === 'OPINIONATED' ? t`Opinion Sources` : t`References`}
    </h3>
    <article>
      {@html linkify(articleReply.reply.reference, 'target="_blank"')}
    </article>
  {:else}
    <p class="noReference">
      ⚠️️ {t`There is no reference for this reply. Its truthfulness may be doubtful.`}
    </p>
  {/if}
</Card>