/** 產生 n 個元素的兩兩組合索引，例如 n=3 → [[0,1],[0,2],[1,2]]。 */
export function pairIndices(n) {
  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}

/**
 * 餘弦相似度：兩向量夾角的 cos 值，範圍 -1 ~ 1，越接近 1 代表語意方向越接近。
 * text-embedding-3 系列回傳的已是單位向量（分母為 1），此處仍完整計算分母，
 * 以免換模型後結果失真。
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`向量維度不一致：${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dot / denominator;
}

export function pairwiseSimilarity(vectors) {
  // 產生組合
  const pairs = pairIndices(vectors.length);
  const results = [];

  for (const pair of pairs) {
    const i = pair[0];
    const j = pair[1];
    const score = cosineSimilarity(vectors[i], vectors[j]);
    results.push({ i: i, j: j, score: score });
  }

  return results;
}

export function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}