<script>
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

  const expired = (parsedToken.exp || -Infinity) < Date.now() / 1000;

  let context = null;

  if(!expired){
    gql`
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
    `().then(({data, errors}) => {
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
    });
  }
</script>

{#if expired}
  <p>{t`Sorry, the button is expired.`}</p>
{:else}
  <svelte:component this={routes[$page]} {context} />
{/if}
