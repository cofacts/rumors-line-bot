<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import Switch from '../components/Switch';

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
  .control {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card {
    background: #fff;
    padding: 16px;
  }
</style>

<svelte:head>
  <title>{t`Settings`}</title>
</svelte:head>

<header>
  <h1>{t`Welcome to Cofacts!`}</h1>
  <p>{t`You can configure Cofacts here to meet your need.`}</p>
</header>

{#if notifyMethod}
  {#if isLoadingData}
    <p>{t`Fetching settings`}...</p>
  {:else}
    <div class="card">
      <div class="control">
        {t`Notify me of new responses`}

        <Switch
          bind:checked={allowNewReplyUpdate}
          on:change={(event) => handleClick(event)}
          disabled={allowNewReplyUpdate === undefined}
        />
      </div>
      <p style="margin-bottom: 0">
        {t`Cofacts can send you latest reply of messages you have sent to Cofacts before.`}
      </p>
    </div>
  {/if}
{:else}
  <p>{t`No setup option for now :)`}</p>
{/if}
