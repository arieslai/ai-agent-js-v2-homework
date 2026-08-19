import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_URL, QDRANT_API_KEY } from "../config.js";

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  ...(QDRANT_API_KEY && { apiKey: QDRANT_API_KEY }),
  checkCompatibility: false,
});

export const EMBEDDING_DIM = 1536;

export async function collectionExists(collectionName) {
  return (await qdrant.collectionExists(collectionName)).exists;
}

export async function recreateCollection(collectionName) {
  if ((await collectionExists(collectionName))) {
    await qdrant.deleteCollection(collectionName);
  }
  await qdrant.createCollection(collectionName, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });
}

export async function search(collectionName, vector, limit) {
  return (await qdrant.query(collectionName, {
    query: vector,
    limit,
    with_payload: true,
  }));
}

export async function upsertPoints(collectionName, points) {
  await qdrant.upsert(collectionName, { wait: true, points });
}
