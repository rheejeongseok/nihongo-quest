import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRssItems, mergeFeeds, collectRssNews, NHK_FEEDS } from '../src/lib/rssNews.mjs';

const item = (title, link, extra = '') => `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>Sun, 08 Nov 2026 10:00:00 +0900</pubDate>${extra}</item>`;
const rss = items => `<?xml version="1.0"?><rss><channel>${items.join('')}</channel></rss>`;

test('NHK RSS items become news records with Japanese summaries', () => {
  const [record] = parseRssItems(rss([item('台風 &amp; 大雨', 'https://www3.nhk.or.jp/news/a.html', '<description><![CDATA[沖縄で<b>強い</b>雨。]]></description>')]), { sourceName: 'NHK' }, '2026-11-08');
  assert.equal(record.title, '台風 & 大雨');
  assert.equal(record.description, '沖縄で 強い 雨。');
  assert.match(record.id, /^[0-9a-f]{32}$/);
  assert.equal(record.sourceName, 'NHK');
  assert.equal(record.batchDate, '2026-11-08');
  assert.ok(record.pubDate instanceof Date);
});

test('Google News titles drop the outlet suffix and use the title as summary', () => {
  const [record] = parseRssItems(rss([item('新製品を発表 - 日経新聞', 'https://news.google.com/x', '<description>&lt;a href="x"&gt;link&lt;/a&gt;</description><source url="https://nikkei.com">日経新聞</source>')]), { sourceName: null }, 'd');
  assert.equal(record.title, '新製品を発表');
  assert.equal(record.description, '新製品を発表');
  assert.equal(record.sourceName, '日経新聞');
});

test('merging takes feeds in turn and skips duplicates', () => {
  const make = (prefix, n) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, title: `${prefix}${i}`, pubDate: new Date(2026, 0, 1, i) }));
  const merged = mergeFeeds([make('a', 10), make('b', 2), [{ id: 'a9', title: 'a9' }]], 6);
  assert.equal(merged.length, 6);
  assert.equal(merged.filter(x => x.id.startsWith('b')).length, 2);
  assert.equal(new Set(merged.map(x => x.id)).size, 6);
  const kept = mergeFeeds([make('c', 5)], 4, make('a', 3));
  assert.deepEqual(kept.filter(x => x.id.startsWith('a')).length, 3);
});

test('collects from NHK first and fills the rest from Google News', async () => {
  const fake = async url => ({ ok: true, text: async () => url.includes('nhk')
    ? rss([item(`NHK ${url}`, `https://www3.nhk.or.jp/${encodeURIComponent(url)}`, '<description>要約</description>')])
    : rss(Array.from({ length: 5 }, (_, i) => item(`G${i} ${url}`, `https://news.google.com/${i}/${encodeURIComponent(url)}`))) });
  const now = Date.parse('2026-11-09T00:00:00+09:00');
  const articles = await collectRssNews('d', 20, fake, now);
  assert.equal(articles.length, 20);
  assert.equal(articles.filter(a => a.sourceName === 'NHK').length, NHK_FEEDS.length);
  const onlyNhk = await collectRssNews('d', 5, fake, now);
  assert.ok(onlyNhk.every(a => a.sourceName === 'NHK'));
});

test('articles older than a week are dropped, even from a feed that stopped updating', async () => {
  const fake = async () => ({ ok: true, text: async () => rss([item('古い記事', 'https://example.jp/old')]) });
  const articles = await collectRssNews('d', 5, fake, Date.parse('2026-11-24T00:00:00+09:00'));
  assert.equal(articles.length, 0);
});
