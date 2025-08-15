import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiResponse, isApiSuccess, handleApiResponse } from "@shared/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const requestInit: RequestInit = {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    credentials: "include",
  };
  
  if (data !== undefined) {
    requestInit.body = JSON.stringify(data);
  }
  
  const res = await fetch(url, requestInit);

  await throwIfResNotOk(res);
  return res;
}

// Helper for mutations that need to extract data from API responses
export async function apiRequestJson<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  const apiResponse: ApiResponse<T> = await res.json();
  return handleApiResponse(apiResponse);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T | null> {
  return async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const apiResponse: ApiResponse<T> = await res.json();
    return handleApiResponse(apiResponse);
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
