# My AI Digest

A personalized, bilingual intelligence digest delivered daily to Telegram.

Tracks thinkers, researchers, and builders across AI, neuroscience, philosophy,
business, and personal development — and surfaces only what's worth your attention.

---

## What It Does

Every morning, an AI agent scans your source list, filters out the noise, and
delivers a Telegram message with **5–8 curated items** from the past 24–48 hours.

**What gets included:**
- New research findings, book releases, product launches
- Trending topics with genuine substance
- Original insights — opinions backed by evidence or experience

**What gets filtered out:**
- Casual chatter and social media filler
- Political commentary and culture war takes
- Advertisements, sponsored segments, self-promotion

### Bilingual by default

Each digest item is presented in **Traditional Chinese first, English below** —
useful for maintaining vocabulary in both languages and for sharing across
language contexts.

### A classic quote with every item

Each entry ends with a relevant quote from a historical thinker or writer —
in English, followed by a Chinese translation. A small anchor to the longer
arc of human thought.

### Ask follow-up questions

The Telegram bot is interactive. After reading a digest item, you can reply
with a question and the AI will answer based on the full source content —
the complete YouTube transcript, full article text, or podcast episode — not
just the summary. Ask for elaboration, push back on an idea, or request
a deeper explanation of a specific point.

---

## What It Covers

This is not an AI-only digest. The source list spans six domains:

### AI & Technology
YouTube channels and podcasts from people who are actually building at the
frontier — not just commenting on it.

| Source | Format |
|---|---|
| Lex Fridman | YouTube / Podcast |
| Andrej Karpathy | YouTube |
| All-In Podcast | YouTube / Podcast |
| 硅谷101 | YouTube / Podcast |
| 大小馬聊科技 | YouTube |
| Paul Graham | Blog |
| Stratechery (Ben Thompson) | Newsletter |
| TED Tech | Podcast |

### Neuroscience, Health & Psychology
Scientists and clinicians who translate research into practice.

| Source | Format |
|---|---|
| Huberman Lab | YouTube |
| Matt Walker | YouTube / Podcast |
| Adam Grant | YouTube |
| Matthew Hussey | YouTube |
| Jordan Peterson | YouTube |
| Rich Roll | YouTube / Podcast |
| Being Well (Rick Hanson) | Podcast |
| Neurodiversity Podcast | Podcast |
| No Stupid Questions | Podcast |

### Philosophy & Deep Thinking
Channels dedicated to ideas that outlast the news cycle.

| Source | Format |
|---|---|
| Naval Ravikant | YouTube / Podcast |
| Shi Heng Yi | YouTube |
| The School of Life | YouTube |
| Academy of Ideas | YouTube |
| Pursuit of Wonder | YouTube |

### Business & Entrepreneurship
Founders, operators, and investors who share how they actually think.

| Source | Format |
|---|---|
| Steven Bartlett (Diary of a CEO) | YouTube |
| Leila Hormozi | YouTube |
| My First Million | YouTube |
| Codie Sanchez | YouTube |
| Natalie Dawson | YouTube |
| Lenny's Podcast | YouTube |
| Lenny's Newsletter | Newsletter |

### Personal Development & Mindset
Practitioners focused on how to live and work with more intention.

| Source | Format |
|---|---|
| Jay Shetty | YouTube |
| Chris Williamson | YouTube |
| Dan Koe | YouTube / Podcast |
| Vinh Giang | YouTube |
| Simon Sinek | YouTube |
| Human School | YouTube / Podcast |
| Deep Questions (Cal Newport) | Podcast |

---

## How It Works

```
Your source list (YouTube / Podcast RSS / Blogs)
        ↓
  Feed fetcher runs daily
        ↓
  AI filters, selects 5–8 items, writes bilingual summaries
        ↓
  Digest sent to your Telegram chat
        ↓
  You reply with questions → AI answers from full source content
```

1. **Feed fetcher** — pulls latest YouTube videos via Atom feeds, podcast
   episodes via RSS, and blog posts via scraping. No X/Twitter.
2. **AI filter** — scores items by signal (new research, original insight,
   meaningful announcement) and discards low-value content.
