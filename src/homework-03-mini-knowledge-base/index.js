import { cities } from "./data/taiwan-cites.js";
import { embedAll, EMBEDDING_MODEL } from "../shared/lib/embeddings.js";
import { spinner } from "../shared/utils/spinner.js"
import { recreateCollection, qdrant, searchTaiwanCities } from "../shared/lib/qdrant.js";
import { input } from "@inquirer/prompts";

function rowToText(row) {
  return [
    row.id,
    row.city,
    row.tags,
    row.description,
  ]
    .filter(Boolean)
    .join(" | ");
}

async function main() {
  const collectionName = "taiwan_cities";
  await recreateCollection(collectionName);
  console.log(`已建立 collection: ${collectionName}`);

  const texts = cities.map(rowToText);

  const spin = spinner(`正在取得 ${texts.length} 句的向量...`).start();
  const vectors = await embedAll(texts);
  spin.succeed(
    `已取得 ${vectors.length} 個向量（${EMBEDDING_MODEL}，${vectors[0].length} 維）`
  );

  const points = cities.map((row, idx) => ({
    id: idx,
    vector: vectors[idx],
    payload: {
      id: row.id,
      city: row.city,
      tags: row.tags,
      description: row.description,
    },
  }));
  await qdrant.upsert(collectionName, { wait: true, points });
  console.log("完成！");

  //
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
    const results = await searchTaiwanCities(query, 2);
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