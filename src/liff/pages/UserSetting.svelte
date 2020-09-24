<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';
  import Switch from '@smui/switch';
  import Paper, {Title, Content} from '@smui/paper';

  /* Expose notify method to UI */
  const notifyMethod = NOTIFY_METHOD;
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

<Paper color="primary" class="paper-demo">
  <Title>{t`Welcome to Cofacts!`}</Title>
  <Content>{t`You can configure Cofacts here to meet your need.`}</Content>
</Paper>

{#if notifyMethod}
  <div class="mdc-typography--subtitle1">{t`Notification`}</div>
  <p>{t`Cofacts can send you latest reply of messages you have sent to Cofacts before.`}</p>
  <span style="width: calc(100% - 60px);">
    {t`Notify me of new responses`}
  </span>
  <Switch
    style="margin: 0 10px;"
    on:click={(event) => handleClick(event)}
    bind:checked={allowNewReplyUpdate}
  />
{:else}
  <p>{t`No setup option for now :)`}</p>
{/if}
