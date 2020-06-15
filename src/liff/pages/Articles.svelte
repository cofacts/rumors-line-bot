<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
  import { gql, assertInClient, getArticlesFromCofacts } from '../lib';
  import ViewedArticle from '../components/ViewedArticle';

  let articleData = null;
  let articleMap = {};

  let selectArticle = async articleId => {
    await liff.sendMessages([{
      type: 'text',
      text: `${VIEW_ARTICLE_PREFIX}${getArticleURL(articleId)}`,
    }]);
    liff.closeWindow();
  }

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
          lastViewedAt
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
<style>
</style>

<svelte:head>
  <title>{t`Viewed messages`}</title>
</svelte:head>

{#if articleData === null}
  <p>{t`Fetching viewed messages`}...</p>
{:else}
  {#each articleData as link (link.articleId)}
    <ViewedArticle
      userArticleLink={link}
      article={articleMap[link.articleId]}
      on:click={() => selectArticle(link.articleId)}
    />
  {/each}
{/if}