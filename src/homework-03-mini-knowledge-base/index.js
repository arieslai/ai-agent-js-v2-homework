import { spinner } from "../shared/utils/spinner.js"
import { collectionExists } from "../shared/lib/qdrant.js";
import { input } from "@inquirer/prompts";
import { COLLECTION_NAME, searchTaiwanCities } from "./lib/store.js";

async function main() {
  if (!(await collectionExists(COLLECTION_NAME))) {
    console.log("尚未建立知識庫，請先執行：npm run hw3:seed");
    process.exit(1);
  }

  while (true) {
    const query = (
      await input({ message: "請輸入要搜尋的城市內容：" })
    ).trim();

    if (query === "") continue;
    if (query.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    const spin = spinner("搜尋中...").start();
    const results = await searchTaiwanCities(query, 3);
    spin.stop();

    for (const [i, r] of results.entries()) {
      console.log(`\n${i + 1}. ${r.city} (${r.tags})`);
      console.log(`   分數：${r.score.toFixed(3)}`);
      console.log(`   描述：${r.description}`);
    }
    console.log();
  }
}

main().catch((err) => {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
});