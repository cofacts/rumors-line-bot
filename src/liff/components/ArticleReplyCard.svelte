<script>
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
    
  
  </header>


</Card>