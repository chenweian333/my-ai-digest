#!/usr/bin/env node

// ============================================================================
// My AI Digest — User Source Fetcher
// ============================================================================
// Reads ~/.follow-builders/user-sources.json and fetches fresh content:
//   - Podcast RSS feeds   → pod2txt for transcripts
//   - YouTube channels    → Atom feed + pod2txt for transcripts
//   - Blog/newsletter RSS → content:encoded or description extraction
//
// Writes to:
//   ~/.follow-builders/user-feed-podcasts.json
//   ~/.follow-builders/user-feed-blogs.json
//
// State (dedup) stored at:
//   ~/.follow-builders/user-feed-state.json
//
// Usage: node fetch-user-sources.js [--podcasts-only | --blogs-only]
// Env:   POD2TXT_API_KEY (from ~/.follow-builders/.env)
// ============================================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { config as loadEnv } from 'dotenv';

// -- Constants ---------------------------------------------------------------

const USER_DIR = join(homedir(), '.follow-builders');
const USER_SOURCES_PATH = join(USER_DIR, 'user-sources.json');
const USER_PODCAST_FEED_PATH = join(USER_DIR, 'user-feed-podcasts.json');
const USER_BLOG_FEED_PATH = join(USER_DIR, 'user-feed-blogs.json');
const STATE_PATH = join(USER_DIR, 'user-feed-state.json');
const ENV_PATH = join(USER_DIR, '.env');

const POD2TXT_BASE = 'https://pod2txt.vercel.app/api';
const RSS_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const PODCAST_LOOKBACK_HOURS = 336; // 14 days (podcasts publish weekly or biweekly)
const BLOG_LOOKBACK_HOURS = 72;
const MAX_ARTICLES_PER_BLOG = 2;

// -- State Management --------------------------------------------------------

async function loadState() {
  if (!existsSync(STATE_PATH)) return { seenVideos: {}, seenArticles: {} };
  try {
    const state = JSON.parse(await readFile(STATE_PATH, 'utf-8'));
    if (!state.seenVideos) state.seenVideos = {};
    if (!state.seenArticles) state.seenArticles = {};
    return state;
  } catch {
    return { seenVideos: {}, seenArticles: {} };
  }
}

async function saveState(state) {
  // Prune entries older than 14 days to keep the file small
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  for (const [id, ts] of Object.entries(state.seenVideos || {})) {
    if (ts < cutoff) delete state.seenVideos[id];
  }
  for (const [id, ts] of Object.entries(state.seenArticles || {})) {
    if (ts < cutoff) delete state.seenArticles[id];
  }
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

// -- Load User Sources -------------------------------------------------------

async function loadUserSources() {
  if (!existsSync(USER_SOURCES_PATH)) return { youtube: [], rss: [] };
  try {
    const raw = JSON.parse(await readFile(USER_SOURCES_PATH, 'utf-8'));
    // Filter out template comment entries (they have a _comment field)
    return {
      youtube: (raw.youtube || []).filter(s => !s._comment),
      rss: (raw.rss || []).filter(s => !s._comment)
    };
  } catch (err) {
    console.error(`Could not parse user-sources.json: ${err.message}`);
    return { youtube: [], rss: [] };
  }
}

// -- RSS Parsing -------------------------------------------------------------

// Parses a podcast RSS feed and returns episode objects.
function parsePodcastRss(xml) {
  const episodes = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];

    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    const guidMatch =
      block.match(/<guid[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/guid>/) ||
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const guid = guidMatch ? guidMatch[1].trim() : null;

    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const publishedAt = pubDateMatch
      ? new Date(pubDateMatch[1].trim()).toISOString()
      : null;

    // <link> can appear in two forms: plain text or atom:link with href
    const linkPlain = block.match(/<link>([\s\S]*?)<\/link>/);
    const linkHref = block.match(/<link[^>]+href="([^"]+)"/);
    const link = (linkPlain ? linkPlain[1].trim() : null) ||
                 (linkHref ? linkHref[1].trim() : null);

    if (guid) episodes.push({ title, guid, publishedAt, link });
  }
  return episodes;
}

