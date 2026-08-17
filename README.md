# AI Agent 開發實戰課程 - 課後作業（A）

這個 repository 用來整理課程的課後作業實作，採用「**根目錄總覽 + 各題子 README**」的方式編排。

目前已整理完成的內容：

- `src/homework-01-role-chatbot/README.md`：作業 1「打造專屬角色聊天機器人」完整說明

## 專案結構

```text
.
├── README.md
├── .env.example
├── package.json
└── src/
    ├── homework-01-role-chatbot/
    │   ├── index.js
    │   ├── README.md
    │   └── demo-conversation-memory.json
    └── shared/
        ├── config.js
        ├── db/message.js
        └── lib/openai.js
```

## 已完成作業

### 作業 1：打造專屬角色聊天機器人

- 主題：冷笑話機器人
- 特色：繁體中文、資深前輩口吻、帶吐槽感的冷笑話風格
- 詳細說明：[`src/homework-01-role-chatbot/README.md`](src/homework-01-role-chatbot/README.md)

## 執行方式

1. 安裝依賴

```bash
npm install
```

2. 建立環境變數

```bash
cp .env.example .env
```

3. 在 `.env` 中填入 `OPENAI_API_KEY`

4. 執行第一題

```bash
npm run hw1
```

## 環境變數

請參考 `.env.example`，不要提交真實金鑰。
