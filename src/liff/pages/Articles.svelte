<script>
  import { onMount } from 'svelte';
  import { gql, assertInClient, getArticlesFromCofacts } from '../lib';

  let articleData = null;
  let articleMap = {};

  onMount(async () => {
    assertInClient();
    const {
      data: {userArticleLinks},
      errors: linksErrors,
    } = await gql`
      query ListUserArticleLinks {
        userArticleLinks {
          articleId
          createdAt
        }
      }
    `();

    if(linksErrors) {
      alert(linksErrors[0].message);
      return;
    }

    articleData = userArticleLinks;

    const articlesFromCofacts = await getArticlesFromCofacts(userArticleLinks.map(({articleId}) => articleId));
    articlesFromCofacts.forEach(article => {
      if(!article) return;
      articleMap[article.id] = article;
    })
  })
</script>

{#if articleData === null}
  <p>Loading...</p>
{:else}
  <ul>
    {#each articleData as link}
      <li>{link.articleId} / {articleMap[link.articleId] ? articleMap[link.articleId].text : 'Loading...'} / {link.createdAt}</li>
    {/each}
  </ul>
{/if}