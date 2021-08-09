<script>
  import { onMount } from 'svelte';
  import { t, ngettext, msgid } from 'ttag';
  import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
  import { gql, assertInClient, getArticlesFromCofacts, sendMessages } from '../lib';
  import ViewedArticle from '../components/ViewedArticle.svelte';
  import Pagination from '../components/Pagination.svelte';

  let linksData = null;
  let isLoadingData = false; // If is in process of loadData()
  let articleMap = {};

  let selectArticle = async articleId => {
    await Promise.all([
      sendMessages([{
        type: 'text',
        text: `${VIEW_ARTICLE_PREFIX}${getArticleURL(articleId)}`,
      }]),
      new Promise(
        resolve =>
          gtag('event', 'ChooseArticle', {
            event_category: 'LIFF',
            event_label: articleId,
            event_callback: () => resolve(),
          })
      )
    ]);
    liff.closeWindow();
  }

  let totalCountStr = '';
  $: {
    const totalCount = linksData ? linksData.totalCount : 0;
    totalCountStr = ngettext(msgid`${totalCount} message viewed`, `${totalCount} messages viewed`, totalCount);
  }

  const loadData = async ({before, after} = {}) => {
    isLoadingData = true;
    const {
      data: {userArticleLinks},
      errors: linksErrors,
    } = await gql`
      query ListUserArticleLinks($before: Cursor, $after: Cursor) {
        userArticleLinks(before: $before, after: $after) {
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
    `({before, after});

    if(linksErrors) {
      alert(linksErrors[0].message);
      return;
    }

    linksData = userArticleLinks;

    const articlesFromCofacts = await getArticlesFromCofacts(userArticleLinks.edges.map(({node: {articleId}}) => articleId));
    articlesFromCofacts.forEach(article => {
      if(!article) return;
      articleMap[article.id] = article;
    });

    isLoadingData = false;
  }

  onMount(async () => {
    assertInClient();
    await loadData();
  })
</script>
<style>
  .loading {
    margin: auto 0;
    align-self: center;
  }
  h1 {
    font-weight: 700;
    font-size: 1em;
    color: var(--secondary300);
    margin: 8px 16px;
  }
  .articles {
    display: grid;
    grid-auto-flow: row;
    row-gap: 12px;
  }
</style>

<svelte:head>
  <title>{t`Viewed messages`}</title>
</svelte:head>

{#if linksData === null}
  <p class="loading">{t`Fetching viewed messages`}...</p>
{:else}
  <h1>{totalCountStr}</h1>
  <div class="articles">
    {#each linksData.edges as linkEdge (linkEdge.cursor)}
      <ViewedArticle
        userArticleLink={linkEdge.node}
        article={articleMap[linkEdge.node.articleId]}
        on:click={() => selectArticle(linkEdge.node.articleId)}
      />
    {/each}
  </div>
  <Pagination
    disabled={isLoadingData}
    pageInfo={linksData.pageInfo}
    edges={linksData.edges}
    on:prev={() => loadData({before: linksData.edges[0].cursor})}
    on:next={() => loadData({after: linksData.edges[linksData.edges.length-1].cursor})}
  />
{/if}