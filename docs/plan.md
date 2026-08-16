# 課後作業繳交 Repo 結構規劃（v1）

> 目的：規劃一個**新的 GitHub Repository**，一次收納 5 道作業題目的實作，並符合課程「繳交規範」。
> 參考課程 repo：<https://github.com/kaochenlong/ai-agent-js-v2>（以 Git 分支保存教學進度，目前共 22 個分支）
> 本文為 v1，題目名稱先用佔位符，待《課後作業 (A).pdf》內容確認後再做精準對應。

---

## 1. 繳交規範對照

課程 PDF 要求的最小結構：

```
homework/
├── README.md          # 說明選擇的作業方向、實作內容、測試結果
├── .env.example       # 環境變數範例（不含真實 API Key）
├── package.json       # 專案設定
└── src/
    └── [作業相關檔案]
```

本規劃在**完全保留上述四項**的前提下，往下擴充成可容納 5 題的結構。

| 規範項目 | 本規劃對應 | 狀態 |
| --- | --- | --- |
| `README.md` | 根目錄總覽 + 每題子 README | 符合 |
| `.env.example` | 根目錄單一份，涵蓋 5 題所有金鑰 | 符合 |
| `package.json` | 根目錄單一份，含 `hw1`~`hw5` scripts | 符合 |
| `src/` | `src/homework-01` ~ `src/homework-05` + `src/shared` | 符合 |

---

## 2. Repo 基本資訊

| 項目 | 建議值 |
| --- | --- |
| Repo 名稱 | `ai-agent-js-v2-homework` |
| 可見性 | Public（方便助教直接開啟；若含公司資料改 Private + 加助教協作者） |
| 預設分支 | `main` |
| Node 版本 | 22 以上（純 ESM，`"type": "module"`） |
| 套件管理 | npm |
| License | 不強制，可留白或 MIT |

---

## 3. 目錄結構（完整版）

```
ai-agent-js-v2-homework/
├── README.md                     # 【必要】總覽：5 題方向、實作內容、測試結果彙整
├── .env.example                  # 【必要】環境變數範例，不含任何真實金鑰
├── .gitignore                    # 必含 .env、node_modules、db/*.json
├── package.json                  # 【必要】相依套件 + hw1~hw5 執行腳本
├── package-lock.json
│
├── docs/                         # 作業說明與佐證
│   ├── homework-01.md            # 題目原文、需求拆解、設計決策、測試結果
│   ├── homework-02.md
│   ├── homework-03.md
│   ├── homework-04.md
│   ├── homework-05.md
│   └── screenshots/              # 執行畫面截圖（README 引用）
│       └── hw01-run.png
│
├── scripts/
│   └── get-branch.ps1            # 從課程 repo 取分支檔案（繞過 proxy 擋 clone）
│
├── src/                          # 【必要】所有作業程式碼
│   ├── shared/                   # 5 題共用模組，避免重複貼程式碼
│   │   ├── config.js             # dotenv 載入 + 金鑰存在性檢查（不印出金鑰內容）
│   │   ├── openai.js             # OpenAI client（Responses API）單例
│   │   ├── logger.js             # 統一輸出格式、ora spinner 包裝
│   │   └── prompt.js             # @inquirer/prompts 互動輸入共用封裝
│   │
│   ├── homework-01-<主題>/
│   │   ├── index.js              # 進入點：npm run hw1
│   │   ├── README.md             # 本題說明（題目、做法、如何執行、測試結果）
│   │   ├── tools/                # 本題自訂 tool（如有）
│   │   ├── data/                 # 本題資料檔（如有）
│   │   └── evals/                # 本題評估測資（如有）
│   ├── homework-02-<主題>/
│   ├── homework-03-<主題>/
│   ├── homework-04-<主題>/
│   └── homework-05-<主題>/
│
└── test/                         # 不需金鑰即可跑的測試（node --test）
    ├── homework-01.test.js
    └── ...
```

### 設計原則

1. **單一 package.json（非 workspaces）**：作業規模小，單一相依樹最貼近繳交規範，助教 `npm install` 一次即可跑全部 5 題。
2. **每題資料夾自足**：題目專屬的 tools / data / evals 放在該題目錄下，避免 5 題互相汙染。
3. **共用碼收在 `src/shared`**：`config.js`、OpenAI client 這種 5 題都會用到的東西只寫一次。
4. **每題各有一份 README**：根 README 是總覽與索引，細節寫在子 README 或 `docs/homework-0X.md`，避免根 README 過長。
5. **金鑰零外洩**：`.env` 進 `.gitignore`，只提交 `.env.example`；程式只檢查金鑰「在不在」，不印內容。

