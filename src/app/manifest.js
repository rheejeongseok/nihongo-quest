export default function manifest() {
  return {
    id: '/',
    name: 'NihongoQuest | 니혼고퀘스트',
    short_name: '니혼고퀘스트',
    description: '게임처럼 즐기는 일본어 기초·JLPT N1 학습 아레나',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#07111f',
    theme_color: '#557c55',
    lang: 'ko',
    categories: ['education', 'games'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: '오답노트',
        short_name: '오답노트',
        url: '/wrong-notes',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: '단어장',
        short_name: '단어장',
        url: '/bookmarks',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
