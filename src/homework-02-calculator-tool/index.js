// 主程式：CLI 互動迴圈。對話流程與工具執行都交給 lib/chat-manager.js。

import { input } from "@inquirer/prompts";
import { createChatManager } from "./lib/chat-manager.js";

const chat = createChatManager({
  onToolCall: ({ name, arguments: args, result }) => {
    console.log(`[呼叫 tool] ${name}(${args}) -> ${JSON.stringify(result)}`);
  },
});

console.log("計算機助理（輸入 exit 離開）\n");

try {
  while (true) {
    const question = await input({ message: "你：" });
    if (["exit", "quit"].includes(question.trim().toLowerCase())) break;
    if (question.trim() === "") continue;

    console.log("思考中...");
    try {
      console.log(`\n助理：${await chat.ask(question)}\n`);
    } catch (err) {
      // 單次提問失敗不該中斷整個對話，也不該讓先前的記憶消失
      console.error(`\n[錯誤] ${err.message}\n請再試一次，或輸入 exit 離開。\n`);
    }
  }
  console.log("再會~");
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}