---

## 4. 題目與課程分支對應表（v1，待確認）

課程 repo 22 個分支：

| 階段 | 分支 |
| --- | --- |
| 0 起步 | `0.1-hello-world` |
| 1 API 基礎 | `1.1-setup-env`、`1.2-openai-api`、`1.3-openai-api-loop`、`1.4-openai-api-with-memory` |
| 2 Tool Calling | `2.1-tool-calling-1`、`2.2-tool-calling-2`、`2.3-tool-calling-3`、`2.4-tool-calling-youbike`、`2.5-tool-calling-current-time` |
| 3 RAG | `3.1-rag-text-to-vector`、`3.2-rag-search-text`、`3.3-rag-tool`、`3.4-rag-for-pdf` |
| 4 SDK / MCP | `4.1-agents-sdk`、`4.2-mcp-server` |
| 5 Profile / Eval / Memory | `5.1-agent-profile`、`5.2-agent-evaluation`、`5.3-memory-compression` |
| 6 Planning / Capstone | `6.1-planner-loop`、`6.2-feedback-guardrails`、`6.3-capstone-course-advisor` |

**預估對應（依課程主軸推測，待對照作業 PDF 修正）：**

| 題號 | 推測主題 | 主要參考分支 | 輔助分支 |
| --- | --- | --- | --- |
| Homework 1 | 對話迴圈 + 記憶 | `1.3-openai-api-loop` | `1.4-openai-api-with-memory` |
| Homework 2 | 自訂 Tool Calling | `2.3-tool-calling-3` | `2.4`、`2.5` |
| Homework 3 | RAG 知識庫問答 | `3.3-rag-tool` | `3.4-rag-for-pdf` |
| Homework 4 | Agents SDK / MCP Server | `4.1-agents-sdk` | `4.2-mcp-server` |
| Homework 5 | Profile + Eval + Planner | `6.3-capstone-course-advisor` | `5.1`、`5.2`、`6.1`、`6.2` |

> ⚠️ 此表為 v1 推測。取得作業 PDF 的 5 道題目後，須逐題改寫「主題／主要參考分支／驗收條件」三欄。

### 參考分支的正確做法

作業 repo 內只放**自己重寫／改寫過的程式碼**，並在該題 README 註明「參考分支：`3.3-rag-tool`」。
下載參考分支的方式見第 4.1 節。

---

## 4.1 如何快速取得分支檔案（已在本機實測）

> ⚠️ 重要前提：公司 proxy（`auohqwsg.corpnet.auo.com:8080`）**會擋 `git clone`**。
> `git clone` 會在 `git-upload-pack` 階段回 `RPC failed; HTTP 403`（強制 HTTP/1.1 也一樣）。
> 但 `git ls-remote` 與 codeload 的 zip 下載都可以正常通過，因此改用 **zip 直取**。

### 方法 A：用腳本一鍵取檔（推薦）

已備好 `scripts/get-branch.ps1`，內部走 `curl.exe --ssl-no-revoke` + codeload zip，
下載後自動解壓、去掉多包的一層資料夾，且**不會帶 `.git` 進來**（不會汙染作業 repo 的版控）。

```powershell
# 1) 抓單一分支到 ref\ 底下，純參考用
.\scripts\get-branch.ps1 -Branch 3.3-rag-tool
#    -> .\ref\3.3-rag-tool\

# 2) 直接落地到作業資料夾，抓完就能開始改
.\scripts\get-branch.ps1 -Branch 2.3-tool-calling-3 -Dest src\homework-02-weather-tool

# 3) 一次抓完全部 22 個分支（實測約 2-3 分鐘）
.\scripts\get-branch.ps1 -All
#    -> .\ref\0.1-hello-world\ ... .\ref\6.3-capstone-course-advisor\

# 覆寫已存在的資料夾
.\scripts\get-branch.ps1 -Branch 3.4-rag-for-pdf -Dest src\homework-03-rag -Force
```

