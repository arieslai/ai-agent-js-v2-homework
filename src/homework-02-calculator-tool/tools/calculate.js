import { z } from "zod";
import { defineTool } from "../../shared/utils/func-tool.js";
import { evaluate } from "../lib/parser.js";

export const calculateTool = defineTool({
  name: "calculate",
  description: "進行數學計算",

  // .describe() 的文字會進到 JSON Schema，等於是給模型的填值說明
  parameters: z.object({
    expression: z
      .string()
      .min(1)
      .max(200)
      .describe("要計算的數學運算式，例如 (1+2)*3 或 2^10。只能包含數字、+ - * / % ^ 與括號"),
  }),

  // 失敗時回傳錯誤而非 throw：模型看得到訊息，就有機會修正運算式再呼叫一次
  fn: ({ expression }) => {
    try {
      return { ok: true, expression, result: evaluate(expression) };
    } catch (err) {
      return { ok: false, expression, error: err.message };
    }
  },
});
