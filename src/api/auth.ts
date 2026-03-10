/**
 * Skylight Authentication
 * Handles login via email/password to obtain API token
 */

import { BASE_URL } from "./client.js";

export interface LoginResponse {
  data: {
    id: string;
    type: "authenticated_user";
    attributes: {
      email: string;
      token: string;
      subscription_status: string;
    };
  };
  meta?: {
    password_reset?: boolean;
  };
}

export interface AuthResult {
  userId: string;
  email: string;
  token: string;
  subscriptionStatus: string;
}

/**
 * Login to Skylight with email and password
 * Returns the authentication token and user info
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  console.error(`[auth] Attempting login for ${email}...`);

  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  console.error(`[auth] Login response status: ${response.status}`);

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
      console.error(`[auth] Login error response: ${errorBody}`);
    } catch {
      // ignore
    }

    if (response.status === 401) {
      throw new Error(`Invalid email or password. Please check your SKYLIGHT_EMAIL and SKYLIGHT_PASSWORD environment variables.`);
    }
    throw new Error(`Login failed: HTTP ${response.status}${errorBody ? ` - ${errorBody}` : ""}`);
  }

  const data = (await response.json()) as LoginResponse;

  console.error("[auth] Login successful");

  return {
    userId: data.data.id,
    email: data.data.attributes.email,
    token: data.data.attributes.token,
    subscriptionStatus: data.data.attributes.subscription_status,
  };
}