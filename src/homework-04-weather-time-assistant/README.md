# 作業 4：整合天氣與時間工具

本題把 **時間工具（`get_current_time`）** 與 **天氣工具（`get_weather`）** 同時註冊給同一個助手，讓 AI 依照使用者的問題自行決定要呼叫哪一個工具，或是一次呼叫兩個並整合成一段回覆。

## 實作內容

- **時間工具**：`src/shared/tools/current_time.js`，無參數，回傳 `Asia/Taipei` 時區的當下時間字串
- **天氣工具**：`src/shared/tools/weather.js`，以 `city` 參數查 OpenWeather Current Weather API，回傳城市、溫度、濕度與天氣描述
- **工具註冊中心**：`tools/index.js` 統一匯出兩個工具，聊天管理程式以 `Object.values` 自動建立註冊表
- **聊天管理程式**：`lib/chat-manager.js` 維護對話歷史、送出 Responses API 請求，並執行模型要求的工具。同一輪會 filter 出**所有** `function_call` 逐一執行，因此「一次問兩件事」可在同一輪呼叫兩個工具
- **主程式**：`index.js` 只負責 `@inquirer/prompts` 的 CLI 互動與訊息輸出

相關檔案：

| 檔案 | 說明 |
| --- | --- |
| `tools/index.js` | 工具註冊中心（匯出天氣與時間工具） |
| `lib/chat-manager.js` | 聊天管理程式（developer prompt + 對話歷史 + tool calling 迴圈） |
| `index.js` | 主程式（CLI） |
| `demo-tool-calling.json` | 實際執行的對話與工具呼叫紀錄 |
| `../shared/tools/current_time.js` | 時間工具定義與實作 |
| `../shared/tools/weather.js` | 天氣工具定義與實作 |
| `../shared/utils/func-tool.js` | 共用的 `defineTool` / `toOpenAITool` |
| `../shared/lib/openai.js` | 共用的 OpenAI client |

## 執行方式

1. 安裝依賴

```bash
npm install
```

2. 建立環境變數

```bash
cp .env.example .env
```

3. 在 `.env` 填入 `OPENAI_API_KEY` 與 `OPENWEATHER_API_KEY`（本題兩個都需要）

4. 執行作業 4

```bash
npm run hw4
```

5. 在互動介面中輸入問題，輸入 `exit` 可結束程式

## 工具定義（JSON Schema）

`toOpenAITool()` 實際產生的定義（Responses API 的 function tool 為扁平格式，`type` 與 `name` 同層）：

```json
{
  "type": "function",
  "name": "get_current_time",
  "parameters": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {},
    "additionalProperties": false,
    "required": []
  },
  "strict": true,
  "description": "取得現在的台灣時間"
}
```

```json
{
  "type": "function",
  "name": "get_weather",
  "parameters": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "城市名稱（英文），如 Taipei 或 Tokyo"
      }
    },
    "required": ["city"],
    "additionalProperties": false
  },
  "strict": true,
  "description": "取得指定城市的即時天氣資訊，包括溫度、濕度、天氣狀況等。"
}
```

## Developer prompt

角色/指令使用 `developer` role（見 `lib/chat-manager.js` 的 `DEVELOPER_PROMPT`），重點如下：

- 定位為「生活小幫手」，專門查詢現在時間與即時天氣
- 涉及時間或天氣的問題**一律呼叫工具取得最新資料**，不可用模型自身知識回答
- 使用者一次問「現在幾點」又問「天氣如何」時，必須**同時呼叫 `get_current_time` 與 `get_weather`**，不可分開問或漏掉
- 呼叫 `get_weather` 時，`city` 一律使用**英文城市名**（「台北」送 `Taipei`、「東京」送 `Tokyo`），不可直接送中文
- 工具回傳結果含 `error` 時，依錯誤訊息修正參數後重試，最多再嘗試兩次
- 取得工具結果後，用口語化的繁體中文整理成完整回覆，不要直接丟原始 JSON
- 使用者沒有提供地點時，先禮貌詢問城市名稱再呼叫天氣工具

