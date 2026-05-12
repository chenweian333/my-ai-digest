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

**來源是如何運作的：** Feed 產生器（`generate-feed.js`）每天透過 GitHub Actions 執行，讀取 `config/default-sources.json`，並將更新後的 `feed-podcasts.json` 和 `feed-blogs.json` 提交至你的 repo。每次生成摘要時，本地的 `prepare-digest.js` 會從 GitHub 抓取這些檔案。

要更改摘要中出現的內容，請編輯 `config/default-sources.json` 並推送到 GitHub。Actions 會在下一次排程時執行（UTC 時間 6:17am），或者你可以前往 **Actions** 分頁 → **Generate Feeds** → **Run workflow** 立即觸發。

### 新增 Podcast

找到節目的 RSS feed 網址（大多數 Podcast App 在節目詳情中有列出；Spotify 網頁版可在「分享 → RSS 連結」中找到），然後將條目新增至 `config/default-sources.json` 的 `podcasts` 陣列：

```json
{
  "name": "Huberman Lab",
  "rssUrl": "https://feeds.megaphone.fm/hubermanlab",
  "url": "https://www.youtube.com/@hubermanlab"
}
```

`url` 是 YouTube 頻道或官網連結，當找不到特定集數連結時作為備用。`rssUrl` 是 Feed 產生器實際讀取的網址，用於發現新集數並抓取逐字稿。

**如何找到 Podcast RSS 網址：**
- 大多數 Podcast App：開啟節目 → 分享或資訊 → 複製 RSS 連結
- Substack Podcast：`https://yourshow.substack.com/podcast`
- Spotify：網頁版開啟節目 → 三個點 → 分享 → RSS feed
- 節目官網：查看頁尾或「關於」頁面

### 新增部落格或電子報

大多數 Substack、Ghost 或 WordPress 的部落格和電子報都有公開的 RSS feed。

```json
{
  "name": "Paul Graham",
  "type": "rss",
  "rssUrl": "http://www.paulgraham.com/rss.html",
  "indexUrl": "https://paulgraham.com",
  "fetchMethod": "rss"
}
```

**如何找到部落格的 RSS 網址：**
- Substack：`https://作者名稱.substack.com/feed`
- WordPress：在首頁網址後加上 `/feed`
- Ghost：在首頁網址後加上 `/rss/`
- 其他部落格：嘗試加上 `/rss`、`/feed` 或 `/atom.xml`
- 找不到的話：搜尋「[部落格名稱] rss feed」

### YouTube 頻道（使用 Podcast RSS 方式）

Feed 產生器透過 RSS 處理來源，不直接爬取 YouTube 頻道。大多數主要的 YouTube Podcast 創作者同時也發布標準 Podcast RSS feed，這是你應該使用的方式：

| 創作者類型 | 找到 RSS 的方法 |
|---|---|
| 有 Spotify 頁面 | 網頁版 Spotify → 節目頁 → 分享 → RSS 連結 |
| 有自己的網站 | 查看頁尾是否有「Podcast」或 RSS 連結 |
| Substack 型 | `https://他們的名稱.substack.com/podcast` |
| Apple Podcasts | 在瀏覽器開啟 → 右鍵標題 → 複製 RSS |

如果創作者只在 YouTube 發布，沒有 Podcast RSS feed，則目前無法透過 Feed 產生器自動追蹤。

### 移除來源

從 `config/default-sources.json` 中刪除該條目後推送即可。下次 Actions 執行時將不再處理該來源。

### 參考：user-sources.example.json

`config/user-sources.example.json` 展示了完整的來源格式，適合用來規劃你想新增的內容。**這個檔案不會被任何腳本讀取**——你可以將它複製到 `~/.follow-builders/user-sources.json` 作為個人的來源願望清單，與正式設定分開管理。

---

## 授權

MIT — 部分程式碼源自 [zarazhangrui/follow-builders](https://github.com/zarazhangrui/follow-builders)，依 MIT 授權使用。
