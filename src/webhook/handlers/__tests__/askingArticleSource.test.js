import askingArticleSource from '../askingArticleSource';

describe('should ask users about the source of an article when the article exists in our database but is not yet replied', () => {
  it('should ask users to seek help from other fact-checkers if the article is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
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
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
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
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
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

describe('should ask users about the source of an article when none of our articles matches their query', () => {
  it('should ask users to seek help from other fact-checkers if the article is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
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
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
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
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
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

describe('should ask users about the source of an article when the article is not in our database', () => {
  it('should ask users to seek help from other fact-checkers if the article is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
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
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the article is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
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
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to re-submit a valid option number', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'text',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '10',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '10' },
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

describe('should ask users about the source of an image when the article exists in our database but is not yet replied', () => {
  it('should ask users to seek help from other fact-checkers if the image is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the image is from their relatives', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the image is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to submit their reasons via LIFF if the image is from their colleagues', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，而且使用者覺得有符合轉傳文章的選項。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: 'AV8d2-YtyCdS-nWhuhdi',
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
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

describe('should ask users about the source of an image when none of our articles matches their query', () => {
  it('should ask users to seek help from other fact-checkers if the image is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their relatives', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their colleagues', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇文章確實是一個轉傳文章，他夠長，看起來很轉傳，但是使用者覺得資料庫裡沒有。',
        foundArticleIds: ['AV8d2-YtyCdS-nWhuhdi'],
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        selectedArticleId: undefined,
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
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

describe('should ask users about the source of an image when the article is not in our database', () => {
  it('should ask users to seek help from other fact-checkers if the image is manually input', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇從圖片轉出來含有亂lx碼g的s文s章，ggggggggg資料庫g裡沒有，u不給送進資料庫。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '4',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '4' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their relatives', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇從圖片轉出來含有亂lx碼g的s文s章，ggggggggg資料庫g裡沒有，u不給送進資料庫。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
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

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their friends', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇從圖片轉出來含有亂lx碼g的s文s章，ggggggggg資料庫g裡沒有，u不給送進資料庫。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '3',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '3' },
      },
      issuedAt: 1511633232970,
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      replies: undefined,
      isSkipUser: false,
    };

    const result = await askingArticleSource(params);
    expect(result).toMatchSnapshot();
  });

  it('should ask users to seek help from other fact-checkers if the image is from their colleagues', async () => {
    const params = {
      data: {
        searchedText:
          '這一篇從圖片轉出來含有亂lx碼g的s文s章，ggggggggg資料庫g裡沒有，u不給送進資料庫。',
        articleSources: ['親戚轉傳', '同事轉傳', '朋友轉傳', '自己輸入的'],
        messageType: 'image',
      },
      state: 'ASKING_ARTICLE_SOURCE',
      event: {
        type: 'message',
        input: '2',
        timestamp: 1511633232479,
        message: { type: 'text', id: '7045918737413', text: '2' },
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