3. **Bilingual summary** — each item gets a Traditional Chinese summary
   followed by the English original, plus a sourced classic quote.
4. **Telegram delivery** — the digest is sent as a formatted message to your
   private Telegram chat via a bot you control.
5. **Interactive Q&A** — the bot stays active; questions you send are answered
   using the full transcript or article text as context.

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Telegram](https://telegram.org/) account
- An [Anthropic API key](https://console.anthropic.com/) (for Claude)
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))

### 1. Clone the repo

```bash
git clone https://github.com/chenweian333/my-ai-digest.git
cd my-ai-digest/scripts && npm install
```

### 2. Create your env file

```bash
mkdir -p ~/.follow-builders
cp .env.example ~/.follow-builders/.env
```

Edit `~/.follow-builders/.env` and fill in:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_BotFather
```

### 3. Set up your Telegram bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the token BotFather gives you → paste into `~/.follow-builders/.env`
4. Open a chat with your new bot and send it any message (e.g. "hi")
5. Get your chat ID:
   ```bash
   curl -s "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates" | \
     python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['message']['chat']['id'])"
   ```
6. Save the chat ID in `~/.follow-builders/config.json`:
   ```json
   {
     "language": "bilingual",
     "timezone": "Asia/Taipei",
     "frequency": "daily",
     "deliveryTime": "08:00",
     "delivery": {
       "method": "telegram",
       "chatId": "YOUR_CHAT_ID_HERE"
     },
     "onboardingComplete": true
   }
   ```

### 4. Schedule daily delivery

Add two cron jobs: one to fetch your personal sources (10 minutes before the
digest), and one to send the digest:

```bash
SKILL_DIR="$(pwd)"
# Fetch personal sources at 7:50am
(crontab -l 2>/dev/null; echo "50 7 * * * cd $SKILL_DIR/scripts && node fetch-user-sources.js 2>/dev/null") | crontab -
# Send digest at 8:00am
(crontab -l 2>/dev/null; echo "0 8 * * * cd $SKILL_DIR/scripts && node prepare-digest.js 2>/dev/null | node deliver.js 2>/dev/null") | crontab -
```

Adjust the times to your preferred hour in your local timezone. If you have
no personal sources in `~/.follow-builders/user-sources.json`, you can skip
the first cron line.

### 5. Run manually to test

```bash
cd scripts && node fetch-user-sources.js && node prepare-digest.js | node deliver.js
```

You should receive a digest in your Telegram chat within a minute.

---

## Customizing Your Sources

There are two ways to change what appears in your digest, depending on whether
you want personal additions or want to change the defaults everyone gets.

### Option A — Personal sources (recommended)

Edit `~/.follow-builders/user-sources.json`. This file lives outside the repo
and is never committed or overwritten by updates. It supports YouTube channels,
podcast RSS feeds, and blogs all in one place.

```bash
# Copy the template to get started
cp config/user-sources.example.json ~/.follow-builders/user-sources.json
# Then edit it with your sources
```

The format:

```json
{
  "youtube": [
    { "name": "Channel Name", "url": "https://www.youtube.com/@handle", "category": "ai_tech" }
  ],
  "rss": [
    { "name": "My Podcast", "rss": "https://feeds.example.com/show.rss",
      "url": "https://example.com", "type": "podcast", "category": "tech" },
    { "name": "My Blog",    "rss": "https://example.substack.com/feed",
      "url": "https://example.substack.com", "type": "blog", "category": "ai" }
  ]
}
```

After editing, run the fetcher to pull fresh content:

```bash
cd scripts && node fetch-user-sources.js
```

This writes `~/.follow-builders/user-feed-podcasts.json` and
`~/.follow-builders/user-feed-blogs.json`. The next time `prepare-digest.js`
runs (either manually or via cron), it merges these with the central feeds
automatically.

To keep your personal sources fresh daily, add a second cron job that runs
`fetch-user-sources.js` before the digest:

```bash
SKILL_DIR="$(pwd)"
(crontab -l 2>/dev/null; echo "50 7 * * * cd $SKILL_DIR/scripts && node fetch-user-sources.js 2>/dev/null") | crontab -
```

### Finding source URLs

**Podcast RSS:**
- Most podcast apps: open show → share or info → copy RSS link
- Substack podcasts: `https://yourshow.substack.com/podcast`
- Spotify: open show on web → three dots → Share → RSS feed
- The show's website: look in the footer or "About" page

