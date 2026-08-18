// 聊天管理程式：負責維護對話歷史、送出 Responses API 請求、以及執行模型要求的工具。
// 主程式（index.js）只負責 CLI 互動，兩者分離才能讓對話流程被腳本重複驅動。

import * as allTools from "../tools/index.js";
import { toOpenAITool } from "../../shared/utils/func-tool.js";
import { client, DEFAULT_MODEL } from "../../shared/lib/openai.js";

const MAX_TOOL_ROUNDS = 8;

export const DEVELOPER_PROMPT = [
  "你是一個生活小幫手，專門協助使用者查詢「現在時間」與「即時天氣」。" +
  "當使用者的問題涉及時間或天氣（包含地點、日期、天氣狀況、氣溫、是否要帶傘等），" +
  "務必主動呼叫對應的工具取得最新資料，不要用你自己的知識或記憶回答，避免資訊過時或錯誤。" +
  "如果使用者一次問了「現在幾點」又問「天氣如何」，請同時呼叫 get_current_time 與 get_weather 兩個工具，" +
  "不要分開問、也不要漏掉任何一個。" +
  "呼叫 get_weather 時，city 參數一律使用英文城市名（例如「台北」要送 Taipei、「東京」要送 Tokyo），不可直接送中文。" +
  "工具回傳結果含 error 時，請根據錯誤訊息修正參數後重新呼叫，最多再嘗試兩次；仍失敗才向使用者說明查不到。" +
  "取得工具結果後，用自然、口語化的繁體中文整理成一段完整回覆，不要只丟原始 JSON。" +
  "若使用者沒有提供地點，禮貌地詢問城市名稱後再呼叫天氣工具。",
].join("\n");

export function createChatManager({ onToolCall } = {}) {
  const toolList = Object.values(allTools);
  const openAITools = toolList.map(toOpenAITool);
  const toolsByName = Object.fromEntries(toolList.map((tool) => [tool.name, tool]));

  const history = [{ role: "developer", content: DEVELOPER_PROMPT }];

  /**
   * 參數驗證失敗時回傳錯誤物件而非 throw，和 calculate 工具的設計一致：
   * 讓模型看得到錯誤訊息，就有機會自行修正後重新呼叫。
   */
  async function runTool(functionCall) {
    const tool = toolsByName[functionCall.name];
    if (!tool) return { ok: false, error: `未註冊的工具：${functionCall.name}` };

    let args;
    try {
      // 用 zod 再驗一次，模型送來的參數不可信任
      args = tool.parameters.parse(JSON.parse(functionCall.arguments));
    } catch (err) {
      return { ok: false, error: `參數不合法：${err.message}` };
    }

    try {
      return await tool.fn(args);
    } catch (err) {
      return { ok: false, error: `工具執行失敗：${err.message}` };
    }
  }

  async function ask(question) {
    // 出錯時要把這一輪產生的訊息全部回捲，避免 history 留下
    // 有 function_call 卻沒有 function_call_output 的殘缺配對，害下一輪送出時被 API 拒絕。
    const checkpoint = history.length;
    history.push({ role: "user", content: question });

    try {
      for (let round = 1; round <= MAX_TOOL_ROUNDS; round += 1) {
        const response = await client.responses.create({
          model: DEFAULT_MODEL,
          input: history,
          tools: openAITools,
          tool_choice: "auto",
        });

        history.push(...response.output);

        const functionCalls = response.output.filter((item) => item.type === "function_call");
        if (functionCalls.length === 0) return response.output_text;

        for (const functionCall of functionCalls) {
          const result = await runTool(functionCall);
          onToolCall?.({
            name: functionCall.name,
            arguments: functionCall.arguments,
            result,
          });

          history.push({
            type: "function_call_output",
            call_id: functionCall.call_id,
            output: JSON.stringify(result),
          });
        }
      }

      throw new Error(`Tool calling 超過 ${MAX_TOOL_ROUNDS} 輪，已停止執行`);
    } catch (err) {
      history.length = checkpoint;
      throw err;
    }
  }

  return { ask, tools: openAITools, getHistory: () => [...history] };
}
