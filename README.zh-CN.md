[English](README.md) | **繁體中文**

# My AI Digest：個人化雙語智識摘要

每天早晨，一封精選摘要直送你的 Telegram。

追蹤跨領域的思想家、研究者與創作者，涵蓋 AI 科技、神經科學、哲學、商業、心理學與個人成長——只為你篩選值得關注的內容。

---

## 它能做什麼

每日一封 Telegram 訊息，包含 **5 至 8 則精選內容**，從過去 24 至 48 小時的來源中挑選。

**納入標準：**
- 最新研究成果、書籍出版、產品發布
- 具備實質論據的逆向觀點與原創洞見
- 來自真實從業者的具體可行框架

**排除標準：**
- 日常閒聊與低資訊密度內容
- 政治評論與文化戰爭
- 廣告、贊助內容與自我宣傳

### 繁體中文為主，英文為輔

每則摘要以**繁體中文**呈現，英文原文附於其後。

### 每則附上經典語錄

每條內容附上一句歷史上思想家的語錄（哲學家、科學家、作家等），中英對照，與主題呼應。

### 可互動的 Telegram 機器人

閱讀摘要後，可直接回覆提問。AI 會根據**完整原始內容**（完整 YouTube 逐字稿、完整文章）回答你的問題，而非僅依據摘要。

---

## 涵蓋領域

### AI 與科技
Lex Fridman、Andrej Karpathy、All-In Podcast、硅谷101、大小馬聊科技、Paul Graham、Stratechery、TED Tech

### 神經科學、健康與心理學
Huberman Lab、Matt Walker、Adam Grant、Matthew Hussey、Jordan Peterson、Rich Roll、Being Well (Rick Hanson)、Neurodiversity Podcast

### 哲學與深度思考
Naval Ravikant、Shi Heng Yi、The School of Life、Academy of Ideas、Pursuit of Wonder

### 商業與創業
Steven Bartlett、Leila Hormozi、My First Million、Codie Sanchez、Lenny's Podcast、Lenny's Newsletter

### 個人成長與心態
Jay Shetty、Chris Williamson、Dan Koe、Simon Sinek、Human School、Deep Questions (Cal Newport)

---

## 設定方式

請參閱 [README.md](README.md)（英文）取得完整安裝與設定說明，包含：
- Telegram Bot 建立步驟
- API 金鑰設定
- 排程與自動化

---

## 自訂你的來源

有兩種方式可以更改摘要內容，視你的需求而定。

### 方式一：個人來源（推薦）

編輯 `~/.follow-builders/user-sources.json`。這個檔案存放在 repo 外部，不會被提交或覆蓋。支援 YouTube 頻道、Podcast RSS 和部落格。

```bash
# 複製範本開始使用
cp config/user-sources.example.json ~/.follow-builders/user-sources.json
# 然後編輯加入你的來源
```

格式如下：

```json
{
  "youtube": [
    { "name": "頻道名稱", "url": "https://www.youtube.com/@handle", "category": "ai_tech" }
  ],
  "rss": [
    { "name": "我的 Podcast", "rss": "https://feeds.example.com/show.rss",
      "url": "https://example.com", "type": "podcast", "category": "tech" },
    { "name": "我的部落格", "rss": "https://example.substack.com/feed",
      "url": "https://example.substack.com", "type": "blog", "category": "ai" }
  ]
}
```

編輯完成後，執行以下指令抓取最新內容：

```bash
cd scripts && node fetch-user-sources.js
```

這會產生 `~/.follow-builders/user-feed-podcasts.json` 和 `~/.follow-builders/user-feed-blogs.json`。下次執行 `prepare-digest.js` 時（手動或排程），會自動將這些內容與預設來源合併。

若要讓個人來源每天自動更新，在摘要送出前 10 分鐘新增一個 cron 排程：

```bash
SKILL_DIR="$(pwd)"
# 每天 7:50 更新個人來源
(crontab -l 2>/dev/null; echo "50 7 * * * cd $SKILL_DIR/scripts && node fetch-user-sources.js 2>/dev/null") | crontab -
```

**如何找到來源網址：**

Podcast RSS：
- 大多數 Podcast App：開啟節目 → 分享或資訊 → 複製 RSS 連結
- Substack Podcast：`https://yourshow.substack.com/podcast`
- Spotify：網頁版開啟節目 → 三個點 → 分享 → RSS feed

部落格／電子報 RSS：
- Substack：`https://作者名稱.substack.com/feed`
- WordPress：首頁網址後加 `/feed`
- Ghost：首頁網址後加 `/rss/`
- 找不到：搜尋「[部落格名稱] rss feed」

YouTube 頻道：直接貼上頻道網址，`fetch-user-sources.js` 支援 `/@handle`、`/channel/UCxxx`、`/playlist?list=PL...` 等格式。

### 方式二：修改預設來源

若想更改 GitHub Actions 的 `generate-feed.js` 所使用的來源（適合自行架設供多人使用的版本），請編輯 `config/default-sources.json` 並推送至 GitHub。Actions 會在下次排程時執行（UTC 時間 6:17am），或前往 **Actions** → **Generate Feeds** → **Run workflow** 立即觸發。

### 參考：user-sources.example.json

`config/user-sources.example.json` 展示了所有支援的欄位與說明。**這個檔案不會被任何腳本讀取**，僅作為格式參考。

---

## 授權

MIT — 部分程式碼源自 [zarazhangrui/follow-builders](https://github.com/zarazhangrui/follow-builders)，依 MIT 授權使用。