// Parses a blog/newsletter RSS feed and extracts article content.
// Tries content:encoded first (full article), then description (excerpt).
function parseBlogRss(xml) {
  const articles = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];

    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    const guidMatch = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const guid = guidMatch ? guidMatch[1].trim() : null;

    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const publishedAt = pubDateMatch
      ? new Date(pubDateMatch[1].trim()).toISOString()
      : null;

    const linkPlain = block.match(/<link>([\s\S]*?)<\/link>/);
    const linkHref = block.match(/<link[^>]+href="([^"]+)"/);
    const url = (linkPlain ? linkPlain[1].trim() : null) ||
                (linkHref ? linkHref[1].trim() : null) ||
                guid;

    // Full content preferred over excerpt
    const contentMatch =
      block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ||
      block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    const descMatch =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      block.match(/<description>([\s\S]*?)<\/description>/);

    const rawHtml = contentMatch ? contentMatch[1] : (descMatch ? descMatch[1] : '');
    const content = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (url) articles.push({ title, guid, url, publishedAt, content });
  }
  return articles;
}

// Parses a YouTube Atom feed and returns video objects.
function parseYouTubeAtomFeed(xml) {
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRegex.exec(xml)) !== null) {
    const block = m[1];
    const videoIdMatch = block.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const publishedMatch = block.match(/<published>([\s\S]*?)<\/published>/);
    const idMatch = block.match(/<id>([\s\S]*?)<\/id>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1].trim();
      const guid = idMatch ? idMatch[1].trim() : `yt:video:${videoId}`;
      videos.push({
        videoId,
        title: titleMatch[1].trim(),
        publishedAt: publishedMatch ? publishedMatch[1].trim() : null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        guid
      });
    }
  }
  return videos;
}

// -- YouTube Feed URL Resolution ---------------------------------------------

// Converts a YouTube channel URL to its Atom feed URL.
// Handles /@handle, /c/handle, /channel/UCxxx, and /playlist?list=PL...
async function resolveYouTubeFeedUrl(channelUrl) {
  if (!channelUrl || !channelUrl.includes('youtube.com')) return null;

  const playlistMatch = channelUrl.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistMatch[1]}`;
  }

  const channelIdMatch = channelUrl.match(/\/channel\/(UC[A-Za-z0-9_-]+)/);
  if (channelIdMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
  }

  // @handle and /c/ URLs: fetch the page and extract the channelId from HTML
  if (channelUrl.match(/\/@[A-Za-z0-9_.-]+/) || channelUrl.match(/\/c\/[A-Za-z0-9_.-]+/)) {
    try {
      const res = await fetch(channelUrl, {
        headers: { 'User-Agent': RSS_USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) return null;
      const html = await res.text();
      const idMatch =
        html.match(/"channelId":"(UC[A-Za-z0-9_-]{20,})"/) ||
        html.match(/<meta\s+itemprop="(?:identifier|channelId)"\s+content="(UC[A-Za-z0-9_-]{20,})"/);
      if (idMatch) return `https://www.youtube.com/feeds/videos.xml?channel_id=${idMatch[1]}`;
    } catch {
      return null;
    }
  }
  return null;
}

// -- pod2txt Transcript Fetching ---------------------------------------------

// Requests a transcript from pod2txt. Polls up to 3 times (30s apart) for
// async processing. Returns { transcript } on success or { error } on failure.
async function fetchTranscript(feedUrl, guid, apiKey) {
  if (!apiKey) return { error: 'POD2TXT_API_KEY not set — transcripts unavailable' };

  const maxAttempts = 3;
  const pollInterval = 30000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetch(`${POD2TXT_BASE}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedurl: feedUrl, guid, apikey: apiKey }),
        signal: AbortSignal.timeout(30000)
      });
    } catch (err) {
      return { error: `Network error: ${err.message}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `HTTP ${res.status}: ${text}` };
    }

    const data = await res.json();

    if (data.status === 'ready' && data.url) {
      const txtRes = await fetch(data.url).catch(err => ({ ok: false, message: err.message }));
      if (!txtRes.ok) return { error: `Transcript download failed: HTTP ${txtRes.status}` };
      return { transcript: await txtRes.text() };
    }

    if (data.status === 'processing') {
      console.error(`      pod2txt: processing (attempt ${attempt}/${maxAttempts})...`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, pollInterval));
      continue;
    }

    return { error: data.message || `Unexpected status: ${data.status}` };
  }

  return { error: 'Timed out waiting for transcript' };
}

// -- Source Processors -------------------------------------------------------

