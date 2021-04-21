<script>
  import { onMount } from 'svelte';
  import { gql } from '../lib';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');
  const replyId = params.get('replyId');

  let articleData;
  let articleReplies = [];

  const loadData = async () => {
    const {
      data: { GetArticle },
    } = await gql`
      query GetArticleInLIFF($id: String) {
        GetArticle(id: $id) {
          text
          articleReplies {
            reply {
              id
              text
            }
          }
        }
      }
    `({id: articleId});

    articleData = GetArticle;

    articleReplies = GetArticle.articleReplies.filter(({reply}) => replyId ? reply.id === replyId : true);
  }

  onMount(async () => {
    await loadData();
  })
</script>

<svelte:head>
  <title>Cofacts 網友協作回應</title>
</svelte:head>

{#if !articleData }
  <p>載入中...</p>
{:else}
  <details>
    {articleData.text}
  </details>

  <ul>
    {#each articleReplies as articleReply (articleReply.reply.id)}
      <li>
        {articleReply.reply.text}
      </li>
    {/each}
  </ul>
{/if}