## 設計重點

- **工具實作放在 `src/shared/tools/`**：天氣與時間工具屬於課程共用工具，本題資料夾只做註冊（re-export），維持 repo 「共用模組放 `src/shared/`」的慣例
- **同輪多工具**：`chat-manager.js` 不是只取第一個 `function_call`，而是把該輪所有 `function_call` 都執行並各自 push `function_call_output`，這是驗收標準第 3 項能過的關鍵
- **工具失敗不 throw**：參數驗證或執行失敗時回傳 `{ ok: false, error }`，模型看得到錯誤訊息就有機會修正後重試
- **失敗時回捲歷史**：單輪出錯會把該輪訊息移除，避免 history 留下「有 `function_call` 卻沒有 `function_call_output`」的殘缺配對而讓下一輪被 API 拒絕
- **多輪上限**：`MAX_TOOL_ROUNDS = 8`，避免模型陷入無限的工具呼叫迴圈

## 測試結果

以下為實際執行紀錄，來源：[`demo-tool-calling.json`](./demo-tool-calling.json)（由實際呼叫 OpenAI 與 OpenWeather API 產生，非手動編造）。

### 測試 1：「現在幾點？」→ 只呼叫時間工具

```text
你：現在幾點？
[呼叫 tool] get_current_time({}) -> "2026/8/18 下午4:00:42"

助手：現在是台灣時間 2026 年 8 月 18 日下午 4:00。
```

### 測試 2：「台北天氣如何？」→ 只呼叫天氣工具

```text
你：台北天氣如何？
[呼叫 tool] get_weather({"city":"Taipei"}) -> {"city":"Taipei","temperature":33.76,"humidity":67,"description":"陰，多雲"}

助手：台北目前約 33.8°C，陰天、多雲，濕度約 67%。外出請注意高溫與悶熱。
```

模型有把「台北」自行轉成 API 需要的英文城市名 `Taipei`（developer prompt 有明確要求 `city` 使用英文）。

### 測試 3：「現在幾點？台北天氣好嗎？」→ 同一輪呼叫兩個工具並整合

```text
你：現在幾點？台北天氣好嗎？
[呼叫 tool] get_current_time({}) -> "2026/8/18 下午4:00:49"
[呼叫 tool] get_weather({"city":"Taipei"}) -> {"city":"Taipei","temperature":33.76,"humidity":67,"description":"陰，多雲"}

助手：現在是台灣時間 2026 年 8 月 18 日下午 4:00。台北目前約 33.8°C、濕度 67%，
      天氣陰、多雲；體感較悶熱，外出請注意防曬與補充水分。
```

## 驗收對照

- **兩個工具都能正確呼叫**：有，測試 1 呼叫 `get_current_time`、測試 2 呼叫 `get_weather`，皆回傳正常結果
- **AI 能根據問題選擇正確的工具**：有，只問時間時不會多呼叫天氣工具，只問天氣時也不會多呼叫時間工具
- **一次問兩個問題時，AI 能呼叫兩個工具並整合回答**：有，測試 3 在同一輪呼叫兩個工具，最後合併成一段自然語言回覆
- **README 記錄 3 個測試問題的執行結果**：有，見上方「測試結果」與 `demo-tool-calling.json`

## 已知限制

- 天氣工具直接把 `city` 帶入 OpenWeather 的 `q` 參數，該 API 只接受英文城市名。目前靠參數 description 與 developer prompt 雙重要求模型轉成英文，並在工具回傳 `error` 時引導模型重試；但這仍屬提示層的約束，並未在工具內做中文城市名對照
- `OPENWEATHER_API_KEY` 未設定時不會有專屬提示，只會收到 `OpenWeather API error: 401`
- 時間工具固定回傳 `Asia/Taipei` 時區，不支援查詢其他時區
