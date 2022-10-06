export const oneImageArticle = {
  data: {
    ListArticles: {
      edges: [
        {
          score: 1.87,
          node: {
            articleType: 'IMAGE',
            attachmentHash: 'ffff8000',
            attachmentUrl: 'http://foo/image.jpeg',
            id: 'image-article-1',
          },
        },
      ],
    },
  },
};

export const oneIdenticalImageArticle = {
  data: {
    ListArticles: {
      edges: [
        {
          score: 2,
          node: {
            articleType: 'IMAGE',
            attachmentHash: 'ffff8000',
            attachmentUrl: 'http://foo/image.jpeg',
            id: 'image-article-1',
          },
        },
      ],
    },
  },
};

export const twelveImageArticles = {
  data: {
    ListArticles: {
      edges: Array.from(Array(6)).reduce(
        arr =>
          arr.concat([
            {
              score: 2,
              node: {
                articleType: 'IMAGE',
                attachmentHash: 'ffff8000',
                attachmentUrl: 'http://foo/image.jpeg',
                id: 'image-article-1',
              },
            },
            {
              score: 1.876656,
              node: {
                articleType: 'IMAGE',
                attachmentHash: 'ffff8001',
                attachmentUrl: 'http://foo/image2.jpeg',
                id: 'image-article-2',
              },
            },
          ]),
        []
      ),
    },
  },
};

export const notFound = {
  data: {
    ListArticles: {
      edges: [],
    },
  },
};
