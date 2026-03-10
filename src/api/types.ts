/**
 * TypeScript types for Skylight API responses (JSON:API format)
 */

// Base JSON:API structures
export interface JsonApiResourceId {
  type: string;
  id: string;
}

export interface JsonApiResponse<D, I = unknown> {
  data: D;
  included?: I[];
  meta?: Record<string, unknown>;
}

// Category (Family Member) types
export interface CategoryAttributes {
  label: string | null;
  color: string | null;
  selected_for_chore_chart: boolean | null;
  linked_to_profile: boolean | null;
  profile_pic_url: string | null;
}

export interface CategoryResource {
  type: "category";
  id: string;
  attributes: CategoryAttributes;
}

// Chore types
export interface ChoreAttributes {
  id?: number | null;
  summary: string;
  status: string;
  start: string;
  start_time: string | null;
  completed_on: string | null;
  is_future: boolean | null;
  recurring: boolean;
  recurring_until: string | null;
  recurrence_set: string | null;
  reward_points: number | null;
  emoji_icon: string | null;
  routine: boolean | null;
  position: number | null;
}

export interface ChoreRelationships {
  category?: {
    data: JsonApiResourceId | null;
  };
}

export interface ChoreResource {
  type: "chore";
  id: string;
  attributes: ChoreAttributes;
  relationships?: ChoreRelationships;
}

// List types
export interface ListAttributes {
  label: string;
  color: string | null;
  kind: "shopping" | "to_do";
  default_grocery_list: boolean;
}

export interface ListRelationships {
  list_items?: {
    data: JsonApiResourceId[];
  };
}

export interface ListResource {
  type: "list";
  id: string;
  attributes: ListAttributes;
  relationships?: ListRelationships;
}

// List Item types
export interface ListItemAttributes {
  label: string;
  status: "pending" | "completed";
  section: string | null;
  position: number | null;
  created_at: string | null;
}

export interface ListItemResource {
  type: "list_item";
  id: string;
  attributes: ListItemAttributes;
}

// Task Box Item types
export interface TaskBoxItemAttributes {
  id?: number | null;
  summary: string;
  emoji_icon: string | null;
  routine: boolean | null;
  reward_points: number | null;
}

export interface TaskBoxItemResource {
  type: "task_box_item";
  id: string;
  attributes: TaskBoxItemAttributes;
}

// Frame types
export interface FrameAttributes {
  [key: string]: unknown;
}

export interface FrameResource {
  type: "frame";
  id: string;
  attributes: FrameAttributes;
}

// Calendar types
export interface SourceCalendarAttributes {
  [key: string]: unknown;
}

export interface SourceCalendarResource {
  type: "source_calendar";
  id: string;
  attributes: SourceCalendarAttributes;
}

export interface CalendarEventAttributes {
  [key: string]: unknown;
}

export interface CalendarEventResource {
  type: "calendar_event";
  id: string;
  attributes: CalendarEventAttributes;
}

// Device types
export interface DeviceAttributes {
  [key: string]: unknown;
}

export interface DeviceResource {
  type: "device";
  id: string;
  attributes: DeviceAttributes;
}

// Reward types
export interface RewardAttributes {
  [key: string]: unknown;
}

export interface RewardResource {
  type: "reward";
  id: string;
  attributes: RewardAttributes;
}

export interface RewardPointAttributes {
  [key: string]: unknown;
}

export interface RewardPointResource {
  type: "reward_point";
  id: string;
  attributes: RewardPointAttributes;
}

// API Response types
export type ChoresResponse = JsonApiResponse<ChoreResource[], CategoryResource>;
export type ChoreResponse = JsonApiResponse<ChoreResource, CategoryResource>;
export type ListsResponse = JsonApiResponse<ListResource[]>;
export type ListResponse = JsonApiResponse<ListResource, ListItemResource>;
export type CategoriesResponse = JsonApiResponse<CategoryResource[]>;
export type DevicesResponse = JsonApiResponse<DeviceResource[]>;
export type FrameResponse = JsonApiResponse<FrameResource>;
export type SourceCalendarsResponse = JsonApiResponse<SourceCalendarResource[]>;
export type CalendarEventsResponse = JsonApiResponse<CalendarEventResource[], CategoryResource | SourceCalendarResource>;
export type TaskBoxItemResponse = JsonApiResponse<TaskBoxItemResource>;
export type RewardsResponse = JsonApiResponse<RewardResource[]>;
// Reward points endpoint returns a plain array, not JSON:API wrapped
export interface RewardPointEntry {
  category_id?: number;
  current_point_balance?: number;
  lifetime_points_earned?: number;
}
export type RewardPointsResponse = RewardPointEntry[];

// Request body types for creating resources (flat JSON, not JSON:API wrapped)
export interface CreateChoreRequest {
  summary: string;
  start: string;
  start_time?: string | null;
  status?: string;
  recurring?: boolean;
  recurrence_set?: string[] | null;
  reward_points?: number | null;
  emoji_icon?: string | null;
  category_id?: string;
  category_ids?: string[];
  routine?: boolean;
}