**建議做法**：先跑一次 `-All` 把 22 個分支放到 repo 外的 `D:\Projects\ai-agent-ref\`，
當成離線參考書；要動手時再用 `-Dest` 把該題的基底複製進 `src/homework-0X/`。
`ref/` 若放在作業 repo 內，記得加進 `.gitignore`。

### 方法 B：手動 curl（不想用腳本時）

```powershell
$b = "3.3-rag-tool"
curl.exe -sS --ssl-no-revoke -L -o "$b.zip" "https://codeload.github.com/kaochenlong/ai-agent-js-v2/zip/refs/heads/$b"
Expand-Archive "$b.zip" -DestinationPath .\ref -Force
# 解出來會是 ref\ai-agent-js-v2-3.3-rag-tool\
```

### 方法 C：只看「這一課多做了什麼」——抓 diff（最省時）

課程每個分支只多做一小步。與其整包比對，不如直接抓兩個分支的 diff，
就能精準看到該課新增／修改了哪些檔案的哪幾行：

```powershell
# 3.2 -> 3.3 這一課到底改了什麼
curl.exe -sS --ssl-no-revoke -L -o diff.txt `
  "https://github.com/kaochenlong/ai-agent-js-v2/compare/3.2-rag-search-text...3.3-rag-tool.diff"
```

也可以直接在瀏覽器開（有語法高亮、可折疊）：

```
https://github.com/kaochenlong/ai-agent-js-v2/compare/3.2-rag-search-text...3.3-rag-tool
```

把 `.diff` 換成 `.patch` 則會帶上 commit message 與作者資訊。

### 方法 D：Codespaces（完全繞開公司網路）

課程本來就設計成在 GitHub Codespaces 上跑。在 Codespaces 裡沒有 proxy 限制，
`git clone` / `git checkout` / `git worktree` 全部可用：

```bash
# 在 Codespace 終端機
git clone https://github.com/kaochenlong/ai-agent-js-v2.git ref
cd ref
git worktree add ../wt-2.3 2.3-tool-calling-3    # 多個分支同時攤開，不用來回 checkout
git worktree add ../wt-3.3 3.3-rag-tool
git worktree list
```

若最後決定在 Codespaces 寫作業，這是最順的路徑（也省下本機裝 Qdrant／金鑰設定的麻煩）。

### 方法比較

| 方法 | 公司網路可用 | 速度 | 帶 .git | 適用情境 |
| --- | --- | --- | --- | --- |
| A 腳本 zip | ✅ 已實測 | 快 | 否 | 主力做法，取基底來改 |
| B 手動 curl | ✅ 已實測 | 快 | 否 | 臨時抓一包 |
| C compare diff | ✅ 已實測 | 最快 | — | 只想知道某課改了什麼 |
| D Codespaces | ✅ | 中 | 是 | 想用完整 git 工作流 |
| `git clone` | ❌ 403 | — | 是 | 本機不可用 |

### 落地後的第一件事

從分支複製過來的檔案帶有課程原本的 `package.json`、`.env.example`、`hello.js` 等，
放進 `src/homework-0X/` 後要做的清理：

1. 刪掉 `package.json`、`package-lock.json`、`.gitignore`、`.devcontainer/`、`hello.js`
   （這些由作業 repo 根目錄統一管理）
2. 把 `.env.example` 的內容**合併**進根目錄那一份，然後刪掉子資料夾的
3. 保留並改寫 `main.js` → 更名為 `index.js`，作為該題進入點
4. 相依套件改成從根目錄 `npm install`，不要每題各自 `npm install`
5. 在該題 README 標註「參考分支：`x.y-branch-name`」與「我改了什麼」

---

## 5. 根目錄檔案內容規劃

### 5.1 `package.json`

```json
{
  "name": "ai-agent-js-v2-homework",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "hw1": "node src/homework-01-<主題>/index.js",
    "hw2": "node src/homework-02-<主題>/index.js",
    "hw3": "node src/homework-03-<主題>/index.js",
    "hw4": "node src/homework-04-<主題>/index.js",
    "hw5": "node src/homework-05-<主題>/index.js",
    "test": "node --test test/"
  }
}
```

相依套件依實際用到的題目安裝（課程技術堆疊）：
`openai`、`@openai/agents`、`@modelcontextprotocol/sdk`、`@inquirer/prompts`、`lowdb`、`ora`、`zod`、`@qdrant/js-client-rest`、`unpdf`、`csv-parse`、`dotenv`。

### 5.2 `.env.example`

