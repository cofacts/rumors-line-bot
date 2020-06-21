<script>
  import { onMount } from 'svelte';
  import { t } from 'ttag';
  import { gql } from '../lib';

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
    const result = await updateNotification(event.target.checked);
    if(event.target.checked)
      location.href='/login/line';
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
.box{
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>

<svelte:head>
  <title>{t`Settings`}</title>
</svelte:head>

<p>{t`Notification`}</p>

<!-- https://stackoverflow.com/questions/59027947/how-to-have-a-conditional-attribute-in-svelte-3 -->
<label class="box">
  {#if methodName}
    <span style="width: calc(100% - 60px);">{methodName}</span>
    <label class="switch">
      <input type="checkbox"
      on:click={(event) => handleClick(event)}
      checked={allowNewReplyUpdate || undefined}>
      <span class="slider round"></span>
  </label>
  {:else}
    <span>{t`Not available`}</span>
  {/if}
</label>