import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_URL, QDRANT_API_KEY } from "../config.js";
import { embed } from "./embeddings.js";

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  ...(QDRANT_API_KEY && { apiKey: QDRANT_API_KEY }),
  checkCompatibility: false,
});

export const EMBEDDING_DIM = 1536;

export async function recreateCollection(collectionName) {
  const exists = await qdrant.collectionExists(collectionName);
  if (exists.exists) {
    await qdrant.deleteCollection(collectionName);
  }
  await qdrant.createCollection(collectionName, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });
}

export async function searchTaiwanCities(query, limit = 5) {
  const vector = await embed(query);

  const results = await qdrant.query("taiwan_cities", {
    query: vector,
    limit,
    with_payload: true,
  });

  return results.points.map((r) => ({
    score: r.score,
    id: r.payload.id,
    city: r.payload.city,
    tags: r.payload.tags,
    description: r.payload.description,
  }));
}