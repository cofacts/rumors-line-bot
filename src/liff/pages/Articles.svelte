<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import Card, { PrimaryAction, Content } from '@smui/card';
  import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
  import { gql, assertInClient, getArticlesFromCofacts } from '../lib';

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
  header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    line-height: 20px;
    color: #ADADAD;
    letter-spacing: 0.25px;
  }
  main {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.25px;
  }
</style>

<svelte:head>
  <title>{t`Viewed messages`}</title>
</svelte:head>

{#if articleData === null}
  <p>Loading...</p>
{:else}
  {#each articleData as link (link.articleId)}
    <Card>
      <PrimaryAction on:click={() => selectArticle(link.articleId)}>
        <Content>
          <header>
            <span>
              {#if !articleMap[link.articleId]}
                {t`Loading`}...
              {:else if articleMap[link.articleId].articleReplies.length === 0}
                {t`No replies yet`}
              {:else if articleMap[link.articleId].articleReplies.map(ar => ar.createdAt > link.lastViewedAt).length > 0}
                {articleMap[link.articleId].articleReplies.map(ar => ar.createdAt > link.lastViewedAt).length} {t`unread`}
              {:else}
                {articleMap[link.articleId].articleReplies.length} {t`reply(s)`}
              {/if}
            </span>
            <span>
              {link.lastViewedAt}
            </span>
          </header>
          <main>
            {#if !articleMap[link.articleId]}
              {t`Loading`}...
            {:else}
              {articleMap[link.articleId].text}
            {/if}
          </main>
        </Content>
      </PrimaryAction>
    </Card>
  {/each}
{/if}