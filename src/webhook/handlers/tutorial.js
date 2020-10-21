import { t } from 'ttag';
import {
  ellipsis,
  createPostbackAction,
  createReplyMessages,
  FLEX_MESSAGE_ALT_TEXT,
} from './utils';

/**
 * Fixed inputs that indicate which reply should `tutorial` function return
 */
// From rich menu
export const RICH_MENU_TRIGGER = `📖 ${t`tutorial`}`;
// From flex message button
const SIMULATE_FORWARDING_MESSAGE = t`Simulates forwarding a message`;
// From quick reply, Note: it should be less than 20 charactors
const PROVIDE_PERMISSION_SETUP = `💡 ${t`Cool, I got it!`}`;
const EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP = `🤔 ${t`What happened?`}`;
const PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION = `❓ ${t`Why permission`}`;
const SETUP_DONE = `👌 ${t`Done!`}`;
const SETUP_LATER = `⏱️ ${t`Later`}`;

/**
 * @param {string} imageUrl
 * @param {string} text
 * @returns {object} Flex message contents object
 */
function createImageTextBubble(imageUrl, text) {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: imageUrl,
          size: 'full',
          aspectMode: 'cover',
          aspectRatio: '1:1',
          gravity: 'top',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: text,
              size: 'lg',
              weight: 'bold',
              wrap: true,
            },
          ],
          position: 'relative',
          offsetBottom: '0px',
          offsetStart: '0px',
          offsetEnd: '0px',
          paddingAll: '20px',
          paddingTop: '18px',
          flex: 1,
          justifyContent: 'center',
        },
      ],
      paddingAll: '0px',
    },
  };
}

/**
 * @param {string} label
 * @param {string} sessionId
 * @param {string} postbackState
 * @returns {object} quickReply items object
 */
function createQuickReplyPostbackItem(label, sessionId, postbackState) {
  return {
    type: 'action',
    action: createPostbackAction(label, label, label, sessionId, postbackState),
  };
}

/**
 * @returns {object} Flex message object
 */
export function createGreetingMessage() {
  const text = t`This is a chatbot that looks up suspicious forwarded messages for you. Here is how to use me:`;
  const imageUrl =
    'https://uc4e58e1c257cac3657ad4ca0a69.previews.dropboxusercontent.com/p/thumb/AA_IcLRYeJqCzpdE1ZynRVM_LOWI3vkKHByHswDrgZS9BmYfzPao--HbC5krsws4BroUuhF9jQyuXs12XWmO5SuBgPbygVSHWNQM1wrEM_Sa9M-Q6kGD_t_xaXRbNoF2MbBsJfQBSAwJ9XuJsAs2zt8XLURjLX2Kz54W0v6NUuEeHdfetQFlStTzvicxVc_ROqMAYbzXvaE92j1SGHtxJaPZYxDdr5hZhwttLAkXccCgMy052jxgct0DTnSqzO0-cVk6DXRY755iHN_loO_cVlegYQDKmySTfpFMfZp8S8aSoLKsnk2Gqur4f_PabPrWFoMA289DZZ7wRSzdbN8DRlO9cTHo9FoQY-SdcOrpWBq4u6was6uvbXaHeZbrY4ZWmvm8JbrJqQWwb-txBVL1RUzN/p.png?size=800x600&size_mode=3';

  return {
    type: 'flex',
    altText: ellipsis(text, 300) + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [createImageTextBubble(imageUrl, text)],
    },
  };
}

/**
 * @param {object} data
 * @returns {object} Flex message object
 */
