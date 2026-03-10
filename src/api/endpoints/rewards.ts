import { getClient } from "../client.js";
import type {
  RewardsResponse,
  RewardResource,
  RewardResponse,
  RewardPointsResponse,
  RewardPointEntry,
  CreateRewardRequest,
  UpdateRewardRequest,
} from "../types.js";

export interface GetRewardsOptions {
  redeemedAtMin?: string;
}

/**
 * Get rewards (items that can be redeemed with points)
 */
export async function getRewards(options: GetRewardsOptions = {}): Promise<RewardResource[]> {
  const client = getClient();
  const response = await client.get<RewardsResponse>(
    "/api/frames/{frameId}/rewards",
    {
      redeemed_at_min: options.redeemedAtMin,
    }
  );
  return response.data;
}

/**
 * Get reward points for family members.
 * Note: This endpoint returns a plain array, not JSON:API wrapped.
 */
export async function getRewardPoints(): Promise<RewardPointEntry[]> {
  const client = getClient();
  const response = await client.get<RewardPointsResponse>(
    "/api/frames/{frameId}/reward_points"
  );
  // The endpoint returns a plain array, not { data: [...] }
  // Handle both formats for safety
  if (Array.isArray(response)) {
    return response;
  }
  // Fallback: if it's JSON:API wrapped, extract the data
  return (response as unknown as { data: RewardPointEntry[] }).data ?? [];
}

export interface CreateRewardOptions {
  name: string;
  pointValue: number;
  description?: string;
  emojiIcon?: string;
  categoryIds?: string[];
  respawnOnRedemption?: boolean;
}

/**
 * Create a new reward using flat JSON body
 */
export async function createReward(options: CreateRewardOptions): Promise<RewardResource> {
  const client = getClient();
  const request: CreateRewardRequest = {
    name: options.name,
    point_value: options.pointValue,
    description: options.description ?? null,
    emoji_icon: options.emojiIcon ?? null,
    respawn_on_redemption: options.respawnOnRedemption ?? false,
  };

  if (options.categoryIds && options.categoryIds.length > 0) {
    request.category_ids = options.categoryIds;
  }

  const response = await client.post<RewardResponse>("/api/frames/{frameId}/rewards", request);
  return response.data;
}

export interface UpdateRewardOptions {
  name?: string;
  pointValue?: number;
  description?: string | null;
  emojiIcon?: string | null;
  categoryIds?: string[];
  respawnOnRedemption?: boolean;
}

/**
 * Update an existing reward using flat JSON body
 */
export async function updateReward(
  rewardId: string,
  options: UpdateRewardOptions
): Promise<RewardResource> {
  const client = getClient();
  const request: UpdateRewardRequest = {};

  if (options.name !== undefined) request.name = options.name;
  if (options.pointValue !== undefined) request.point_value = options.pointValue;
  if (options.description !== undefined) request.description = options.description;
  if (options.emojiIcon !== undefined) request.emoji_icon = options.emojiIcon;
  if (options.respawnOnRedemption !== undefined) {
    request.respawn_on_redemption = options.respawnOnRedemption;
  }

  // Note: update uses singular category_id per OpenAPI spec
  if (options.categoryIds && options.categoryIds.length > 0) {
    request.category_id = options.categoryIds[0];
  }

  const response = await client.request<RewardResponse>(
    `/api/frames/{frameId}/rewards/${rewardId}`,
    { method: "PATCH", body: request }
  );
  return response.data;
}

/**
 * Delete a reward
 */
export async function deleteReward(rewardId: string): Promise<void> {
  const client = getClient();
  await client.request(`/api/frames/{frameId}/rewards/${rewardId}`, {
    method: "DELETE",
  });
}

/**
 * Redeem a reward (spend points)
 */
export async function redeemReward(
  rewardId: string,
  categoryId?: string
): Promise<RewardResource> {
  const client = getClient();
  const body = categoryId ? { category_id: categoryId } : {};
  const response = await client.post<RewardResponse>(
    `/api/frames/{frameId}/rewards/${rewardId}/redeem`,
    body
  );
  return response.data;
}

/**
 * Unredeem a reward (cancel redemption)
 */
export async function unredeemReward(rewardId: string): Promise<RewardResource> {
  const client = getClient();
  const response = await client.post<RewardResponse>(
    `/api/frames/{frameId}/rewards/${rewardId}/unredeem`,
    {}
  );
  return response.data;
}
