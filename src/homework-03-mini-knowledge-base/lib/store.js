import { embed } from "../../shared/lib/embeddings.js";
import { search } from "../../shared/lib/qdrant.js";

export const COLLECTION_NAME = "taiwan_cities";

export async function searchTaiwanCities(query, limit = 5) {
  const vector = await embed(query);
  const results = await search(COLLECTION_NAME, vector, limit);
  return results.points.map((r) => ({
    score: r.score,
    city: r.payload.city,
    tags: r.payload.tags,
    description: r.payload.description,
  }));
}