export function createTutorialMessage(data) {
  const textStep1 = t`1. When receiving a message from elsewhere`;
  const textStep2 = t`2. Long press and share`;
  const textStep3 = t`3. Select Cofacts to share`;
  const textStep4 = t`4. Cofacts replies with a crowd-sourced fact-check or chatbot replies`;

  const imageUrlStep1 =
    'https://uc21ad9bcd486191781c986dfe14.previews.dropboxusercontent.com/p/thumb/AA9R7LsrgHTMDIkz74TvAzOgT5gEcNeCPHWJ_OpIZOYJSBCqzCPMOliCKMe7IRVY_Us_ahRTRgC_d10NkokagS4yRtGo3cGHQfxtEPxRz0Fvo7pxLbEQW3BoM7reJTH0DTbrdku8uTrV3FYz7Evofe55rdRnKGpMPscd9A6YzFeSNvTV31ZwjRvw51utfQG9cwazNCENDVFLeQGl7NANpre3LTKKykTrOuY5t2-VLwYgq6e7fXQGYCGKNuBXWnEljJpPRcD--uDHjsbVtHQFEKt8ap3-lsjoy8AfpmMW619o-pO90Qj3HuRfV8M-_z-JbQS-8cN8Fe0zK-gxMHhRGY_roWKG85vHBePxd7WJDwa--Q/p.png?size=800x600&size_mode=3';
  const imageUrlStep2 =
    'https://ucf95938168eff92e5e3b5612ba9.previews.dropboxusercontent.com/p/thumb/AA-ZFGzO7USbYJssPQFGRX8p_wBS2O-nm5QeR7W-caj0U35PH1q5_kLu3AmEQmHYU45eKSr2cL_EpeiJEO3uQAyQlBzAV7Ksr3V2ixldcPKUqj4qO2FZG7AvgGMP9LS_J1WILp6aisWMbwx62kjsiWLCfc5UzwBMvCcJvabDiilTiJUl9MgK1TgamilPRkfXjHq5veFWx3UPARo8Q_P-Lqt-CICuJ7lQuDSEA0_4P_oLLRcB6GdrFpYI-WdcX0O-elEDC1SAUwIpy8-Y4EAFdIXlE4vG8HxK7AJ21ncEMCns0fNzPZk86HRu8K5-K2E07wBDoy1neGd8CyYfRDwiHAZV7kkjlYVbqvUNitQ7Lthr_g/p.png?size=800x600&size_mode=3';
  const imageUrlStep3 =
    'https://uc194c21cd7e578699198d7865d7.previews.dropboxusercontent.com/p/thumb/AA8xLEPWjBoyqtqCbs9vbNJ8bElzY--EsNdbE4bXC9bt7pVuRBUHCAQNvoQ2N02_d7UD_00iQ3Wg64a6YVZLmGKETOpixWMbtCh0EV9uSuhRwttKjqpjINFV8sRCDEllaVEMMh4FmIPxXY4TABM3rPNzjPW_4lOQUR_BFG7zkCgGOI2W63CoiiahO-C13f1oaklNrMvfoTQCW8SX8l3aWiBU6gT6os1SiUVyxF5dR-DES67vyt-swvGYkjQhc9HjHWCnw6mNG9nGJDPKkr6TG_9n9Viab5_9qTb0GIP0_SWuWzjSB9hYWB_h90mpajj2J_S2zW6Ni74HkE6cDk2GHOMzrw1B7_8wF085rk8g0Q0Evg/p.png?size=800x600&size_mode=3';
  const imageUrlStep4 =
    'https://uc6f6b4fb030579a10543b701de5.previews.dropboxusercontent.com/p/thumb/AA9Nmy3XzfaoadjGk_aV4MxTMiyVG3ksHentuo7wlFZA6K2yXxwT6cKRMLlViEkIguAwQEaL5mFy6noBwULm3guYEQHpbgb7gb4zOjlJlFsGuBMa5NXSKx3KKLxjTgv9ZvljTdmjWcMSrHMOgbpxQnnzNGcHz24CpvTUyh1wY5gtctOb_i00-IZ6YAEllO065EhyfeN89aT_QtorvyjvkT6jOroUs82Dt_1JmgWbE5pe49lM_EhstyGG8OHsWtvjOOEte7yn7r7X3PtTCG7dWjoU5gN8XmMDmkezz-u0UnpceThFmdOksPnTCCPKtz8YMF9tEfvke2lQNpEY0Fx1tYMjH-KY5dskR99g46UKG9Wwdg/p.png?size=800x600&size_mode=3';

  const askForForwardingMessage = t`Wanna try it out? Just forward a message to me!`;
  const buttonLabel = SIMULATE_FORWARDING_MESSAGE;
  const displayText =
    '只要每天早上一杯地瓜葉牛奶。不僅有效降低三高，甚至連痛風也沒了；此外，地瓜葉牛奶的作法也很簡單，只要先將地瓜葉川燙過後，再加入鮮奶打成汁即可。';

  return {
    type: 'flex',
    altText:
      ellipsis(
        textStep1 + '\n' + textStep2 + '\n' + textStep3 + '\n' + textStep4,
        300
      ) +
      '\n' +
      FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [
        createImageTextBubble(imageUrlStep1, textStep1),
        createImageTextBubble(imageUrlStep2, textStep2),
        createImageTextBubble(imageUrlStep3, textStep3),
        createImageTextBubble(imageUrlStep4, textStep4),
        {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: askForForwardingMessage,
                size: 'lg',
                weight: 'bold',
                wrap: true,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: createPostbackAction(
                  buttonLabel,
                  SIMULATE_FORWARDING_MESSAGE,
                  displayText,
                  data.sessionId,
                  'TUTORIAL'
                ),
                style: 'primary',
                color: '#ffb600',
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * @returns {object} Flex message object, copied from `choosingReply.js`
 */
export function createMockReplyMessages() {
  return [];
}
