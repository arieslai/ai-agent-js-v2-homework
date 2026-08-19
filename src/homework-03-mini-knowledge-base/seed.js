import { COLLECTION_NAME } from "./lib/store.js";
import { recreateCollection, upsertPoints } from "../shared/lib/qdrant.js";
import { spinner } from "../shared/utils/spinner.js";
import { embedAll, EMBEDDING_MODEL } from "../shared/lib/embeddings.js";
import { cities } from "./data/taiwan-cities.js";

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
  const collectionName = COLLECTION_NAME;
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
  await upsertPoints(collectionName, points);
  console.log(`Seed 完成（筆數：${points.length}）！`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});