import askingArticleSource from '../askingArticleSource';

describe('should ask users about the source of an article when the article exists in our database but is not yet replied', async () => {
  it('should ask users to seek help from other fact-checkers if the article is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '自己打的',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '自己打的' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their relatives', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '親戚轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '親戚轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '朋友轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '朋友轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their colleagues', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '同事轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '同事轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });
});

describe('should ask users about the source of an article when the article is not in our database', async () => {
  it('should ask users to seek help from other fact-checkers if the article is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '自己打的',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '自己打的' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their relatives', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '親戚轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '親戚轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '朋友轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '朋友轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their colleagues', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '同事轉傳',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '同事轉傳' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });
});
