**English** | [中文](README.zh-CN.md)

# Follow Builders, Not Influencers

An AI-powered digest that tracks the top builders in AI — researchers, founders, PMs,
and engineers who are actually building things — and delivers curated summaries of
what they're saying.

**Philosophy:** Follow people who build products and have original opinions, not
influencers who regurgitate information.

## What You Get

A daily or weekly digest delivered to your preferred messaging app (Telegram, Discord,
WhatsApp, etc.) with:

- Summaries of new podcast episodes from top AI podcasts
- Key posts and insights from 25 curated AI builders on X/Twitter
- Full articles from official AI company blogs (Anthropic Engineering, Claude Blog)
- Links to all original content
- Available in English, Chinese, or bilingual

## Quick Start

1. Install the skill in your agent (OpenClaw or Claude Code)
2. Say "set up follow builders" or invoke `/follow-builders`
3. The agent walks you through setup conversationally — no config files to edit

The agent will ask you:
- How often you want your digest (daily or weekly) and what time
- What language you prefer
- How you want it delivered (Telegram, email, or in-chat)

No API keys needed — all content is fetched centrally.
Your first digest arrives immediately after setup.

## Changing Settings

Your delivery preferences are configurable through conversation. Just tell your agent:

- "Switch to weekly digests on Monday mornings"
- "Change language to Chinese"
- "Make the summaries shorter"
- "Show me my current settings"

The source list (builders and podcasts) is curated centrally and updates
automatically — you always get the latest sources without doing anything.

## Customizing the Summaries

The skill uses plain-English prompt files to control how content is summarized.
You can customize them two ways:

**Through conversation (recommended):**
Tell your agent what you want — "Make summaries more concise," "Focus on actionable
insights," "Use a more casual tone." The agent updates the prompts for you.

**Direct editing (power users):**
Edit the files in the `prompts/` folder:
- `summarize-podcast.md` — how podcast episodes are summarized
- `summarize-tweets.md` — how X/Twitter posts are summarized
- `summarize-blogs.md` — how blog posts are summarized
- `digest-intro.md` — the overall digest format and tone
- `translate.md` — how English content is translated to Chinese

These are plain English instructions, not code. Changes take effect on the next digest.

## Customizing Your Sources

The default source list (AI builders and podcasts) is curated centrally at
`config/default-sources.json` and updated automatically.

**If you want to track your own set of people** — YouTube channels, podcasts,
newsletters — you can add a personal `user-sources.json`:

```bash
cp config/user-sources.example.json ~/.follow-builders/user-sources.json
```

Edit the file with your own sources. The format supports:
- **YouTube channels** — `@handle` or `/channel/UCxxx` URLs
- **Playlists** — `/playlist?list=PLxxx` URLs
- **RSS/Atom feeds** — podcasts, newsletters, blogs

See `config/user-sources.example.json` for the full format with comments.

## Default Sources

