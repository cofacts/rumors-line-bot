jest.mock('@line/bot-sdk');
import {
  mockedGetNumberOfMessageDeliveries,
  mockedGetNumberOfFollowers,
  mockedGetFriendDemographics,
} from '@line/bot-sdk';
import { gql } from '../testUtils';

beforeEach(() => {
  mockedGetNumberOfMessageDeliveries.mockClear();
  mockedGetNumberOfFollowers.mockClear();
  mockedGetFriendDemographics.mockClear();
});

it('MessagingAPIDate throws error on invalid date', async () => {
  const literalResult = await gql`
    {
      insights {
        messageDelivery(date: "ABCDEFG") {
          status
        }
      }
    }
  `();
  expect(literalResult).toMatchInlineSnapshot(`
    Object {
      "errors": Array [
        [GraphQLError: Expected value of type "MessagingAPIDate!", found "ABCDEFG"; Should be a string of "yyyyMMdd"],
      ],
    }
  `);

  const valueResult = await gql`
    query($date: MessagingAPIDate!) {
      insights {
        messageDelivery(date: $date) {
          status
        }
      }
    }
  `({
    date: 'ABCDEFG',
  });
  expect(valueResult).toMatchInlineSnapshot(`
    Object {
      "errors": Array [
        [GraphQLError: Variable "$date" got invalid value "ABCDEFG"; Expected type "MessagingAPIDate". Should be a string of "yyyyMMdd"],
      ],
    }
  `);
});

it('messageDelivery returns messageDelivery data', async () => {
  mockedGetNumberOfMessageDeliveries.mockImplementationOnce(() => ({
    status: 'ready',
    broadcast: 5385,
    targeting: 522,
  }));

  const result = await gql`
    {
      insights {
        messageDelivery(date: "20200401") {
          status
          broadcast
          targeting
          autoResponse
          welcomeResponse
          chat
          apiPush
          apiMulticast
          apiNarrowcast
          apiReply
        }
      }
    }
  `();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "insights": Object {
          "messageDelivery": Object {
            "apiMulticast": null,
            "apiNarrowcast": null,
            "apiPush": null,
            "apiReply": null,
            "autoResponse": null,
            "broadcast": 5385,
            "chat": null,
            "status": "READY",
            "targeting": 522,
            "welcomeResponse": null,
          },
        },
      },
    }
  `);
});

it('followers returns followers data', async () => {
  mockedGetNumberOfFollowers.mockImplementationOnce(() => ({
    status: 'ready',
    followers: 7620,
    targetedReaches: 5848,
    blocks: 237,
  }));
  const result = await gql`
    {
      insights {
        followers(date: "20200401") {
          status
          followers
          targetedReaches
          blocks
        }
      }
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "insights": Object {
          "followers": Object {
            "blocks": 237,
            "followers": 7620,
            "status": "READY",
            "targetedReaches": 5848,
          },
        },
      },
    }
  `);
});

it('demographic returns demographic data', async () => {
  mockedGetFriendDemographics.mockImplementationOnce(() => ({
    available: true,
    genders: [
      {
        gender: 'unknown',
        percentage: 37.6,
      },
      {
        gender: 'male',
        percentage: 31.8,
      },
      {
        gender: 'female',
        percentage: 30.6,
      },
    ],
    ages: [
      {
        age: 'unknown',
        percentage: 37.6,
      },
      {
        age: 'from50',
        percentage: 17.3,
      },
      {
        age: 'from45to50',
        percentage: 12.1,
      },
    ],
    areas: [
      {
        area: 'unknown',
        percentage: 42.9,
      },
      {
        area: '徳島',
        percentage: 2.9,
      },
    ],
    appTypes: [
      {
        appType: 'ios',
        percentage: 62.4,
      },
      {
        appType: 'android',
        percentage: 27.7,
      },
      {
        appType: 'others',
        percentage: 9.9,
      },
    ],
    subscriptionPeriods: [
      {
        subscriptionPeriod: 'over365days',
        percentage: 96.4,
      },
      {
        subscriptionPeriod: 'within365days',
        percentage: 1.9,
      },
      {
        subscriptionPeriod: 'within180days',
        percentage: 1.2,
      },
      {
        subscriptionPeriod: 'within90days',
        percentage: 0.5,
      },
      {
        subscriptionPeriod: 'within30days',
        percentage: 0.1,
      },
      {
        subscriptionPeriod: 'within7days',
        percentage: 0,
      },
    ],
  }));

  const result = await gql`
    query($date: MessagingAPIDate!) {
      insights {
        demographic(date: $date) {
          available
          ages {
            age
            from
            to
            percentage
          }
          genders {
            gender
            percentage
          }
          areas {
            area
            percentage
          }
          appTypes {
            appType
            percentage
          }
          subscriptionPeriods {
            subscriptionPeriod
            withinDays
            percentage
          }
        }
      }
    }
  `({ date: '20200401' });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "insights": Object {
          "demographic": Object {
            "ages": Array [
              Object {
                "age": "unknown",
                "from": null,
                "percentage": 37.6,
                "to": null,
              },
              Object {
                "age": "from50",
                "from": 50,
                "percentage": 17.3,
                "to": null,
              },
              Object {
                "age": "from45to50",
                "from": 45,
                "percentage": 12.1,
                "to": 50,
              },
            ],
            "appTypes": Array [
              Object {
                "appType": "ios",
                "percentage": 62.4,
              },
              Object {
                "appType": "android",
                "percentage": 27.7,
              },
              Object {
                "appType": "others",
                "percentage": 9.9,
              },
            ],
            "areas": Array [
              Object {
                "area": "unknown",
                "percentage": 42.9,
              },
              Object {
                "area": "徳島",
                "percentage": 2.9,
              },
            ],
            "available": true,
            "genders": Array [
              Object {
                "gender": "unknown",
                "percentage": 37.6,
              },
              Object {
                "gender": "male",
                "percentage": 31.8,
              },
              Object {
                "gender": "female",
                "percentage": 30.6,
              },
            ],
            "subscriptionPeriods": Array [
              Object {
                "percentage": 96.4,
                "subscriptionPeriod": "over365days",
                "withinDays": -1,
              },
              Object {
                "percentage": 1.9,
                "subscriptionPeriod": "within365days",
                "withinDays": 365,
              },
              Object {
                "percentage": 1.2,
                "subscriptionPeriod": "within180days",
                "withinDays": 180,
              },
              Object {
                "percentage": 0.5,
                "subscriptionPeriod": "within90days",
                "withinDays": 90,
              },
              Object {
                "percentage": 0.1,
                "subscriptionPeriod": "within30days",
                "withinDays": 30,
              },
              Object {
                "percentage": 0,
                "subscriptionPeriod": "within7days",
                "withinDays": 7,
              },
            ],
          },
        },
      },
    }
  `);
});
