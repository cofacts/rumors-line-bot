<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { page, parsedToken, gql } from './lib';
  import Source from './pages/Source.svelte';
  import Reason from './pages/Reason.svelte';
  import PositiveFeedback from './pages/PositiveFeedback.svelte';
  import NegativeFeedback from './pages/NegativeFeedback.svelte';

  const routes = {
    source: Source,
    reason: Reason,
    'feedback/yes': PositiveFeedback,
    'feedback/no': NegativeFeedback,
  };

  const expired = parsedToken && (
    (parsedToken.exp || -Infinity) < Date.now() / 1000
  );

  // Chatbot context of current user
  let context = null;

  onMount(async () => {
    if(expired) return;

    if(!parsedToken) {
      // Set gql token to `line xxx` instead

      return;
    }

    const {data, errors} = await gql`
      query GetContextForLIFF {
        context {
          state
          data {
            sessionId
            searchedText
            selectedArticleText
          }
        }
      }
    `();

    if(errors && errors[0].message === 'Invalid authentication header') {
      alert(t`This button was for previous search and is now expired.`);
      liff.closeWindow();
      return;
    }

    if(!data || !data.context) {
      alert(/* t: In LIFF, should not happen */ t`Unexpected error, no search data is retrieved.`);
      returnl;
    }

    context = data.context;
  })
</script>

{#if expired}
  <p>{t`Sorry, the button is expired.`}</p>
{:else}
  <svelte:component this={routes[$page]} {context} />
{/if}
