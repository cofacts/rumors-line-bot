<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql, assertInClient } from '../lib';

  let articleData = null;

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

  })
</script>

{#if articleData === null}
  <p>Loading...</p>
{:else}
  <ul>
    {#each articleData as link}
      <li>{link.articleId} / {link.createdAt}</li>
    {/each}
  </ul>
{/if}