**Blog/newsletter RSS:**
- Substack: `https://yourauthor.substack.com/feed`
- WordPress: append `/feed` to the homepage URL
- Ghost: append `/rss/` to the homepage URL
- Other: try appending `/rss`, `/feed`, or `/atom.xml`; or search `[blog name] rss feed`

**YouTube channels:** paste the channel URL directly — `fetch-user-sources.js`
resolves `/@handle`, `/channel/UCxxx`, and `/playlist?list=PL...` formats.

### Option B — Change the default sources

To change the sources that `generate-feed.js` processes on GitHub Actions
(useful if you're running a fork for multiple people), edit
`config/default-sources.json` and push. Actions picks it up on its next run
(6:17am UTC), or trigger it immediately from **Actions** → **Generate Feeds**
→ **Run workflow**.

The format in `default-sources.json` uses `rssUrl` (not `rss`) as the field name:

```json
{
  "podcasts": [
    { "name": "Show Name", "rssUrl": "https://feeds.example.com/show.rss", "url": "https://example.com" }
  ],
  "blogs": [
    { "name": "Blog Name", "type": "rss", "rssUrl": "https://example.com/feed",
      "indexUrl": "https://example.com", "fetchMethod": "rss" }
  ]
}
```

### Reference: user-sources.example.json

`config/user-sources.example.json` shows every supported field with comments.
It is not read by any script — it is a reference template only.

---

## Customizing the Digest Style

The digest format is controlled by plain-English prompt files in `prompts/`:

| File | Controls |
|---|---|
| `digest-intro.md` | Overall format, tone, number of items |
| `summarize-podcast.md` | How podcast episodes are condensed |
| `summarize-blogs.md` | How articles and newsletters are summarized |
| `translate.md` | Chinese translation style and tone |

To customize without losing updates, copy the file to `~/.follow-builders/prompts/`
and edit it there — your version takes priority over the defaults:

```bash
mkdir -p ~/.follow-builders/prompts
cp prompts/digest-intro.md ~/.follow-builders/prompts/digest-intro.md
# Now edit ~/.follow-builders/prompts/digest-intro.md
```

---

## Configuration Reference

`~/.follow-builders/config.json`

| Field | Options | Description |
|---|---|---|
| `language` | `en`, `zh`, `bilingual` | Digest language. `bilingual` = Traditional Chinese first, English below |
| `timezone` | IANA string | e.g. `Asia/Taipei`, `America/New_York` |
| `frequency` | `daily`, `weekly` | How often to generate a digest |
| `deliveryTime` | `HH:MM` | Time of day (24-hour, in your timezone) |
| `delivery.method` | `telegram`, `email`, `stdout` | How the digest is sent |
| `delivery.chatId` | string | Your Telegram chat ID |
| `delivery.email` | string | Email address (if using email delivery) |

`~/.follow-builders/.env`

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | If using Telegram | Token from @BotFather |
| `RESEND_API_KEY` | If using email | From [resend.com](https://resend.com) |
| `DIGEST_MODEL` | No | Override Claude model (default: `claude-haiku-4-5-20251001`) |

---

## Privacy

- All source content is fetched directly from public URLs — no third-party
  intermediary sees your reading list
- Your API keys, config, and reading history are stored locally in
  `~/.follow-builders/` and never leave your machine
- The bot only reads messages you send to it; it does not log conversations

---

## License

MIT — see [LICENSE](LICENSE).

This project is built on [follow-builders](https://github.com/zarazhangrui/follow-builders)
by zarazhangrui, used under the MIT License. The delivery scripts, feed generation
architecture, and skill framework originate from that project; source selection,
bilingual format, interactive Q&A, and prompt system are original additions.
