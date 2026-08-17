# 作業 2：新增一個 Function Calling 工具

本題實作一個 **計算機工具（`calculate`）**，讓 AI 在對話中遇到需要運算的問題時，改為呼叫工具求值，而不是自行心算。

為了避免 `eval()` 的安全風險，計算功能改以**自行實作的詞法分析 + 遞迴下降語法分析器**完成，只接受數字、`+ - * / % ^` 與括號。

## 實作內容

- **計算機工具**：以 `zod` 定義參數 schema，`defineTool` 包裝成工具物件，再由 `toOpenAITool` 轉成 Responses API 的 function tool 格式
- **求值器**：`lib/tokenizer.js` 負責切 token 與字元白名單，`lib/parser.js` 以遞迴下降處理運算子優先順序、括號與右結合的次方
- **工具註冊中心**：`tools/index.js` 統一匯出所有工具，聊天管理程式以 `Object.values` 自動建立註冊表
- **聊天管理程式**：`lib/chat-manager.js` 維護對話歷史、送出 Responses API 請求，並執行模型要求的工具（含多輪 tool calling 迴圈）
- **主程式**：`index.js` 只負責 `@inquirer/prompts` 的 CLI 互動與訊息輸出

相關檔案：

| 檔案 | 說明 |
| --- | --- |
| `tools/calculate.js` | 計算機工具定義（JSON Schema）與實作 |
| `tools/index.js` | 工具註冊中心 |
| `lib/tokenizer.js` | 詞法分析，含全形符號正規化與字元白名單 |
| `lib/parser.js` | 語法分析與求值 |
| `lib/chat-manager.js` | 聊天管理程式（對話歷史 + tool calling 迴圈） |
| `index.js` | 主程式（CLI） |
| `demo-tool-calling.json` | 實際執行的對話與工具呼叫紀錄 |
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

3. 在 `.env` 填入 `OPENAI_API_KEY`（本題只需要這一個變數）

4. 執行作業 2

```bash
npm run hw2
```

5. 在互動介面中輸入問題，輸入 `exit` 可結束程式

## 工具定義（JSON Schema）

`toOpenAITool(calculateTool)` 實際產生的定義如下（Responses API 的 function tool 為扁平格式，`type` 與 `name` 同層）：

```json
{
  "type": "function",
  "name": "calculate",
  "description": "進行數學計算",
  "parameters": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "要計算的數學運算式，例如 (1+2)*3 或 2^10。只能包含數字、+ - * / % ^ 與括號"
      }
    },
    "required": ["expression"],
    "additionalProperties": false
  },
  "strict": true
}
```

## 設計重點

- **不使用 `eval()`**：自行解析可完全控制可接受的語法，模型送來的字串不會有機會執行成程式碼
- **工具失敗不 throw**：`calculate` 失敗時回傳 `{ ok: false, error }`，模型看得到錯誤訊息就能修正運算式重試；聊天管理程式的參數驗證失敗也採用同樣做法
- **容錯正規化**：模型常送出 `**`、全形 `（）＋×÷` 或千分位逗號，`tokenizer.js` 會先正規化，減少無謂的重試
- **整數不做精度修正**：浮點雜訊（`0.1 + 0.2`）以 `toPrecision(15)` 修掉，但整數結果原樣回傳，否則 `12345678 * 87654321` 會被截成錯誤答案。取 15 位是因為 double 的可靠有效位數約 15.95 位，取太少（例如 12 位）會把 `123456789012.5` 這類數值的真實有效數字截掉
- **已知限制**：有效數字超過 15 位的結果（例如 `1234567.891234567`）會被截為 15 位，這是 IEEE 754 double 本身的精度上限，非解析器的問題
- **失敗時回捲歷史**：單輪出錯會把該輪訊息移除，避免 history 留下「有 `function_call` 卻沒有 `function_call_output`」的殘缺配對而讓下一輪被 API 拒絕

## 測試結果

以下為實際執行紀錄，來源：[`demo-tool-calling.json`](./demo-tool-calling.json)

### CLI 實際執行畫面

以 `npm run hw2` 實際互動的輸出（已移除 ANSI 控制碼）：

