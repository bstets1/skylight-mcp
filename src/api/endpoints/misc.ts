import { getClient } from "../client.js";
import type {
  AvatarResource,
  ColorResource,
  AvatarsResponse,
  ColorsResponse,
} from "../types.js";

/**
 * Get available avatar options
 */
export async function getAvatars(): Promise<AvatarResource[]> {
  const client = getClient();
  const response = await client.get<AvatarsResponse>("/api/avatars");
  return response.data;
}

/**
 * Get available color options
 */
export async function getColors(): Promise<ColorResource[]> {
  const client = getClient();
  const response = await client.get<ColorsResponse>("/api/colors");
  return response.data;
}