### Podcasts (6)
- [Latent Space](https://www.youtube.com/@LatentSpacePod)
- [Training Data](https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8)
- [No Priors](https://www.youtube.com/@NoPriorsPodcast)
- [Unsupervised Learning](https://www.youtube.com/@RedpointAI)
- [The MAD Podcast with Matt Turck](https://www.youtube.com/@DataDrivenNYC)
- [AI & I by Every](https://www.youtube.com/playlist?list=PLuMcoKK9mKgHtW_o9h5sGO2vXrffKHwJL)

### AI Builders on X (25)
[Andrej Karpathy](https://x.com/karpathy), [Swyx](https://x.com/swyx), [Josh Woodward](https://x.com/joshwoodward), [Kevin Weil](https://x.com/kevinweil), [Peter Yang](https://x.com/petergyang), [Nan Yu](https://x.com/thenanyu), [Madhu Guru](https://x.com/realmadhuguru), [Amanda Askell](https://x.com/AmandaAskell), [Cat Wu](https://x.com/_catwu), [Thariq](https://x.com/trq212), [Google Labs](https://x.com/GoogleLabs), [Amjad Masad](https://x.com/amasad), [Guillermo Rauch](https://x.com/rauchg), [Alex Albert](https://x.com/alexalbert__), [Aaron Levie](https://x.com/levie), [Ryo Lu](https://x.com/ryolu_), [Garry Tan](https://x.com/garrytan), [Matt Turck](https://x.com/mattturck), [Zara Zhang](https://x.com/zarazhangrui), [Nikunj Kothari](https://x.com/nikunj), [Peter Steinberger](https://x.com/steipete), [Dan Shipper](https://x.com/danshipper), [Aditya Agarwal](https://x.com/adityaag), [Sam Altman](https://x.com/sama), [Claude](https://x.com/claudeai)

### Official Blogs (2)
- [Anthropic Engineering](https://www.anthropic.com/engineering) — technical deep-dives from the Anthropic team
- [Claude Blog](https://claude.com/blog) — product announcements and updates from Claude

## Installation

### OpenClaw
```bash
# From ClawhHub (coming soon)
clawhub install follow-builders

# Or manually
git clone https://github.com/zarazhangrui/follow-builders.git ~/skills/follow-builders
cd ~/skills/follow-builders/scripts && npm install
```

### Claude Code
```bash
git clone https://github.com/zarazhangrui/follow-builders.git ~/.claude/skills/follow-builders
cd ~/.claude/skills/follow-builders/scripts && npm install
```

If you plan to use Telegram or email delivery, set up your keys:

```bash
mkdir -p ~/.follow-builders
cp ~/.claude/skills/follow-builders/.env.example ~/.follow-builders/.env
# Edit ~/.follow-builders/.env and fill in your delivery key
```

## Requirements

- An AI agent (OpenClaw, Claude Code, or similar)
- Internet connection (to fetch the central feed)

That's it. No API keys needed for reading content. All blog articles, YouTube
transcripts, and X/Twitter posts are fetched centrally and updated daily.
Telegram or email delivery requires a bot token or Resend API key (see `.env.example`).

## How It Works

1. A central feed is updated daily with the latest content from all sources
   (blog articles via web scraping, YouTube transcripts via Supadata, X/Twitter via official API)
2. Your agent fetches the feed — one HTTP request, no API keys
3. Your agent remixes the raw content into a digestible summary using your preferences
4. The digest is delivered to your messaging app (or shown in-chat)

See [examples/sample-digest.md](examples/sample-digest.md) for what the output looks like.

## Running Your Own Fork

If you want to curate your own set of AI builders (or any topic), fork this repo
and run the feed generator yourself. The architecture is two parts:

1. **Feed generator** (`scripts/generate-feed.js`) — runs on GitHub Actions daily,
   fetches content, and commits `feed-*.json` to your repo
2. **Skill** (`SKILL.md` + `scripts/prepare-digest.js`) — reads from your fork's
   feed URLs and remixes content into a digest

### Step 1: Fork and configure sources

Edit `config/default-sources.json` to set your own X accounts, podcast RSS feeds,
and blog URLs.

### Step 2: Set GitHub Secrets

In your fork's repository settings, add two secrets:

| Secret | Where to get it |
|---|---|
| `X_BEARER_TOKEN` | [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard) — requires Basic tier ($100/mo) or higher |
| `POD2TXT_API_KEY` | [pod2txt.vercel.app](https://pod2txt.vercel.app) — for podcast transcripts |

The GitHub Actions workflow in `.github/workflows/generate-feeds.yml` is already
configured to use these secrets.

### Step 3: Point the skill at your fork

In `scripts/prepare-digest.js`, update the feed URLs at the top of the file to
point to your fork:

```js
const FEED_X_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/feed-x.json';
const FEED_PODCASTS_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/feed-podcasts.json';
const FEED_BLOGS_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/feed-blogs.json';
const PROMPTS_BASE = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/prompts';
```

### Step 4: Install and run

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ~/.claude/skills/follow-builders
cd ~/.claude/skills/follow-builders/scripts && npm install
```

Your feed will update daily via GitHub Actions. The first run may take a few
minutes as podcast transcripts are fetched.

### Cost and API notes

- **X/Twitter API** — Basic tier required for timeline access (~$100/mo). Free tier
  does not support fetching user timelines.
- **pod2txt** — check [pod2txt.vercel.app](https://pod2txt.vercel.app) for current pricing.
- **Blogs** — scraped directly, no API key needed.
- **AI remixing** — uses your existing Claude Code or OpenClaw API access.

## Privacy

- No API keys are sent anywhere — all content is fetched centrally
- If you use Telegram/email delivery, those keys are stored locally in `~/.follow-builders/.env`
- The skill only reads public content (public blog posts, public YouTube videos, public X posts)
- Your configuration, preferences, and reading history stay on your machine

## License

MIT

