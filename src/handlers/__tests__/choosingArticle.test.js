jest.mock('../../gql');

import choosingArticle from '../choosingArticle';
import * as apiResult from '../__fixtures__/choosingArticle';
import gql from '../../gql';

it('should select article by articleId', async () => {
  gql.__push(apiResult.selectedArticleId);

  const params = {
    data: {
      searchedText:
        '《緊急通知》\n台北馬偕醫院傳來訊息：\n資深醫生（林清風）傳來：「請大家以後千萬不要再吃生魚片了！」\n因為最近已經發現- 好多病人因為吃了生魚片，胃壁附著《海獸胃腺蟲》，大小隻不一定，有的病人甚至胃壁上滿滿都是無法夾出來，驅蟲藥也很難根治，罹患機率每個國家的人都一樣。\n尤其；鮭魚的含蟲量最高、最可怕！\n請傳給朋友，讓他們有所警惕!',
      foundArticleIds: [
        'AVyyB61NyCdS-nWhuakC',
        'AV4sEcSHyCdS-nWhufEX',
        '5478658696099-rumor',
      ],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '1',
      timestamp: 1505314293406,
      message: {
        type: 'text',
        id: '6691804381697',
        text: '1',
      },
    },
    issuedAt: 1505314295017,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    isSkipUser: false,
  };

  expect(await choosingArticle(params)).toMatchSnapshot();
});

it('should select article and have OPINIONATED and NOT_ARTICLE replies', async () => {
  gql.__push(apiResult.multipleReplies);

  const params = {
    data: {
      searchedText:
        '老榮民九成存款全部捐給慈濟，如今窮了卻得不到慈濟醫院社工的幫忙，竟翻臉不認人',
      foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '1',
      timestamp: 1511633232479,
      message: { type: 'text', id: '7045918737413', text: '1' },
    },
    issuedAt: 1511633232970,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await choosingArticle(params)).toMatchSnapshot();
});

it('should select article with no replies', async () => {
  gql.__push(apiResult.noReplies);
  gql.__push(apiResult.createReplyRequest);

  const params = {
    data: {
      searchedText: '老司機車裡總備一塊香皂，知道內情的新手默默也準備了一塊',
      foundArticleIds: ['AV_4WX8vyCdS-nWhujyH'],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '1',
      timestamp: 1511702208226,
      message: { type: 'text', id: '7049700770815', text: '1' },
    },
    issuedAt: 1511702208730,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await choosingArticle(params)).toMatchSnapshot();
});

it('should select article and slice replies when over 10', async () => {
  gql.__push(apiResult.elevenReplies);

  const params = {
    data: {
      searchedText:
        '老榮民九成存款全部捐給慈濟，如今窮了卻得不到慈濟醫院社工的幫忙，竟翻臉不認人',
      foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '1',
      timestamp: 1511633232479,
      message: { type: 'text', id: '7045918737413', text: '1' },
    },
    issuedAt: 1511633232970,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await choosingArticle(params)).toMatchSnapshot();
});

it('should ask users if they want to submit article when user say not found', async () => {
  const params = {
    data: {
      searchedText:
        '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
      foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '0',
      timestamp: 1511633232479,
      message: { type: 'text', id: '7045918737413', text: '0' },
    },
    issuedAt: 1511633232970,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  const result = await choosingArticle(params);
  expect(result).toMatchSnapshot();
});

it('should block user from submitting articles that is too short', async () => {
  const params = {
    data: {
      searchedText: '這真的假的？？！！！？？！',
      foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
    },
    state: 'CHOOSING_ARTICLE',
    event: {
      type: 'message',
      input: '0',
      timestamp: 1511633232479,
      message: { type: 'text', id: '7045918737413', text: '0' },
    },
    issuedAt: 1511633232970,
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  const result = await choosingArticle(params);
  expect(result).toMatchSnapshot();
});

afterEach(() => {
  gql.__reset();
});
