import initState from '../initState';
import * as gql from '../../gql';

describe('initState(params)', () => {
  it('article found', done => {
    const input = {
      data: {},
      state: '__INIT__',
      event: {
        type: 'message',
        input: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
        timestamp: 1497994016356,
        message: {
          type: 'text',
          id: '6270464463537',
          text: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
        },
      },
      issuedAt: 1497994017447,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    /* eslint-disable import/namespace */
    gql.default = () => () => {
      return new Promise(resolve => {
        resolve({
          data: {
            ListArticles: {
              edges: [
                {
                  node: {
                    text: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入，下車時使用老人悠遊卡，跳錶車資105元，優惠32元，只扣73元，哈哈，這是屬於我們的福利，與大家分享，可以善加利用！=7折，朋友使用ok',
                    id: 'AVvY-yizyCdS-nWhuYWx',
                  },
                },
              ],
            },
          },
        });
      });
    };

    initState(input).then(
      result => {
        expect(result).toMatchSnapshot();
        done();
      },
      error => {
        console.trace(error);
        done();
      }
    );
  });

  it('article found with 120 words limit', done => {
    const input = {
      data: {},
      state: '__INIT__',
      event: {
        type: 'message',
        input: '這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
        timestamp: 1502477505309,
        message: {
          type: 'text',
          id: '6530038889933',
          text: '這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
        },
      },
      issuedAt: 1502477506267,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      isSkipUser: false,
    };

    /* eslint-disable import/namespace */
    gql.default = () => () => {
      return Promise.resolve({
        data: {
          ListArticles: {
            edges: [
              {
                node: {
                  text: ' 這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
                  id: 'AV00D5G-yCdS-nWhucFj',
                },
              },
              {
                node: {
                  text: '●我國駐日代表將原「中華民國」申請更名為~「台灣」，結果被日本國裁罰，須繳納7000萬日圓（合約台幣2100萬元…）的高額稅賦，(被封殺的電視新聞~這難道不是民脂民膏嗎…？)...轉載中時電子報\n\n我駐日代表-謝長廷，將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭…友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元…，這難到不是 人民的血汗錢嗎…？）高額稅賦...！\n民進黨沒想到，如此更名，竟然是這樣的下場：\n被他最信任，也最友好的日本政府給坑了，堂堂一個駐日代表謝長廷，竟然被日本乾爹給坑了，實在是無顏見江東父老…！ ......\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118\n\n',
                  id: 'AV0x1TlTyCdS-nWhucDm',
                },
              },
            ],
          },
        },
      });
    };

    initState(input).then(
      result => {
        for (let reply of result.replies) {
          if (reply.type === 'text') {
            expect(reply.text.length < 120).toBe(true);
          } else if (reply.type === 'template') {
            expect(reply.altText.length < 120).toBe(true);
            if (reply.template.type === 'carousel') {
              for (let column of reply.template.columns) {
                expect(column.text.length < 120).toBe(true);
              }
            }
          }
        }
        done();
      },
      error => {
        console.trace(error);
        done();
      }
    );
  });
  it('article not found');
});
