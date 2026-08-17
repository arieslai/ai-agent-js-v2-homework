// 聊天管理程式：負責維護對話歷史、送出 Responses API 請求、以及執行模型要求的工具。
// 主程式（index.js）只負責 CLI 互動，兩者分離才能讓對話流程被腳本重複驅動。

import * as allTools from "../tools/index.js";
import { toOpenAITool } from "../../shared/utils/func-tool.js";
import { client, DEFAULT_MODEL } from "../../shared/lib/openai.js";

const MAX_TOOL_ROUNDS = 8;

export const DEVELOPER_PROMPT = [
  "你是一位數學助理。任何需要計算的地方都必須呼叫 calculate 工具，不可自行心算或估算。",
  "使用者若用自然語言描述（例如「三成」「打八折」），請先轉換成運算式再交給工具。",
  "工具回傳 ok=false 時，請根據 error 訊息修正運算式後重新呼叫，最多嘗試兩次。",
  "回答時用一句話說明算式與結果，不要輸出多餘的推理過程。",
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
