<script>
  import { onMount } from 'svelte';
  import { t, ngettext, msgid } from 'ttag';
  import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
  import { gql, assertInClient, getArticlesFromCofacts } from '../lib';
  import ViewedArticle from '../components/ViewedArticle.svelte';

  let linksData = null;
  let articleMap = {};

  let selectArticle = async articleId => {
    await liff.sendMessages([{
      type: 'text',
      text: `${VIEW_ARTICLE_PREFIX}${getArticleURL(articleId)}`,
    }]);
    liff.closeWindow();
  }

  let totalCountStr = '';
  $: {
    const totalCount = linksData ? linksData.totalCount : 0;
    totalCountStr = ngettext(msgid`${totalCount} message viewed`, `${totalCount} messages viewed`, totalCount);
  }

  onMount(async () => {
    assertInClient();
    const {
      data: {userArticleLinks},
      errors: linksErrors,
    } = await gql`
      query ListUserArticleLinks {
        userArticleLinks {
          totalCount
          pageInfo {
            firstCursor
            lastCursor
          }
          edges {
            cursor
            node {
              articleId
              createdAt
              lastViewedAt
            }
          }
        }
      }
    `();

    if(linksErrors) {
      alert(linksErrors[0].message);
      return;
    }

    linksData = userArticleLinks;

    const articlesFromCofacts = await getArticlesFromCofacts(userArticleLinks.edges.map(({node: {articleId}}) => articleId));
    articlesFromCofacts.forEach(article => {
      if(!article) return;
      articleMap[article.id] = article;
    })
  })
</script>
<style>
  .total {
    font-size: 12px;
    line-height: 20px;
    color: #ADADAD;
  }
</style>

<svelte:head>
  <title>{t`Viewed messages`}</title>
</svelte:head>

{#if linksData === null}
  <p>{t`Fetching viewed messages`}...</p>
{:else}
  <p class="total">{totalCountStr}</p>
  {#each linksData.edges as linkEdge (linkEdge.cursor)}
    <ViewedArticle
      userArticleLink={linkEdge.node}
      article={articleMap[linkEdge.node.articleId]}
      on:click={() => selectArticle(linkEdge.node.articleId)}
    />
  {/each}
{/if}