import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

type ApiErrorResponse = {
  success?: boolean;
  message?: unknown;
  data?: {
    message?: unknown;
    tag?: unknown;
  };
};

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const GENERIC_API_ERROR_MESSAGE =
  "Something went wrong. Please contact administrator";

function getApiErrorMessage(error: AxiosError<ApiErrorResponse>): string {
  const responseData = error.response?.data;

  if (
    responseData?.success === false &&
    typeof responseData.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (
    responseData?.success === false &&
    typeof responseData.data?.message === "string" &&
    responseData.data.message.trim()
  ) {
    return responseData.data.message;
  }

  console.error("FinFlow API error:", error);
  return GENERIC_API_ERROR_MESSAGE;
}

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return "http://localhost:3001";
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("finflow_access_token")
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ data: { accessToken: string } }>("/auth/refresh-access-token")
      .then((response) => {
        const token = response.data.data.accessToken;
        localStorage.setItem("finflow_access_token", token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function clearAuthState() {
  localStorage.removeItem("finflow_access_token");
  localStorage.removeItem("finflow_user");
  localStorage.removeItem("finflow_merchant_id");
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        clearAuthState();
      }
    }

    toast.error(getApiErrorMessage(error));
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

export async function safeApiRequest<T>(
  request: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof AxiosError) {
      return undefined;
    }

    throw error;
  }
}
