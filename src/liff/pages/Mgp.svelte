<script>
  const userId = liff.getDecodedIDToken().sub;
  let iframeUrl = `https://www.surveycake.com/s/eqNpB?ssn0=${userId}&ssn58=cofacts`
</script>

<style>
  iframe {
    width: 100vw;
    height: 100vh;
    border: 0;
  }
</style>

<svelte:head>
  <title>Cofacts x 第四屆 MyGoPen 謠言惑眾獎</title>
</svelte:head>

<iframe title="謠言惑眾獎" src={iframeUrl} />
