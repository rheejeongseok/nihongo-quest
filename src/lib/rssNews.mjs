import { createHash } from "node:crypto";

// 일본 뉴스 RSS 수집 (API 키 없음)
// - NHK 분야별 RSS: 기사마다 일본어 요약문이 있어 학습용 기본 소스로 씁니다.
// - Google 뉴스 일본판 RSS: 요약문이 없어(제목만) NHK가 모자랄 때만 보충합니다.
// 한 분야에 몰리지 않도록 피드를 번갈아 가며 한 건씩 뽑습니다.
export const NHK_FEEDS = [0, 1, 4, 5, 3, 2, 6, 7].map(category => ({
  url: `https://news.web.nhk/n-data/conf/na/rss/cat${category}.xml`,
  sourceName: "NHK"
}));
export const GOOGLE_FEEDS = ["", "BUSINESS", "WORLD", "TECHNOLOGY", "SCIENCE", "HEALTH"].map(topic => ({
  url: topic
    ? `https://news.google.com/rss/headlines/section/topic/${topic}?hl=ja&gl=JP&ceid=JP:ja`
    : "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja",
  sourceName: null
}));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] === "#") return String.fromCodePoint(code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .trim();
}
function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1]) : "";
}
const stripHtml = text => text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// RSS XML → 뉴스 레코드 목록 (JapaneseNews 테이블 모양)
export function parseRssItems(xml, feed, batchDate) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.map(itemXml => {
    const link = tag(itemXml, "link");
    let title = tag(itemXml, "title");
    const source = tag(itemXml, "source");
    // Google 뉴스 제목 끝의 " - 언론사명"은 떼어 내고 출처로 씁니다.
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    // Google 뉴스 description은 링크 HTML뿐이라 요약으로 쓰지 않습니다.
    const description = feed.sourceName ? stripHtml(tag(itemXml, "description")) : "";
    const date = new Date(tag(itemXml, "pubDate"));
    if (!title || !/^https?:\/\//.test(link)) return null;
    return {
      id: createHash("sha1").update(link).digest("hex").slice(0, 32),
      title,
      description: description || title,
      link,
      imageUrl: null,
      pubDate: Number.isNaN(date.getTime()) ? null : date,
      sourceName: feed.sourceName || source || "일본 뉴스",
      batchDate
    };
  }).filter(Boolean);
}

// 피드 목록을 받아 와 중복 없이 size건을 피드별로 고르게 모읍니다.
// initial에 든 기사는 그대로 먼저 넣고, 남은 자리를 lists에서 채웁니다.
export function mergeFeeds(lists, size, initial = []) {
  const picked = new Map(initial.map(article => [article.id, article]));
  const seenTitles = new Set(initial.map(article => article.title));
  const queues = lists.map(list => [...list].sort((a, b) => (b.pubDate?.getTime() || 0) - (a.pubDate?.getTime() || 0)));
  while (picked.size < size && queues.some(queue => queue.length)) {
    for (const queue of queues) {
      if (picked.size >= size) break;
      while (queue.length) {
        const article = queue.shift();
        if (picked.has(article.id) || seenTitles.has(article.title)) continue;
        picked.set(article.id, article);
        seenTitles.add(article.title);
        break;
      }
    }
  }
  return [...picked.values()].sort((a, b) => (b.pubDate?.getTime() || 0) - (a.pubDate?.getTime() || 0));
}

async function fetchFeed(feed, batchDate, fetchImpl) {
  const response = await fetchImpl(feed.url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NihongoQuest/1.0)", "Accept": "application/rss+xml, application/xml, text/xml, */*" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`${feed.url} 응답 불량: ${response.status}`);
  return parseRssItems(await response.text(), feed, batchDate);
}

// 이 기간보다 오래된 기사는 버립니다. 피드 갱신이 멈춰도(주소 이전 등) 옛 기사가 오늘 뉴스로 섞이지 않게 합니다.
export const MAX_ARTICLE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const isFresh = (article, now) => article.pubDate && now - article.pubDate.getTime() <= MAX_ARTICLE_AGE_MS;

async function fetchAll(feeds, batchDate, fetchImpl, now) {
  const results = await Promise.allSettled(feeds.map(feed => fetchFeed(feed, batchDate, fetchImpl)));
  return results.flatMap(result => {
    if (result.status === "fulfilled") return [result.value.filter(article => isFresh(article, now))];
    console.warn("[일본 뉴스 RSS] 피드 수집 실패:", result.reason?.message || result.reason);
    return [];
  });
}

// NHK로 먼저 채우고, 모자라면 Google 뉴스로 보충합니다.
export async function collectRssNews(batchDate, size, fetchImpl = fetch, now = Date.now()) {
  const nhk = await fetchAll(NHK_FEEDS, batchDate, fetchImpl, now);
  let articles = mergeFeeds(nhk, size);
  if (articles.length < size) {
    const google = await fetchAll(GOOGLE_FEEDS, batchDate, fetchImpl, now);
    articles = mergeFeeds(google, size, articles);
  }
  return articles;
}
