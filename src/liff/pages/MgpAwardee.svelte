<script>
  import { onMount } from 'svelte';

  const userId = liff.getDecodedIDToken().sub;
  let iframeUrl = `https://www.surveycake.com/s/Xx6mp?ssn0=${userId}`;
  let state = 'LOADING'; // LOADING, INVALID, VALID

  onMount(async () => {
    isLoadingData = true;
    const { data: {isMgpAwardee} } = await gql`
      {
        isMgpAwardee
      }
    `();

    state = isMgpAwardee ? 'VALID' : 'INVALID';
  });
</script>

<style>
  iframe {
    width: 100vw;
    height: 100vh;
    border: 0;
  }

  p {
    text-align: center;
    margin-top: 50vh;
    transform: translateY(-50%);
  }
</style>

<svelte:head>
  <title>得獎者＠Cofacts x 第四屆 MyGoPen 謠言惑眾獎</title>
</svelte:head>

{#if state === 'LOADING'}
  <p>正在檢查您是否為得獎者⋯⋯</p>
{:else if state === 'INVALID'}
  <p>您並非得獎者，無法查看此頁面。</p>
{:else}
  <iframe title="謠言惑眾獎得獎者" src={iframeUrl} />
{/if}