```dotenv
# OpenAI（Homework 1 之後皆需要）
OPENAI_API_KEY=your_openai_api_key_here

# OpenWeather（Tool Calling 題目需要）
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Qdrant 向量資料庫（RAG 題目需要）
QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
```

> 只放佔位字串，**絕對不能**提交真實金鑰。

### 5.3 `.gitignore`

```gitignore
node_modules/
.env
.env.local
db/*.json
memory/*.json
ref/
*.log
.DS_Store
```

---

## 6. 根 `README.md` 大綱

繳交規範明確要求 README 說明「選擇的作業方向、實作內容、測試結果」，建議章節：

1. **專案簡介** — 課程名稱、作者、對應課程 repo 連結
2. **環境需求與安裝** — Node 22+、`npm install`、`cp .env.example .env`、需要哪些金鑰
3. **作業總覽表** — 題號 / 主題 / 執行指令 / 參考分支 / 完成狀態
4. **各題說明**（每題 3 小段）
   - 作業方向：選了哪一題、題目要求是什麼
   - 實作內容：檔案結構、核心設計、與課程分支的差異或延伸
   - 測試結果：執行指令、實際輸入輸出、截圖、eval 通過情況
5. **已知限制** — 未完成項目、需要金鑰才能跑的部分
6. **參考資料** — 課程 repo 分支、官方文件

### 作業總覽表範例

| 題號 | 主題 | 執行指令 | 參考分支 | 狀態 |
| --- | --- | --- | --- | --- |
| 1 | （待填） | `npm run hw1` | `1.3-openai-api-loop` | ✅ |
| 2 | （待填） | `npm run hw2` | `2.3-tool-calling-3` | ✅ |
| 3 | （待填） | `npm run hw3` | `3.3-rag-tool` | ✅ |
| 4 | （待填） | `npm run hw4` | `4.1-agents-sdk` | ✅ |
| 5 | （待填） | `npm run hw5` | `6.3-capstone-course-advisor` | ✅ |

---

## 7. 建置步驟

```powershell
# 1. 建資料夾與 git
mkdir D:\Projects\ai-agent-js-v2-homework
cd D:\Projects\ai-agent-js-v2-homework
git init -b main

# 2. 初始化 npm 專案
npm init -y
# 手動把 package.json 改成 "type": "module" 並補上 scripts

# 3. 建目錄骨架
mkdir src, src\shared, docs, docs\screenshots, test
mkdir src\homework-01, src\homework-02, src\homework-03, src\homework-04, src\homework-05

# 4. 建必要檔案（README.md / .env.example / .gitignore）後
git add .
git commit -m "chore: init homework repo structure"

# 5. 建遠端 repo 並推送
git remote add origin https://github.com/<your-account>/ai-agent-js-v2-homework.git
git push -u origin main
```

### Commit 建議

每題獨立 commit，讓助教看得出開發過程：

```
chore: init homework repo structure
feat(hw1): implement <主題>
docs(hw1): add README and test results
feat(hw2): implement <主題>
...
```

---

## 8. 繳交前檢查清單

- [ ] `git grep -i "sk-"` 沒有任何真實金鑰洩漏
- [ ] `.env` 確實在 `.gitignore` 內，且未被 commit（`git log --all -- .env` 為空）
- [ ] `.env.example` 只有佔位字串
- [ ] 全新 clone 後 `npm install` 可成功
- [ ] `npm run hw1` ~ `npm run hw5` 都能執行（或 README 已註明所需金鑰）
- [ ] 根 README 三大項齊全：作業方向、實作內容、測試結果
- [ ] 每題都有標註參考的課程分支
- [ ] `node_modules/` 未進版控
- [ ] Repo 可見性正確（Public 或已加助教為協作者）

---

## 9. 待確認事項

1. **5 道題目的實際題目文字** — 需要《課後作業 (A).pdf》第 1~5 頁的「作業（五選一）」內容，用來修正第 4 節對應表與各題驗收條件。
2. **每題主題命名** — 確認題目後把 `homework-0X-<主題>` 的 `<主題>` 定名（建議英文 kebab-case，例如 `homework-02-weather-tool`）。
3. **是否需要 Qdrant** — RAG 題若要跑，須先申請 Qdrant Cloud 免費叢集。
4. **繳交形式** — GitHub Repository（建議）或壓縮檔；若用壓縮檔，打包前務必排除 `node_modules/` 與 `.env`。
