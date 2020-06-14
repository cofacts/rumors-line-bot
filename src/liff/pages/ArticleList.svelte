<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql, assertInClient } from '../lib';

  assertInClient();
  let articlesPromise = gql`
    query ListUserArticleLinks {
      userArticleLinks {
        articleId
        createdAt
      }
    }
  `()

</script>

{#await articlesPromise}
  <p>Loading...</p>
{:then resp}
  <ul>
    {#each resp.data.userArticleLinks as link}
      <li>{link.articleId} / {link.createdAt}</li>
    {/each}
  </ul>
{:catch error}
  <p>{error.message}</p>
{/await}