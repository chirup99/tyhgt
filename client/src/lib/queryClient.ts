import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  options: { url: string; method: string; body?: unknown } | string,
  url?: string,
  data?: unknown | undefined,
): Promise<any> {
  // Handle both object and individual parameter styles
  let requestUrl: string;
  let requestMethod: string;
  let requestData: unknown;

  if (typeof options === 'object' && options.url) {
    // New object style: apiRequest({ url, method, body })
    requestUrl = options.url;
    requestMethod = options.method;
    requestData = options.body;
  } else if (typeof options === 'string' && url) {
    // Old style: apiRequest(method, url, data)
    requestMethod = options;
    requestUrl = url;
    requestData = data;
  } else {
    throw new Error('Invalid apiRequest parameters');
  }

  const res = await fetch(requestUrl, {
    method: requestMethod,
    headers: requestData ? { "Content-Type": "application/json" } : {},
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
