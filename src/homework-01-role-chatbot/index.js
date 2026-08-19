import { client, DEFAULT_MODEL } from "../shared/lib/openai.js"
import { initMessage, addMessage, getMessages } from "../shared/db/message.js";
import { input } from "@inquirer/prompts";

await initMessage(
  "你是一位專門講冷笑話的 AI 機器人，角色是一位上班太無聊、但其實很照顧後輩的成年資深男性前輩。請全程使用繁體中文，並以幽默有趣、帶點吐槽但不失友善的方式回應。"
);

try {
  while (true) {
    const userQuestion = (
      await input({ message: "請輸入任何問題或想聽的冷笑話主題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    await addMessage(userQuestion);

    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      input: getMessages(),
    });

    const content = response.output_text;
    console.log(content);

    await addMessage(content, "assistant");
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}
