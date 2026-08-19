# 作業 3：建立迷你知識庫

本題使用 **OpenAI Embeddings API** 將知識內容轉成向量、存入 **Qdrant 向量資料庫**，並以語意搜尋驗證檢索結果的相關性。主題選擇「**台灣城市介紹**」，共 5 筆資料。

## 實作內容

- **Embeddings 程式**：`../shared/lib/embeddings.js` 使用共用的 OpenAI client，一次把多句送進 `text-embedding-3-small` 取得向量（1536 維）
- **向量資料庫操作程式**：`../shared/lib/qdrant.js` 提供泛用的 `recreateCollection` / `collectionExists` / `upsertPoints` / `search`，全部以 `collectionName` 為參數，不綁定特定題目
- **知識庫初始化程式**：`seed.js` 建立 collection、取得 5 筆城市的向量並寫入 Qdrant
- **搜尋測試程式**：`search-test.js` 依 `data/queries.js` 定義的 3 種問法逐一搜尋，輸出城市、相似度分數與描述
- **互動搜尋程式**：`index.js` 提供 CLI 迴圈，可自由輸入問題查詢（輸入 `exit` 離開）

初始化與搜尋刻意拆成兩支程式：`seed.js` 只在資料變動時執行一次，`index.js` / `search-test.js` 啟動時不重建 collection、也不重跑 embedding，直接查詢既有向量。

相關檔案：

| 檔案 | 說明 |
| --- | --- |
| `../shared/lib/embeddings.js` | Embeddings 相關程式（`embedAll` / `embed` / `EMBEDDING_MODEL`） |
| `../shared/lib/qdrant.js` | 泛用向量資料庫操作（建立 collection、upsert、query） |
| `../shared/lib/openai.js` | 共用的 OpenAI client |
| `../shared/utils/spinner.js` | 共用的 ora spinner 包裝 |
| `lib/store.js` | 本題專屬封裝：collection 名稱 `taiwan_cities` 與 `searchTaiwanCities` |
| `data/taiwan-cites.js` | 知識庫資料：5 個台灣城市的簡介與標籤 |
| `data/queries.js` | 3 種測試問法與各自的預期城市 |
| `seed.js` | 知識庫初始化程式 |
| `search-test.js` | 搜尋測試程式（3 種問法） |
| `index.js` | 互動式搜尋主程式 |
| `demo-search-run.txt` | 實際執行 `npm run hw3:test` 的完整輸出紀錄 |

## 執行方式

1. 安裝依賴

```bash
npm install
```

2. 建立環境變數

```bash
cp .env.example .env
```

3. 在 `.env` 填入 `OPENAI_API_KEY`，並設定可連線的 Qdrant（`QDRANT_URL`，雲端服務另需 `QDRANT_API_KEY`）

4. 初始化知識庫（資料有變動時才需重跑）

```bash
npm run hw3:seed
```

5. 執行 3 種問法的搜尋測試

```bash
npm run hw3:test
```

6. 互動式搜尋（可自由輸入問題，輸入 `exit` 離開）

```bash
npm run hw3
```

若尚未執行 `npm run hw3:seed`，`npm run hw3` 與 `npm run hw3:test` 會偵測到 collection 不存在並提示先初始化。

## 知識庫內容

collection 名稱：`taiwan_cities`，距離度量 `Cosine`，向量維度 1536。

| id | 城市 | 標籤 |
| --- | --- | --- |
| 1 | 台北 | 首都、捷運、夜市、科技 |
| 2 | 台中 | 宜居、文創、美食、氣候溫和 |
| 3 | 高雄 | 港口、重工業、海洋、美食 |
| 4 | 台南 | 古都、小吃、歷史、廟宇 |
| 5 | 花蓮 | 自然景觀、太魯閣、觀光、原住民文化 |

每筆資料以「城市名稱 + 標籤 + 描述」組成一段文字送去做 embedding，完整描述保存在 payload 中供搜尋結果顯示。

## 設計重點

- **3 種問法都不直接出現城市名稱**：用「古蹟和廟宇」「海邊和港口」「氣候舒服」等描述性語句提問，才能證明是語意檢索而非關鍵字比對
- **測試資料附 `expectation` 欄位**：每個問法標註預期命中的城市，輸出時一併印出對照，結果可直接判讀
- **題目專屬邏輯不放進 `shared/`**：collection 名稱與 payload 欄位是本題的領域知識，封裝在 `lib/store.js`，`shared/lib/qdrant.js` 只保留泛用能力
- **搜尋取前 3 筆**：知識庫僅 5 筆，取 3 筆可觀察分數遞減趨勢，佐證排序確實反映相關性

## 測試結果

以下數值來自實際執行 `npm run hw3:test`，完整輸出見 [`demo-search-run.txt`](./demo-search-run.txt)。

模型：`text-embedding-3-small`，向量維度 1536，每題取前 3 筆。

### 查詢 1：「哪個城市有很多古蹟和廟宇？」（預期：台南）

| 排名 | 城市 | 相似度分數 |
| --- | --- | --- |
| 1 | **台南** | **0.497** |
| 2 | 台中 | 0.378 |
| 3 | 花蓮 | 0.355 |

### 查詢 2：「我想去看海邊和港口」（預期：高雄）

| 排名 | 城市 | 相似度分數 |
| --- | --- | --- |
| 1 | **高雄** | **0.482** |
| 2 | 花蓮 | 0.286 |
| 3 | 台北 | 0.234 |

### 查詢 3：「適合居住、氣候舒服的地方」（預期：台中）

| 排名 | 城市 | 相似度分數 |
| --- | --- | --- |
| 1 | **台中** | **0.435** |
| 2 | 花蓮 | 0.349 |
| 3 | 高雄 | 0.227 |

## 結果分析

**3 種問法全部命中預期城市，且第 1 名與第 2 名之間有明顯分數差距。** 查詢 2 的差距最大（0.482 對 0.286，相差 0.196），查詢 3 次之（0.435 對 0.349），查詢 1 為 0.497 對 0.378。三題的第一名都領先第二名約 0.09～0.20，代表排序並非勉強勝出，語意檢索確實抓到了正確的知識條目。

值得注意的是，三個問句都**沒有出現任何城市名稱**：「古蹟和廟宇」對應到台南（描述中有赤崁樓、安平古堡與廟宇）、「海邊和港口」對應到高雄（天然良港、西子灣）、「氣候舒服」對應到台中（氣候溫和宜人、最宜居城市）。若採用關鍵字比對，這三題都無法命中；能命中證明 Embeddings 捕捉的是語意層面的關聯。

另外可觀察到花蓮在三題中都排進前 3 名，這是因為知識庫僅 5 筆、且花蓮的描述涵蓋「自然、觀光、好山好水」等泛用性較高的詞彙，容易與各種旅遊類問句產生中等程度的相關性。其分數（0.286～0.355）明顯低於各題第一名，排序上並未造成干擾。

## 驗收對照

- **知識庫包含 5 筆以上資料**：有，5 筆台灣城市資料（`data/taiwan-cites.js`），`npm run hw3:seed` 輸出「Seed 完成（筆數：5）！」
- **執行搜尋測試程式能搜尋到相關結果**：有，`npm run hw3:test` 的 3 個查詢均命中預期城市
- **README 附 3 個查詢的實際搜尋結果（含相似度分數）**：有，見上方「測試結果」三張表格與「結果分析」

## 備註

`demo-search-run.txt` 由實際呼叫 OpenAI Embeddings API 與 Qdrant 產生，非手動編造。Embeddings 每次呼叫的數值可能有極小浮動，但排序與結論一致。
