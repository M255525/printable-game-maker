# printable-game-maker — 列印即玩桌遊產生器

把課程題材（類別、名詞、說明、題目、流程步驟）變成 A4 可列印的紙上桌遊。六種機制：🃏 配對記憶、🗂️ 分類大挑戰、🎲 骰子問答、🔢 流程排序、🔲 名詞賓果、🗣️ 說給隊友猜。輸出卡牌（裁切虛線、可選雙面卡背）、骰子展開圖、賓果卡、每個遊戲一頁規則＋討論題、計分表；用瀏覽器列印／另存 PDF。

2026-11-14 建立。使用者從「跨距大的工具方向」清單選了 #6。

- 純靜態：`index.html`（CSS，綠色切割墊＋白紙＋橘色紙膠帶風格）＋`data.js`（6 個內建題材包、遊戲機制、出卡、規則文字、文字／JSON 匯入；node 可 require）＋`app.js`（畫面、預覽、AI）＋`manual.html`＋PWA。
- 本機預覽 port **8880**（`.claude/launch.json` 的 `printable-game-maker`）。visitor-badge `m255525.printablegamemaker`。線上網址預定 <https://m255525.github.io/printable-game-maker/>（`ONLINE`，印在規則頁頁尾）。**2026-11-14 已上線**（repo 由使用者自己 `gh repo create`；push 時 Pages 還沒開，第一次部署失敗，開 Pages 後 `gh run rerun` 成功）。程式牆在 `REPO_META`，github-dashboard 已補。

## 引擎（data.js）
- 題材格式 `{name, ic, sub, qmode:'cat'|'def', cats:[{n,ic}], items:[{c,t,d,q,a}], steps:{title, list}}`，一律經 `normPack()`（截長度：名詞 24、說明 60、題目 70；類別最多 9、名詞最多 200、步驟最多 20；去控制字元）。內建題材內容是自行撰寫的教學示範，開店流程刻意不寫法規數字。
- `check(g, pack, opt)` 回傳不足的原因（空字串＝可以做）；`build(g, pack, opt, seed)` 回 `{cards, dice, boards}`，同 seed 可重現。賓果只有 5×5 有中間免費格（check 與 build 的格數規則要一致，曾不一致過）。
- 骰子面：前 6 個類別，不足補「任選類別／再擲一次／送分題」。題目卡沒寫 q/a 時依 `qmode` 自動出題（`questions()`）。答案一律放在 `flip`（卡片下方倒印）。
- `mirrorRow(cards, cols)`：卡背每列左右對調（長邊翻頁雙面列印），不足一列補 null。
- `parseText()`：每行「類別｜名詞｜說明｜題目｜答案」，分隔 Tab／|／｜／逗號，標題列略過，`#流程：標題` 之後每行一步（去掉前置編號）；`toText()` 是反向，兩者往返要一致（測試有檢查）。`fromJson()` 吃 AI 的 JSON（類別可用名稱或索引）。`aiPrompt()` 要求不得編造數據／法規條號。
- **改 data.js 後跑 `node tools/test_engine.mjs`**（6 題材 × 6 遊戲的檢查、張數、可重現、配對成對、分類卡不洩漏類別、流程每組 1..n、賓果每張不同、文字往返、JSON 匯入、惡意輸入截斷）。

## 畫面（app.js）
- 左側三張卡（選題材／選遊戲／列印設定），右側預覽：每頁 `.sheet` 是 210×297mm，卡片用 mm 定位（`--u`＝卡寬/63 縮放字級），預覽用 CSS `zoom`（沒存過時依寬度自動 0.25～0.5）。列印 CSS `@page A4 margin 0`、只留 `.sheet`、`print-color-adjust:exact`。
- 頁序：每個遊戲「規則頁 → 卡牌頁（＋卡背頁）→ 骰子頁 → 賓果頁」，最後計分表。
- 配對卡**不要印配對編號**（曾在角落印 #n，等於直接洩漏答案，已拿掉）。
- AI：BYOK 7 家，`PROVIDERS`／`callLLM()`／`geminiModelFix()` 複製自 `政府補助認證產生器/shop-opening-checklist/ai.js`（改模型清單時兩邊一起看）；免金鑰路徑＝複製提示詞＋貼回（JSON 或表格都吃，`importAnswer()`）。
- localStorage 前綴 `pgm.`：`state`（目前題材、遊戲、列印設定、seed、分頁）、`mypacks`（最多 30）、`ai`（含金鑰）、`aiTopic/aiAud/aiN`、`zoom`、`fs`、`fold`、`warnSeen`、`marquee`。⚙「🧹 清除全部資料」保留 fs/fold/warnSeen/marquee。
- 題材檔 `.json`（`app:'printable-game-maker'`）可下載／開啟；也能開 .csv/.txt/.tsv（同表格格式，上限 2MB）。
- 測試掛鉤 `window._pgm`（S、ACT、layout、importAnswer）。

## 驗證
- `python tools/e2e_print.py <資料夾>`（需先開 8880）：6 題材全開六遊戲＋卡背的頁數（42～52 頁）、卡片文字不溢出、三種卡牌實際尺寸 mm 與 A4 紙張尺寸、卡背頁接在卡牌頁後、`page.pdf()` 頁數＝預覽頁數、貼表格、匯入 AI JSON（含 ```json 圍欄）、存我的題材、375px 無橫向溢出。2026-11-14 本機與線上版（`PGM_BASE=https://m255525.github.io/printable-game-maker/`）都全過、無 console 錯誤。PDF 用 PyMuPDF（fitz）轉圖逐頁目視過。
- **實體印表機、雙面對齊、卡紙未實測**。

## 標準配備
跑馬燈（工作區公告 GAS，滑鼠移入暫停，不可關）、⚙ 常用設定（收合式＋關於本工具）、首訪警語＋頁面入口、`manual.html#creator` 完整版（改 `tools/manual_body.html` 後跑 `python tools/build_manual.py`）、PWA（`tools/make_icons.py`；上線改版升 `service-worker.js` 的 `CACHE_NAME`）、訪客計數器。沒有加浮水印（印出來的是給學員玩的卡牌）。無序號。