// Processes podcast RSS entries (type: "podcast").
// For each source, checks the 3 most recent episodes and fetches a transcript
// for the first unseen one within the lookback window.
async function processPodcasts(rssEntries, apiKey, state, errors) {
  const results = [];
  const cutoff = new Date(Date.now() - PODCAST_LOOKBACK_HOURS * 60 * 60 * 1000);

  for (const source of rssEntries) {
    if (!source.rss) {
      errors.push(`Podcast: No rss URL for "${source.name}"`);
      continue;
    }

    try {
      console.error(`  Fetching RSS: ${source.name}`);
      const res = await fetch(source.rss, {
        headers: {
          'User-Agent': RSS_USER_AGENT,
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: AbortSignal.timeout(30000)
      });
      if (!res.ok) {
        errors.push(`Podcast: HTTP ${res.status} for "${source.name}"`);
        continue;
      }

      const episodes = parsePodcastRss(await res.text());
      console.error(`    ${episodes.length} episodes in feed`);

      const candidates = episodes.slice(0, 3).filter(ep =>
        !state.seenVideos[ep.guid] &&
        (!ep.publishedAt || new Date(ep.publishedAt) >= cutoff)
      );

      for (const ep of candidates) {
        console.error(`    Transcript: "${ep.title}"`);
        const result = await fetchTranscript(source.rss, ep.guid, apiKey);
        state.seenVideos[ep.guid] = Date.now();

        if (result.error) {
          errors.push(`Podcast: transcript error for "${ep.title}": ${result.error}`);
          continue;
        }

        console.error(`    OK (${result.transcript.length} chars)`);
        results.push({
          source: 'podcast',
          name: source.name,
          title: ep.title,
          guid: ep.guid,
          url: ep.link || source.url || source.rss,
          publishedAt: ep.publishedAt,
          transcript: result.transcript
        });
        break; // one episode per source per run
      }
    } catch (err) {
      errors.push(`Podcast: Error with "${source.name}": ${err.message}`);
    }
  }
  return results;
}

// Processes YouTube channel entries.
// Resolves each channel URL to a YouTube Atom feed, picks the most recent
// unseen video, and attempts a transcript via pod2txt.
async function processYouTubeChannels(youtubeEntries, apiKey, state, errors) {
  const results = [];
  const cutoff = new Date(Date.now() - PODCAST_LOOKBACK_HOURS * 60 * 60 * 1000);

  for (const source of youtubeEntries) {
    if (!source.url) {
      errors.push(`YouTube: No url for "${source.name}"`);
      continue;
    }

    try {
      console.error(`  Fetching YouTube feed: ${source.name}`);
      const feedUrl = await resolveYouTubeFeedUrl(source.url);
      if (!feedUrl) {
        errors.push(`YouTube: Could not resolve feed URL for "${source.name}"`);
        continue;
      }

      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': RSS_USER_AGENT },
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) {
        errors.push(`YouTube: HTTP ${res.status} for "${source.name}"`);
        continue;
      }

      const videos = parseYouTubeAtomFeed(await res.text());
      console.error(`    ${videos.length} videos in feed`);

      const candidates = videos.slice(0, 3).filter(v =>
        !state.seenVideos[v.guid] &&
        (!v.publishedAt || new Date(v.publishedAt) >= cutoff)
      );

      for (const video of candidates) {
        console.error(`    Transcript: "${video.title}"`);
        const result = await fetchTranscript(feedUrl, video.guid, apiKey);
        state.seenVideos[video.guid] = Date.now();

        if (result.error) {
          errors.push(`YouTube: transcript error for "${video.title}": ${result.error}`);
          continue;
        }

        console.error(`    OK (${result.transcript.length} chars)`);
        results.push({
          source: 'youtube',
          name: source.name,
          title: video.title,
          guid: video.guid,
          url: video.url,
          publishedAt: video.publishedAt,
          transcript: result.transcript
        });
        break; // one video per channel per run
      }
    } catch (err) {
      errors.push(`YouTube: Error with "${source.name}": ${err.message}`);
    }
  }
  return results;
}

