import { getClient } from "../client.js";
import type { AlbumResource, AlbumsResponse } from "../types.js";

/**
 * Get photo albums
 */
export async function getAlbums(): Promise<AlbumResource[]> {
  const client = getClient();
  const response = await client.get<AlbumsResponse>("/api/frames/{frameId}/albums");
  return response.data;
}
