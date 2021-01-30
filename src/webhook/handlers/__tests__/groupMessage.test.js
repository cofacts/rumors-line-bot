jest.mock('src/lib/ga');
jest.mock('src/lib/gql');

import ga from 'src/lib/ga';
import gql from 'src/lib/gql';

import groupMessage, { getValidArticleReply } from '../groupMessage';

import {
  apiResult,
  article as articleFixtures,
} from '../__fixtures__/groupMessage';

const event = {
  groupId: 'C904bb9fc2f4904b2facf8204b3f08c79',
  source: { type: 'group' },
};

beforeEach(() => {
  event.input = undefined;
  ga.clearAllMocks();
  gql.__reset();
});

describe('groupMessage', () => {
  it('rejects undefined input', async () => {
    await expect(groupMessage(event)).rejects.toMatchInlineSnapshot(
      `[Error: input undefined]`
    );
  });

  it('should not process input length less then 11', async () => {
    event.input = '0123456789';
    gql.__push(apiResult.validArticleAndOneReply);
    expect((await groupMessage(event)).replies).toBeUndefined();
    expect(gql.__finished()).toBe(false);
    expect(ga.sendMock).toHaveBeenCalledTimes(0);
  });

  it('processes introduction message Hi Cofacts', async () => {
    gql.__push(apiResult.notFound);
    event.input = 'Hi Cofacts';
    let result = await groupMessage(event);
    expect(result.replies).not.toBeUndefined();
    expect(result).toMatchSnapshot();
    event.input = 'hi confacts';
    result = await groupMessage(event);
    expect(result.replies).not.toBeUndefined();
    expect(result).toMatchSnapshot();

    // don't really care about this result :p
    event.input = 'cofacts';
    expect(await groupMessage(event)).toMatchSnapshot();
  });

  it('should not reply and send ga if article not found', async () => {
    event.input = 'article_not_found';
    gql.__push(apiResult.notFound);
    expect((await groupMessage(event)).replies).toBeUndefined();
    expect(gql.__finished()).toBe(true);
    expect(ga.sendMock).toHaveBeenCalledTimes(0);
  });

  it('should handle valid article and reply', async () => {
    event.input =
      'WHO 最新研究顯示 Covid-19 其實源自黑暗料理界，即日起正名為「黑料病毒」';
    gql.__push(apiResult.validArticleAndOneReply);
    const result = await groupMessage(event);
    expect(result.replies).not.toBeUndefined();
    expect(result).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          undefined,
          "__INIT__",
          "WHO 最新研究顯示 Covid-19 其實源自黑暗料理界，即日起正名為「黑料病毒」",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "ArticleSearch",
            "ec": "UserInput",
            "el": "ArticleFound",
          },
        ],
        Array [
          Object {
            "ea": "Search",
            "ec": "Article",
            "el": "3nbzf064ks60d",
            "ni": true,
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should handle valid article and reply', async () => {
    event.input = '你知道黑啤愛吃什麼嗎？ 黑啤愛吃蠶寶寶！';
    gql.__push(apiResult.validArticleWithTwoCategories);
    const result = await groupMessage(event);
    expect(result.replies).not.toBeUndefined();
    expect(result).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid article category feedback', async () => {
    event.input = '你知道嗎？其實黑啤愛吃蠶寶寶哦！';
    gql.__push(apiResult.invalidCategoryFeedback);
    expect((await groupMessage(event)).replies).toBeUndefined();
    expect(gql.__finished()).toBe(true);
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          undefined,
          "__INIT__",
          "你知道嗎？其實黑啤愛吃蠶寶寶哦！",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "ArticleSearch",
            "ec": "UserInput",
            "el": "ArticleFound",
          },
        ],
        Array [
          Object {
            "ea": "Search",
            "ec": "Article",
            "el": "3nbzf064ks60d",
            "ni": true,
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid article category', async () => {
    event.input = '以後吃蘋果一定要削皮。';
    gql.__push(apiResult.invalidArticleCategory);
    expect((await groupMessage(event)).replies).toBeUndefined();
    expect(gql.__finished()).toBe(true);
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          undefined,
          "__INIT__",
          "以後吃蘋果一定要削皮。",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "ArticleSearch",
            "ec": "UserInput",
            "el": "ArticleFound",
          },
        ],
        Array [
          Object {
            "ea": "Search",
            "ec": "Article",
            "el": "2zn1215x6e70v",
            "ni": true,
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid article reply', async () => {
    event.input = '我不會說我知道黑啤愛吃蠶寶寶哦！';
    gql.__push(apiResult.invalidArticleReply);
    expect((await groupMessage(event)).replies).toBeUndefined();
    expect(gql.__finished()).toBe(true);
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          undefined,
          "__INIT__",
          "我不會說我知道黑啤愛吃蠶寶寶哦！",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "ArticleSearch",
            "ec": "UserInput",
            "el": "ArticleFound",
          },
        ],
        Array [
          Object {
            "ea": "Search",
            "ec": "Article",
            "el": "3nbzf064ks60d",
            "ni": true,
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });
});

describe('processes articleReplies which article is valid', () => {
  it('invalid reply type', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidReplyType, event)
    ).toBeUndefined();
  });

  it('invalid reply feedback count', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidReplyFeedbackCount, event)
    ).toBeUndefined();
  });

  it('invalidTwoReplies1', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidTwoReplies1, event)
    ).toBeUndefined();
  });

  it('invalidTwoReplies2', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidTwoReplies2, event)
    ).toBeUndefined();
  });

  it('invalidThreeReplies1', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidThreeReplies1, event)
    ).toBeUndefined();
  });

  it('invalidThreeReplies2', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidThreeReplies2, event)
    ).toBeUndefined();
  });

  it('invalidMultipleReplies1', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidMultipleReplies1, event)
    ).toBeUndefined();
  });
  it('invalidMultipleReplies2', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidMultipleReplies2, event)
    ).toBeUndefined();
  });
  it('invalidMultipleReplies3', () => {
    expect(
      getValidArticleReply(articleFixtures.invalidMultipleReplies3, event)
    ).toBeUndefined();
  });

  it('twoReplies1 RUMOR positiveFeedbackCount > Non-RUMOR', () => {
    expect(
      getValidArticleReply(articleFixtures.twoReplies1, event)
    ).toMatchSnapshot();
  });

  it('twoReplies2 equal positiveFeedbackCount, but both type are RUMOR', () => {
    expect(
      getValidArticleReply(articleFixtures.twoReplies2, event)
    ).toMatchSnapshot();
  });

  it('threeReplies1 should return reply has more positiveFeedbackCount', () => {
    expect(
      getValidArticleReply(articleFixtures.threeReplies1, event)
    ).toMatchSnapshot();
  });

  it('threeReplies2 should return reply has second highest positiveFeedbackCount', () => {
    expect(
      getValidArticleReply(articleFixtures.threeReplies2, event)
    ).toMatchSnapshot();
  });

  it('multipleReplies1 should return Rumor reply1 or Rumor reply3', () => {
    expect(
      getValidArticleReply(articleFixtures.multipleReplies1)
    ).toMatchSnapshot();
  });

  it('multipleReplies2 should return reply has second highest positiveFeedbackCount', () => {
    expect(
      getValidArticleReply(articleFixtures.multipleReplies2)
    ).toMatchSnapshot();
  });
});
