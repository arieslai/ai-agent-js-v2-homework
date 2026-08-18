import { client } from "./openai.js";

export const EMBEDDING_MODEL = "text-embedding-3-small";

/** 一次送出多句，回傳順序與輸入相同的向量陣列。 */
export async function embedAll(texts) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function embed(text) {
  const [vector] = await embedAll([text]);
  return vector;
}
