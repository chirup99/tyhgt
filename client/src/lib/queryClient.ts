import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API base URL - uses Cloud Run backend in production, local backend in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to add timeout to fetch requests
function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout. Please check your connection and try again.'));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
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

  // Prevent double-prefixing: only add API_BASE_URL if the URL is relative
  const fullUrl = requestUrl.startsWith('http') ? requestUrl : `${API_BASE_URL}${requestUrl}`;

  try {
    const res = await fetchWithTimeout(fullUrl, {
      method: requestMethod,
      headers: requestData ? { "Content-Type": "application/json" } : {},
      body: requestData ? JSON.stringify(requestData) : undefined,
      credentials: "include",
    }, 30000);

    await throwIfResNotOk(res);
    return await res.json();
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      throw new Error('Connection timeout. The server is taking too long to respond. Please try again.');
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const queryPath = queryKey.join("/");
    // Prevent double-prefixing: only add API_BASE_URL if the path is relative
    const fullUrl = queryPath.startsWith('http') ? queryPath : `${API_BASE_URL}${queryPath}`;
    
    const res = await fetch(fullUrl as string, {
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
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});
