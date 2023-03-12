<script>
  import { onMount } from 'svelte';
  import { t, ngettext, msgid } from 'ttag';
  import ReplyRequestForm from '../components/ReplyRequestForm.svelte';
  import { gql } from '../lib';

  const params = new URLSearchParams(location.search);
  const articleId = params.get('articleId');

  let isLoading = true;
  let isSubmitting = false;
  let searchedText = null;
  let reason = '';

  onMount(async () => {
    dataLayer.push({articleId});

    // Load searchedText from API
    const {data, errors} = await gql`
      query GetCurrentUserRequestInLIFF($articleId: String) {
        ListReplyRequests(
          filter: {articleId: $articleId, selfOnly: true}
        ) {
          edges {
            node {
              id
              reason
              article {
                text
              }
            }
          }
        }
      }
    `({articleId});

    isLoading = false;

    if(errors) {
      alert(errors[0].message);
      return;
    }

    if(data.ListReplyRequests.edges.length === 0) {
      alert('Article not found')
      return;
    }

    dataLayer.push({
      event: 'dataLoaded',
      doc: data.ListReplyRequests.edges[0],
    });
  });

  const handleSubmit = async e => {
    const reason = (e.detail || '').trim();
    isSubmitting = true;
    const {data, errors} = await gql`
      mutation UpdateReasonInLIFF($articleId: String!, $reason: String) {
        CreateOrUpdateReplyRequest(articleId: $articleId, reason: $reason) {
          replyRequestCount
        }
      }
    `({articleId, reason});
    isSubmitting = false;

    if(errors) {
      alert(errors[0].message);
      return;
    }

    if(!reason) {
      liff.closeWindow();
      return;
    }

    const otherReplyRequestCount = data.CreateOrUpdateReplyRequest.replyRequestCount - 1;
    alert(
      t`Thanks for the info you provided.` + (
        otherReplyRequestCount > 0 ? (
          '\n' + ngettext(
            msgid`There is ${otherReplyRequestCount} user also waiting for clarification.`,
            `There are ${otherReplyRequestCount} users also waiting for clarification.`,
            otherReplyRequestCount
          )
        ) : ''
      ),
    )

    liff.closeWindow();
  }
</script>

<svelte:head>
  <title>{t`Provide more info`}</title>
</svelte:head>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-flow: column;

    padding: 16px;
    background: var(--orange1);
  }
</style>

<main>
  <ReplyRequestForm
    reason={reason}
    searchedText={searchedText}
    disabled={isSubmitting || isLoading}
    on:submit={handleSubmit}
  />
</main>