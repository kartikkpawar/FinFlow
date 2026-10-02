import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { showToast } from "@/components/toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("finflow_access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh-access-token"
    ) {
      originalRequest._retry = true;

      try {
        const response = await api.post<{ data: { accessToken: string } }>(
          "/auth/refresh-access-token",
        );
        const token = response.data.data.accessToken;
        localStorage.setItem("finflow_access_token", token);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("finflow_access_token");
        localStorage.removeItem("finflow_user");
      }
    }

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      "Unable to connect to FinFlow API. Make sure the API Gateway is running at http://localhost:3001.";

    showToast(message, "error");
    return Promise.reject(error);
  },
);

export async function apiFetch<T>(
  path: string,
  options: AxiosRequestConfig = {},
): Promise<T> {
  const response = await api.request<{ data: T }>({
    url: path,
    ...options,
  });

  return response.data.data;
}
