# Copilot Instructions

## 建置、測試與執行指令

- 安裝依賴：`npm install`
- 執行作業 1：`npm run hw1`
- 其他作業的腳本已預建（尚未實作）：`npm run hw2`、`npm run hw3`、`npm run hw3:seed`、`npm run hw4`、`npm run hw5`
- 完整測試指令：`npm test`
  - 目前對應 `node --test test/`
  - 因為 `test/` 目錄尚未建立，目前會執行失敗
- 執行單一測試檔：`node --test path/to/file.test.js`
- 執行指定名稱的測試：`node --test --test-name-pattern "test name" path/to/file.test.js`
- 目前 `package.json` 沒有 `build` 或 `lint` 腳本

## 高層架構

本 repo 為單一 npm 套件，用來收納五道課程作業的實作。根目錄 `package.json` 統一管理所有作業的腳本與依賴，不使用 workspaces 或各題獨立套件。

`src/` 下分為兩個主要層級：

- `src/homework-0X-*` 目錄為各題的進入點與資源
- `src/shared/` 為跨作業共用模組

目前只有 `src/homework-01-role-chatbot/` 有真正的實作。其他作業目錄僅包含 `.gitkeep` 佔位檔與預建的子目錄（hw02、hw04 有 `tools/`；hw03、hw05 有 `data/`）。不要因為 package scripts 存在就假設其 `index.js` 或工具實作已完成。

作業 1 展示互動式作業的主要架構模式：

- `src/shared/config.js`：集中載入環境變數（透過 `dotenv/config`）
- `src/shared/lib/openai.js`：匯出共用 OpenAI client (`client`) 與 `DEFAULT_MODEL`
- `src/shared/db/message.js`：使用 `lowdb` 將對話紀錄存為 `.history/` 下帶時間戳的 JSON 檔
- `src/homework-01-role-chatbot/index.js`：初始化角色 prompt，跑 `@inquirer/prompts` CLI 迴圈，每輪將訊息存入本地 history 後送出完整訊息列表給 OpenAI Responses API

文件遵循兩層模式：

- 根目錄 `README.md` 為總覽與入口
- 各作業資料夾內應有自己的 `README.md`，記錄實作細節、對話紀錄與測試證據

`docs/plan.md` 描述 repo 的長期規劃，有助於了解未來作業應放在哪裡，但它是規劃文件而非實際狀態的保證。

## 關鍵慣例

- 本 repo 使用 ESM（`"type": "module"`）。使用 `import`/`export` 語法，相對路徑引入需加上 `.js` 副檔名。
- 共用工具放 `src/shared/`；各題專屬的程式碼、資料與文件放在該題自己的資料夾內。
- 使用共用的 OpenAI client/config 模組（`src/shared/lib/openai.js`、`src/shared/config.js`），不要在每題各自建立新的 client。
- OpenAI SDK 使用 **Responses API**（`client.responses.create`），不是 Chat Completions API。角色/指令 prompt 使用 `developer` role（不是 `system`）。
- 以根目錄 `.env.example` 作為所有作業環境變數名稱的唯一來源。真正的金鑰放在 `.env`（已 gitignore）。主要環境變數：
  - `OPENAI_API_KEY` — 所有作業皆需要
  - `OPENWEATHER_API_KEY` — 作業 4
  - `VECTOR_STORE` — 作業 3；設為 `local`（預設，存成本機 JSON）或 `qdrant`
  - `QDRANT_URL` / `QDRANT_API_KEY` — 僅在 `VECTOR_STORE=qdrant` 時需要
- 對話紀錄與其他本地執行產物存於磁碟並被 git 忽略：
  - `.history/` 存放對話 JSON 檔
  - `src/homework-03-mini-knowledge-base/data/vectors.json` 為本地向量資料庫
- 作業 1 的記憶流程依靠每輪將完整訊息歷史傳回模型。若修改對話行為，需同時檢查 `src/homework-01-role-chatbot/index.js` 和 `src/shared/db/message.js`。
- 根目錄文件保持高層概述。詳細的作業對話紀錄與驗收證據放在各題自己的 `README.md`。
- `package.json` 中已有的依賴：`openai`、`@inquirer/prompts`、`lowdb`、`ora`、`zod`、`dotenv`、`@qdrant/js-client-rest`。除非現有依賴無法滿足需求，否則不要新增。