export interface CreateTaskBoxItemRequest {
  data: {
    type: "task_box_item";
    attributes: Partial<TaskBoxItemAttributes>;
  };
}

// List request types
export interface CreateListRequest {
  data: {
    type: "list";
    attributes: {
      label: string;
      kind: "shopping" | "to_do";
      color?: string | null;
    };
  };
}

export interface UpdateListRequest {
  data: {
    type: "list";
    attributes: Partial<{
      label: string;
      kind: "shopping" | "to_do";
      color: string | null;
    }>;
  };
}

// List item request types (flat JSON, not JSON:API wrapped)
export interface CreateListItemRequest {
  label: string;
  section?: string | null;
}

export interface UpdateListItemRequest {
  label?: string;
  status?: "pending" | "completed";
  section?: string | null;
}

export type ListItemResponse = JsonApiResponse<ListItemResource>;

// Calendar event request types
export interface CreateCalendarEventRequest {
  summary: string;
  starts_at: string;
  ends_at: string;
  all_day?: boolean;
  description?: string;
  location?: string;
  category_ids?: string[];
  calendar_account_id?: string;
  calendar_id?: string;
  rrule?: string[] | null;
  timezone?: string;
  countdown_enabled?: boolean;
  kind?: string;
}

export interface UpdateCalendarEventRequest {
  summary?: string;
  starts_at?: string;
  ends_at?: string;
  all_day?: boolean;
  description?: string;
  location?: string;
  category_ids?: string[];
  rrule?: string[] | null;
  timezone?: string;
  countdown_enabled?: boolean;
}

export type CalendarEventResponse = JsonApiResponse<CalendarEventResource>;

// Chore update request type (flat JSON, not JSON:API wrapped)
export interface UpdateChoreRequest {
  summary?: string;
  start?: string;
  start_time?: string | null;
  status?: string;
  recurring?: boolean;
  recurrence_set?: unknown;
  reward_points?: number | null;
  emoji_icon?: string | null;
  category_id?: string | null;
  category_ids?: string[];
  routine?: boolean;
  position?: number;
}

// Reward request types (flat JSON, not JSON:API wrapped)
export interface CreateRewardRequest {
  name: string;
  point_value: number;
  description?: string | null;
  emoji_icon?: string | null;
  respawn_on_redemption?: boolean;
  category_ids?: string[];
}

export interface UpdateRewardRequest {
  name?: string;
  point_value?: number;
  description?: string | null;
  emoji_icon?: string | null;
  respawn_on_redemption?: boolean;
  category_id?: string;
}

export type RewardResponse = JsonApiResponse<RewardResource>;

// Meal types
export interface MealCategoryAttributes {
  name?: string;
  position?: number;
  [key: string]: unknown;
}

export interface MealCategoryResource {
  type: "meal_category";
  id: string;
  attributes: MealCategoryAttributes;
}

export interface MealRecipeAttributes {
  summary?: string;
  description?: string | null;
  [key: string]: unknown;
}

export interface MealRecipeResource {
  type: "meal_recipe";
  id: string;
  attributes: MealRecipeAttributes;
  relationships?: {
    meal_category?: {
      data: JsonApiResourceId | null;
    };
  };
}

export interface MealSittingAttributes {
  date?: string;
  meal_time?: string;
  [key: string]: unknown;
}

export interface MealSittingResource {
  type: "meal_sitting";
  id: string;
  attributes: MealSittingAttributes;
  relationships?: {
    meal_recipe?: {
      data: JsonApiResourceId | null;
    };
  };
}

export type MealCategoriesResponse = JsonApiResponse<MealCategoryResource[]>;
export type MealRecipesResponse = JsonApiResponse<MealRecipeResource[], MealCategoryResource>;
export type MealRecipeResponse = JsonApiResponse<MealRecipeResource, MealCategoryResource>;
export type MealSittingsResponse = JsonApiResponse<MealSittingResource[], MealRecipeResource>;

// Avatar types
export interface AvatarAttributes {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

export interface AvatarResource {
  type: "avatar";
  id: string;
  attributes: AvatarAttributes;
}

export type AvatarsResponse = JsonApiResponse<AvatarResource[]>;

// Color types
export interface ColorAttributes {
  name?: string;
  hex?: string;
  [key: string]: unknown;
}

export interface ColorResource {
  type: "color";
  id: string;
  attributes: ColorAttributes;
}

export type ColorsResponse = JsonApiResponse<ColorResource[]>;

// Album types
export interface AlbumAttributes {
  name?: string;
  photo_count?: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface AlbumResource {
  type: "album";
  id: string;
  attributes: AlbumAttributes;
}

export type AlbumsResponse = JsonApiResponse<AlbumResource[]>;
