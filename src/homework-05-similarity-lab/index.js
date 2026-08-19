import { testGroups } from "./data/test-groups.js";
import { embedAll, EMBEDDING_MODEL } from "../shared/lib/embeddings.js";
import { spinner } from "../shared/utils/spinner.js";
import { average, pairwiseSimilarity } from "./similarity.js";

function splitByGroup(vectors) {
  let offset = 0;
  return testGroups.map((group) => {
    const groupVectors = vectors.slice(offset, offset + group.sentences.length);
    offset += group.sentences.length;
    return { ...group, vectors: groupVectors };
  });
}

function reportGroup(group) {
  // console 訊息
  console.log(`\n第 ${group.id} 組：${group.name}`);
  group.sentences.forEach((s, idx) => console.log(`  (${idx + 1}) ${s}`));

  // 套用計算
  const results = pairwiseSimilarity(group.vectors);
  console.log("  兩兩相似度：");
  for (const { i, j, score } of results) {
    console.log(`    (${i + 1}) × (${j + 1}) = ${score.toFixed(3)}`);
  }

  // 平均
  const avg = average(results.map((r) => r.score));
  console.log(`  平均：${avg.toFixed(3)}`);
  console.log(`  預期：${group.expectation}`);

  return avg;
}

async function main() {
  const sentences = testGroups.flatMap((g) => g.sentences);
  
  const spin = spinner(`正在取得 ${sentences.length} 句的向量...`).start();
  const vectors = await embedAll(sentences);
  spin.succeed(
    `已取得 ${vectors.length} 個向量（${EMBEDDING_MODEL}，${vectors[0].length} 維）`
  );

  const averages = splitByGroup(vectors).map(reportGroup);
  console.log("\n=== 結論 ===");
  averages.forEach((avg, idx) =>
    console.log(`第 ${idx + 1} 組平均：${avg.toFixed(3)}`)
  );

  const verdict = averages[0] > averages[1] ? "符合預期" : "不符預期";
  console.log(
    `第 1 組（意思相近）${averages[0].toFixed(3)} > 第 2 組（意思不同）${averages[1].toFixed(3)}？ ${verdict}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});