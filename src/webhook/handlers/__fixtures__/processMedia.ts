import { ListArticlesInProcessMediaQuery } from 'typegen/graphql';

export const oneImageArticle: GqlResponse<ListArticlesInProcessMediaQuery> = {
  data: {
    ListArticles: {
      edges: [
        {
          score: 87,
          node: {
            articleType: 'IMAGE',
            attachmentUrl: 'http://foo/image.jpeg',
            id: 'image-article-1',
            replyCount: 0,
          },
          mediaSimilarity: 0.87,
          highlight: null,
        },
      ],
    },
  },
};

export const oneIdenticalImageArticle: GqlResponse<ListArticlesInProcessMediaQuery> =
  {
    data: {
      ListArticles: {
        edges: [
          {
            score: 100,
            node: {
              articleType: 'IMAGE',
              attachmentUrl: 'http://foo/image.jpeg',
              id: 'image-article-1',
              replyCount: 0,
            },
            mediaSimilarity: 1,
            highlight: null,
          },
        ],
      },
    },
  };

export const identicalImageAndTextFound: GqlResponse<ListArticlesInProcessMediaQuery> =
  {
    data: {
      ListArticles: {
        edges: [
          {
            score: 100,
            mediaSimilarity: 1,
            node: {
              articleType: 'IMAGE',
              attachmentUrl: 'http://foo/image.jpeg',
              id: 'image-article-1',
              replyCount: 0,
            },
            highlight: null,
          },
          {
            score: 87.6656,
            mediaSimilarity: 0,
            node: {
              articleType: 'TEXT',
              attachmentUrl: null,
              id: 'text-article-1',
              replyCount: 0,
            },
            highlight: {
              text: 'Text matching <HIGHLIGHT>query transcript</HIGHLIGHT>',
              hyperlinks: [
                {
                  title:
                    'Hyperlink title matching <HIGHLIGHT>query transcript</HIGHLIGHT>',
                  summary:
                    'Hyperlink summary matching <HIGHLIGHT>query transcript</HIGHLIGHT>',
                },
              ],
            },
          },
        ],
      },
    },
  };

export const twelveImageArticles: GqlResponse<ListArticlesInProcessMediaQuery> =
  {
    data: {
      ListArticles: {
        edges: Array.from(Array(6)).reduce<
          NonNullable<ListArticlesInProcessMediaQuery['ListArticles']>['edges']
        >(
          (arr) =>
            arr.concat([
              {
                score: 100,
                mediaSimilarity: 1,
                node: {
                  articleType: 'IMAGE',
                  attachmentUrl: 'http://foo/image.jpeg',
                  id: 'image-article-1',
                  replyCount: 0,
                },
                highlight: null,
              },
              {
                score: 87.6656,
                mediaSimilarity: 0.87,
                node: {
                  articleType: 'IMAGE',
                  attachmentUrl: 'http://foo/image2.jpeg',
                  id: 'image-article-2',
                  replyCount: 0,
                },
                highlight: null,
              },
            ]),
          []
        ),
      },
    },
  };

export const notFound: GqlResponse<ListArticlesInProcessMediaQuery> = {
  data: {
    ListArticles: {
      edges: [],
    },
  },
};
