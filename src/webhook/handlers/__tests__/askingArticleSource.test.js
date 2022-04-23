import askingArticleSource from '../askingArticleSource';

it('throws on incorrect input', async () => {
  const incorrectParam = {
    data: {
      searchedText: 'foo',
    },
    state: 'ASKING_ARTICLE_SOURCE',
    event: {
      input: 'Wrong',
    },
  };

  expect(askingArticleSource(incorrectParam)).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});