// Processes blog and newsletter RSS entries (type: "blog" or "newsletter").
// Extracts article text from RSS content fields — no transcript API needed.
async function processBlogs(rssEntries, state, errors) {
  const results = [];
  const cutoff = new Date(Date.now() - BLOG_LOOKBACK_HOURS * 60 * 60 * 1000);

  for (const source of rssEntries) {
    if (!source.rss) {
      errors.push(`Blog: No rss URL for "${source.name}"`);
      continue;
    }

    try {
      console.error(`  Fetching RSS: ${source.name}`);
      const res = await fetch(source.rss, {
        headers: { 'User-Agent': RSS_USER_AGENT },
        signal: AbortSignal.timeout(30000)
      });
      if (!res.ok) {
        errors.push(`Blog: HTTP ${res.status} for "${source.name}"`);
        continue;
      }

      const articles = parseBlogRss(await res.text());
      console.error(`    ${articles.length} articles in feed`);

      const candidates = articles.slice(0, MAX_ARTICLES_PER_BLOG + 1).filter(a => {
        const key = a.url || a.guid;
        return key && !state.seenArticles[key] &&
          (!a.publishedAt || new Date(a.publishedAt) >= cutoff);
      });

      let added = 0;
      for (const article of candidates) {
        if (added >= MAX_ARTICLES_PER_BLOG) break;
        if (!article.content || article.content.length < 100) {
          errors.push(`Blog: thin content for "${article.title}" from "${source.name}"`);
          continue;
        }

        const key = article.url || article.guid;
        state.seenArticles[key] = Date.now();

        results.push({
          source: 'blog',
          name: source.name,
          title: article.title,
          url: article.url || source.url || source.rss,
          publishedAt: article.publishedAt,
          content: article.content
        });
        added++;
      }
    } catch (err) {
      errors.push(`Blog: Error with "${source.name}": ${err.message}`);
    }
  }
  return results;
}

// -- Main --------------------------------------------------------------------

async function main() {
  loadEnv({ path: ENV_PATH });

  const args = process.argv.slice(2);
  const podcastsOnly = args.includes('--podcasts-only');
  const blogsOnly = args.includes('--blogs-only');
  const runPodcasts = podcastsOnly || !blogsOnly;
  const runBlogs = blogsOnly || !podcastsOnly;

  const apiKey = process.env.POD2TXT_API_KEY;

  if (!existsSync(USER_SOURCES_PATH)) {
    console.error('No user-sources.json found at ~/.follow-builders/user-sources.json');
    console.error('See config/user-sources.example.json for the format.');
    process.exit(0);
  }

  const sources = await loadUserSources();
  const state = await loadState();
  const errors = [];

  const podcastRss = (sources.rss || []).filter(s => s.type === 'podcast');
  const blogRss = (sources.rss || []).filter(s => s.type === 'blog' || s.type === 'newsletter');
  const youtubeChannels = sources.youtube || [];

  console.error(`User sources: ${youtubeChannels.length} YouTube, ${podcastRss.length} podcast RSS, ${blogRss.length} blogs/newsletters`);

  let allPodcasts = [];
  let allBlogs = [];

  if (runPodcasts) {
    if (podcastRss.length > 0) {
      console.error('\nProcessing podcast RSS feeds...');
      const podcastResults = await processPodcasts(podcastRss, apiKey, state, errors);
      allPodcasts = allPodcasts.concat(podcastResults);
    }

    if (youtubeChannels.length > 0) {
      console.error('\nProcessing YouTube channels...');
      const youtubeResults = await processYouTubeChannels(youtubeChannels, apiKey, state, errors);
      allPodcasts = allPodcasts.concat(youtubeResults);
    }
  }

  if (runBlogs && blogRss.length > 0) {
    console.error('\nProcessing blog/newsletter RSS feeds...');
    allBlogs = await processBlogs(blogRss, state, errors);
  }

  // Ensure output directory exists
  await mkdir(USER_DIR, { recursive: true });

  // Write podcast feed
  await writeFile(USER_PODCAST_FEED_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'user-sources',
    podcasts: allPodcasts,
    stats: {
      podcastEpisodes: allPodcasts.filter(p => p.source === 'podcast').length,
      youtubeVideos: allPodcasts.filter(p => p.source === 'youtube').length
    },
    errors: errors.filter(e => !e.startsWith('Blog')).length > 0
      ? errors.filter(e => !e.startsWith('Blog'))
      : undefined
  }, null, 2));

  // Write blog feed
  await writeFile(USER_BLOG_FEED_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'user-sources',
    blogs: allBlogs,
    stats: { blogPosts: allBlogs.length },
    errors: errors.filter(e => e.startsWith('Blog')).length > 0
      ? errors.filter(e => e.startsWith('Blog'))
      : undefined
  }, null, 2));

  await saveState(state);

  console.error(`\nDone: ${allPodcasts.length} podcast/YouTube, ${allBlogs.length} blog posts`);
  if (errors.length > 0) {
    console.error(`Non-fatal errors: ${errors.length}`);
    for (const e of errors) console.error(`  ${e}`);
  }
}

main().catch(err => {
  console.error('fetch-user-sources failed:', err.message);
  process.exit(1);
});
