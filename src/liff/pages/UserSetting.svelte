<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import Switch from '@smui/switch';

  let methodName;
  let allowNewReplyUpdate;

  onMount(async () => {
    const { data } = await gql`
    {
      setting {
          allowNewReplyUpdate
          newReplyNotifyToken
      }
    }
  `();

    allowNewReplyUpdate = data.setting.allowNewReplyUpdate;
  });

  switch (NOTIFY_METHOD) {
    case 'LINE_NOTIFY': {
      methodName = t`Use line notify`;
      break;
    }
    case 'PUSH_MESSAGE': {
      methodName = t`Use push message`;
      break;
    }
    default:{
      methodName = undefined;
      break;
    }
  }

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

<svelte:head>
  <title>{t`Settings`}</title>
</svelte:head>

<p>{t`Notification`}</p>

<!-- https://stackoverflow.com/questions/59027947/how-to-have-a-conditional-attribute-in-svelte-3 -->
<div style="display: flex;">
  {#if methodName}
      <span style="width: calc(100% - 60px);">{methodName}</span>
      <Switch
      style="margin: 0 10px;"
      on:click={(event) => handleClick(event)} 
      bind:checked={allowNewReplyUpdate} />
  {:else}
    <span>{t`Not available`}</span>
  {/if}
</div>