```text
計算機助理（輸入 exit 離開）

✔ 你： 3 的 4 次方加 10 是多少？
思考中...
[呼叫 tool] calculate({"expression":"3^4+10"}) -> {"ok":true,"expression":"3^4+10","result":91}

助理：3⁴ + 10 = 91。

✔ 你： 剛剛的結果再乘以 2
思考中...
[呼叫 tool] calculate({"expression":"91*2"}) -> {"ok":true,"expression":"91*2","result":182}

助理：91 × 2 = 182。

✔ 你： 把 5 除以 0
思考中...
[呼叫 tool] calculate({"expression":"5/0"}) -> {"ok":false,"expression":"5/0","error":"除數不可為 0"}

助理：5 ÷ 0 無定義，因為除數不可為 0。

✔ 你： exit
再會~
```

> 截圖佔位：`docs/images/hw2-tool-calling.png`（待補上實際 CLI 執行截圖）

### 詳細對話紀錄

### 第 1 輪：基本運算優先順序

**User：** 10 + 5 * 2 等於多少？

**工具呼叫：** `calculate({"expression":"10+5*2"})` → `{"ok":true,"result":20}`

**Assistant：** 10 + 5 × 2 = 20。

### 第 2 輪：自然語言轉運算式

**User：** 一件外套原價 2580 元，打八折後再折 200，最後多少錢？

**工具呼叫：** `calculate({"expression":"2580*0.8-200"})` → `{"ok":true,"result":1864}`

**Assistant：** 2580 × 0.8 − 200 = 1864 元。

### 第 3 輪：一次呼叫兩次工具

**User：** (1+2)*3 和 2^10 分別是多少？

**工具呼叫：**

- `calculate({"expression":"(1+2)*3"})` → `{"ok":true,"result":9}`
- `calculate({"expression":"2^10"})` → `{"ok":true,"result":1024}`

**Assistant：** (1 + 2) × 3 = 9；2^10 = 1024。

### 第 4 輪：大數精確度

**User：** 幫我算 12345678 * 87654321

**工具呼叫：** `calculate({"expression":"12345678*87654321"})` → `{"ok":true,"result":1082152022374638}`

**Assistant：** 12,345,678 × 87,654,321 = 1,082,152,022,374,638。

### 第 5 輪：錯誤處理

**User：** 把 1 除以 0 算給我看

**工具呼叫：** `calculate({"expression":"1/0"})` → `{"ok":false,"error":"除數不可為 0"}`

**Assistant：** 1 ÷ 0 沒有定義，因為除數不可為 0。

### 第 6 輪：沿用前文結果

**User：** 剛剛那件外套的價格，再加 5% 運費是多少？

**工具呼叫：** `calculate({"expression":"1864*1.05"})` → `{"ok":true,"result":1957.2}`

**Assistant：** 外套折後價格加 5% 運費：1864 × 1.05 = 1957.2 元。

### 求值器單元驗證

直接呼叫 `calculateTool.fn()` 的結果：

| 運算式 | 回傳 |
| --- | --- |
| `10 + 5 * 2` | `{"ok":true,"result":20}` |
| `(1+2)*3` | `{"ok":true,"result":9}` |
| `0.1+0.2` | `{"ok":true,"result":0.3}` |
| `2**60` | `{"ok":true,"result":1152921504606847000}` |
| `2^-1` | `{"ok":true,"result":0.5}` |
| `1,000 + 500` | `{"ok":true,"result":1500}` |
| `9007199254740991+0` | `{"ok":true,"result":9007199254740991}` |
| `1/0` | `{"ok":false,"error":"除數不可為 0"}` |
| `abc` | `{"ok":false,"error":"不支援的字元「a」（位置 0）"}` |

## 驗收對照

- **計算機工具包含完整的工具定義和實作**：有，定義在 `tools/calculate.js`，實作在 `lib/parser.js` 與 `lib/tokenizer.js`
- **JSON Schema 定義正確（type、function、parameters）**：有，見上方實際產生的定義
- **AI 能在對話中正確呼叫計算機**：有，`demo-tool-calling.json` 記錄 6 輪對話共 7 次工具呼叫，另附 CLI 實際執行輸出（截圖待補）
- **計算結果正確**：有，含大數與浮點案例皆驗證正確

## 備註

`demo-tool-calling.json` 由實際呼叫 OpenAI API 產生，非手動編造。README 中的截圖連結目前為佔位，實際 CLI 截圖補上後即可替換。
