<script>
  const userId = liff.getDecodedIDToken().sub;
  let iframeUrl = `https://www.surveycake.com/s/Xx6mp?ssn0=${userId}`
</script>

<style>
  iframe {
    width: 100vw;
    height: 100vh;
    border: 0;
  }
</style>

<svelte:head>
  <title>得獎者＠Cofacts x 第四屆 MyGoPen 謠言惑眾獎</title>
</svelte:head>

<iframe title="謠言惑眾獎得獎者" src={iframeUrl} />
