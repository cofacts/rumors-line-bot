export const oneIdenticalVideoArticle = {
  data: {
    ListArticles: {
      edges: [
        {
          score: 2,
          node: {
            articleType: 'VIDEO',
            attachmentHash: 'ffff8000',
            attachmentUrl: 'http://foo/video.mp4',
            id: 'video-article-1',
          },
        },
      ],
    },
  },
};

export const getVideoArticle = {
  data: {
    GetArticle: {
      text: '',
      replyCount: 2,
      articleReplies: [
        {
          reply: {
            id: 'AVygFA0RyCdS-nWhuaXY',
            type: 'RUMOR',
            text: '查證這則謠言的過程中，約翰走鹿也發現其實網路早就有許多解答，就讓約翰走鹿來借花獻佛一下囉。多家媒體都有針對這則「吃生魚片會有海獸胃腺蟲附著胃壁」的謠言請教醫師，受訪的醫師們皆表示，這則謠言太誇大，海獸胃腺蟲沒那麼神通廣大。\n醫師們表示，台灣的衛生條件很進步，吃生魚片被寄生蟲寄生的案例很少，大部份都是生魚片不乾淨，感染沙門氏菌、大腸桿菌的案例，此外，寄生蟲也不是什麼難治之症，服用一些抗寄生蟲藥就可以殺死胃裡的這些蟲子，除非這些蟲子跑到身體其他部位那才比較難處理，但那也是要大量地吃生魚片（一週兩次以上），中獎機率才會比較高。',
          },
          positiveFeedbackCount: 14,
          negativeFeedbackCount: 2,
        },
        {
          reply: {
            id: 'AVy6LkWIyCdS-nWhuaqu',
            type: 'RUMOR',
            text: '過去台灣只有一個海獸胃腺蟲鑽入胃壁的病例，而且僅有一隻蟲。而經查詢，台北馬偕醫院也沒有名為林清風的醫師。',
          },
          positiveFeedbackCount: 24,
          negativeFeedbackCount: 0,
        },
      ],
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
