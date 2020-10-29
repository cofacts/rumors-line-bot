<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import Switch from '@smui/switch';
  import Paper, {Title, Content} from '@smui/paper';
  import FormField from '@smui/form-field';

  /* Expose notify method to UI */
  const notifyMethod = NOTIFY_METHOD;
  let allowNewReplyUpdate;
  let isLoadingData = false; // If is in process of loadData()

  onMount(async () => {
    isLoadingData = true;
    const { data } = await gql`
    {
      setting {
          allowNewReplyUpdate
          newReplyNotifyToken
      }
    }
  `();

    allowNewReplyUpdate = data.setting.allowNewReplyUpdate;
    isLoadingData = false;
  });

  const handleLineNotifyClick = async (event) => {
    if(event.target.checked)
      location.href=`/login/line_notify?userId=${liff.getContext().userId}&redirect=/liff/index.html?p=setting`;
    else
      await updateNotification(event.target.checked);
  }
  const handlePushApiClick = async (event) => {
    await updateNotification(event.target.checked);
  }
  const updateNotification = async (c) => {
    return gql`
      mutation UpdateNotification($checked: Boolean!) {
        allowNotification(allow: $checked){
          allowNewReplyUpdate
          newReplyNotifyToken
        }
      }
    `({
      checked: c,
    });
  }
  const handleClick = async (event) => {
    switch (NOTIFY_METHOD) {
      case 'LINE_NOTIFY': {
        handleLineNotifyClick(event);
        break;
      }
      case 'PUSH_MESSAGE': {
        handlePushApiClick(event);
        break;
      }
      default:{
        break;
      }
    }
  }
</script>
<style>
  :global(.field) {
    display: flex;
  }

  :global(.field.field.field.field > label) {
    padding: 0;
    margin-right: auto;
  }
</style>

<svelte:head>
  <title>{t`Settings`}</title>
</svelte:head>

<Paper color="primary" class="paper-demo">
  <Title>{t`Welcome to Cofacts!`}</Title>
  <Content>{t`You can configure Cofacts here to meet your need.`}</Content>
</Paper>

{#if notifyMethod}
  {#if isLoadingData}
    <p>{t`Fetching settings`}...</p>
  {:else}
    <p>{t`Cofacts can send you latest reply of messages you have sent to Cofacts before.`}</p>
    <FormField class="field" align="end">
      <span slot="label">
        {t`Notify me of new responses`}
      </span>
      <Switch
        style="margin: 0 10px;"
        bind:checked={allowNewReplyUpdate}
        on:change={(event) => handleClick(event)}
        disabled={allowNewReplyUpdate === undefined}
      />
    </FormField>
  {/if}
{:else}
  <p>{t`No setup option for now :)`}</p>
{/if}
