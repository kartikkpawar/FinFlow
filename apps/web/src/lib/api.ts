import { showToast } from "@/components/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & { error?: string };
    return { response, payload };
  } catch {
    throw new ApiError(
      0,
      `Unable to connect to FinFlow API. Make sure the API Gateway is running at ${API_BASE_URL}.`,
    );
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("finflow_access_token") : null;
    const { response, payload } = await request<T>(path, options, token);

    if (response.status === 401 && typeof window !== "undefined" && path !== "/auth/refresh-access-token") {
      const refresh = await request<{ accessToken: string }>("/auth/refresh-access-token", { method: "POST" }, null);
      const nextToken = refresh.payload.data?.accessToken;

      if (refresh.response.ok && nextToken) {
        localStorage.setItem("finflow_access_token", nextToken);
        const retry = await request<T>(path, options, nextToken);
        if (retry.response.ok) return retry.payload.data;
        throw new ApiError(retry.response.status, retry.payload.message ?? "Request failed");
      }

      localStorage.removeItem("finflow_access_token");
      localStorage.removeItem("finflow_user");
    }

    if (!response.ok) {
      throw new ApiError(response.status, payload.message ?? payload.error ?? "Request failed");
    }

    return payload.data;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
    showToast(message, "error");
    throw error instanceof ApiError ? error : new ApiError(0, message);
  }
}
