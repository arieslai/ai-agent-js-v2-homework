import { spinner } from "../shared/utils/spinner.js"
import { collectionExists } from "../shared/lib/qdrant.js";
import { queries } from "./data/queries.js";
import { COLLECTION_NAME, searchTaiwanCities } from "./lib/store.js";

async function main() {
  if (!(await collectionExists(COLLECTION_NAME))) {
    console.log("尚未建立知識庫，請先執行：npm run hw3:seed");
    process.exit(1);
  }

  for (const [idx, query] of queries.entries()) {
    const spin = spinner(`搜尋中：${query.input}`).start();
    const results = await searchTaiwanCities(query.input, 3);
    spin.stop();

    console.log(`問法${idx + 1}：${query.input}，預期：${query.expectation}，搜尋結果：`);
    for (const [i, r] of results.entries()) {
      console.log(`\n${i + 1}. ${r.city} (${r.tags})`);
      console.log(`   分數：${r.score.toFixed(3)}`);
      console.log(`   描述：${r.description}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});