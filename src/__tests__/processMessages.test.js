import { initState } from '../processMessages';
import * as gql from '../gql';

describe('Test for processMessages.js', () => {
  describe('createPostbackAction()', () => {
    it('should return postback message body');
  });

  describe('createFeedbackWords()', () => {
    it('should create empty feedback words');
    it('should create positive feedback words');
    it('should create negative feedback words');
  });
  describe('createReferenceWords()', () => { });

  describe('initState(params)', () => {
    it('article found', done => {
      const input = {
        data: {},
        state: '__INIT__',
        event:
        {
          type: 'message',
          input: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
          timestamp: 1497994016356,
          message:
          {
            type: 'text',
            id: '6270464463537',
            text: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入'
          }
        },
        issuedAt: 1497994017447,
        userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
        replies: undefined,
        isSkipUser: false
      };

      gql.default = (query, ...substitutions) => (variables, search) => {
        return new Promise((resolve, reject) => {
          resolve({
            data: {
              ListArticles: {
                edges: [{
                  node:
                  {
                    text: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入，下車時使用老人悠遊卡，跳錶車資105元，優惠32元，只扣73元，哈哈，這是屬於我們的福利，與大家分享，可以善加利用！=7折，朋友使用ok',
                    id: 'AVvY-yizyCdS-nWhuYWx'
                  }
                }]
              }
            }
          });
        });
      };

      initState(input).then(result => {
        expect(result).toMatchSnapshot();
        done();
      }, error => {
        console.trace(error);
        done();
      });
    });
    it('article not found');
  });
});
