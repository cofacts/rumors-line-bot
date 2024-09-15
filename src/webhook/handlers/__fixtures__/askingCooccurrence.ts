import {
  ListArticlesInInitStateQuery,
  ListArticlesInProcessMediaQuery,
} from 'typegen/graphql';

export const textMessage = {
  id: 'text-message',
  text: 'This is a text message',
  articleType: 'TEXT',
  attachmentUrl: null,
  replyCount: 0,
} as const satisfies NonNullable<
  ListArticlesInInitStateQuery['ListArticles']
>['edges'][0]['node'];

export const imageMessage = {
  id: 'img-message',
  articleType: 'TEXT',
  attachmentUrl: 'https://example.com/image.jpg',
  replyCount: 0,
} as const satisfies NonNullable<
  ListArticlesInProcessMediaQuery['ListArticles']
>['edges'][0]['node'];
