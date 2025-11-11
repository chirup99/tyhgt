import { useMutation, useQuery } from "@tanstack/react-query";
import { LogIn, ExternalLink, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ApiStatus } from "@shared/schema";

export function AuthButton() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(true);
  
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const tokenMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest("POST", "/api/auth/token", { accessToken: token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      
      // Hide authentication form after successful login
      setShowTokenInput(false);
      setShowCodeInput(false);
      
      toast({
        title: "Authentication Successful",
        description: "Connected to Fyers API successfully.",
      });
      setAccessToken("");
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Invalid access token. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const codeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/auth/exchange", { authCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      
      // Hide authentication form after successful OAuth login
      setShowTokenInput(false);
      setShowCodeInput(false);
      
      toast({
        title: "Authentication Successful",
        description: "Connected to Fyers API using authorization code.",
      });
      setAuthCode("");
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Invalid authorization code. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const authMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await apiRequest("GET", "/api/auth/url");
      const authData = response as unknown as { authUrl: string };
      return authData.authUrl;
    },
    onSuccess: (authUrl) => {
      // Open Fyers authentication in new window
      window.open(authUrl, 'FyersAuth', 'width=600,height=700');
      
      // Auto-show the URL input after opening popup
      setShowUrlInput(true);
      setShowTokenInput(false);
      setShowCodeInput(false);
      
      toast({
        title: "Step 1: Sign in to Fyers",
        description: "Complete the login, then paste the redirect URL below.",
      });
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Failed to start authentication process.",
        variant: "destructive",
      });
    },
  });

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessToken.trim()) {
      tokenMutation.mutate(accessToken.trim());
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authCode.trim()) {
      codeMutation.mutate(authCode.trim());
    }
  };

  const urlMutation = useMutation({
    mutationFn: async (url: string) => {
      const extractedCode = extractAuthCodeFromUrl(url);
      if (!extractedCode) {
        throw new Error("Could not extract auth_code from URL");
      }
      return await apiRequest("POST", "/api/auth/exchange", { authCode: extractedCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      
      setShowTokenInput(false);
      setShowCodeInput(false);
      setShowUrlInput(false);
      
      toast({
        title: "Authentication Successful",
        description: "Connected to Fyers API from redirect URL.",
      });
      setRedirectUrl("");
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Could not extract auth code from URL. Please check the URL format.",
        variant: "destructive",
      });
    },
  });

  const extractAuthCodeFromUrl = (url: string): string | null => {
    try {
      const codeMatch = url.match(/auth_code=([^&]+)/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (redirectUrl.trim()) {
      urlMutation.mutate(redirectUrl.trim());
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setRedirectUrl(url);
    
    // Auto-submit if valid Fyers redirect URL is detected
    if (url.includes('auth_code=') && url.includes('google.com')) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const extractedCode = extractAuthCodeFromUrl(url);
        if (extractedCode) {
          urlMutation.mutate(url.trim());
        }
      }, 100);
    }
  };

  // Show authentication options when: no token, disconnected, force show, or token null/missing
  const hasValidToken = apiStatus?.accessToken && apiStatus?.accessToken !== null;
  const shouldShowAuth = !hasValidToken || !apiStatus?.connected || showTokenInput;

  if (!shouldShowAuth) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Key className="text-green-600 h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-900">
                Fyers API Connected
              </h3>
              <p className="text-xs text-green-700">
                Authentication successful. All services are operational.
              </p>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                await apiRequest("POST", "/api/auth/disconnect");
                
                // Force authentication form to show - default to URL paste (easiest)
                setShowUrlInput(true);
                setShowTokenInput(false);
                setShowCodeInput(false);
                setAccessToken("");
                setAuthCode("");
                setRedirectUrl("");
                
                // Refresh data after disconnect
                queryClient.invalidateQueries({ queryKey: ["/api/status"] });
                queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
                
                toast({
                  title: "Disconnected",
                  description: "Authentication cleared. Enter your access token below.",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to disconnect. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            size="sm"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          🔐 Fyers API Login
        </h3>
        <p className="text-xs text-blue-700">
          <strong>Quick 2-Step Login:</strong>
        </p>
        <ol className="text-xs text-blue-600 mt-1 ml-4 space-y-0.5">
          <li>1️⃣ Click "Sign in with Fyers" button below</li>
          <li>2️⃣ After signing in, paste the redirect URL - it will auto-connect!</li>
        </ol>
      </div>

      <div className="space-y-4">
        {/* Access Token Input */}
        {showTokenInput && (
          <form onSubmit={handleTokenSubmit}>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Label htmlFor="accessToken" className="text-xs text-blue-900">
                  Access Token (from your Python code)
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter your Fyers access token..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={tokenMutation.isPending || !accessToken.trim()}
                className="bg-[hsl(122,39%,49%)] hover:bg-[hsl(122,39%,39%)] text-white"
                size="sm"
              >
                <Key className="mr-2 h-4 w-4" />
                {tokenMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </form>
        )}

        {/* Authorization Code Input */}
        {showCodeInput && (
          <form onSubmit={handleCodeSubmit}>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Label htmlFor="authCode" className="text-xs text-blue-900">
                  Authorization Code (from Google redirect URL)
                </Label>
                <Input
                  id="authCode"
                  type="text"
                  placeholder="Enter the authorization code from redirect URL..."
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={codeMutation.isPending || !authCode.trim()}
                className="bg-[hsl(122,39%,49%)] hover:bg-[hsl(122,39%,39%)] text-white"
                size="sm"
              >
                <Key className="mr-2 h-4 w-4" />
                {codeMutation.isPending ? 'Connecting...' : 'Exchange'}
              </Button>
            </div>
          </form>
        )}

        {/* Redirect URL Input - AUTO-CONNECT */}
        {showUrlInput && (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <Button
                onClick={() => authMutation.mutate()}
                disabled={authMutation.isPending}
                className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(207,90%,44%)] text-white"
                size="lg"
                data-testid="button-fyers-signin"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {authMutation.isPending ? 'Opening Fyers...' : 'Step 1: Sign in with Fyers'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <Label htmlFor="redirectUrl" className="text-xs text-blue-900 font-semibold">
                Step 2: Paste the redirect URL here (auto-connects!)
              </Label>
              <Input
                id="redirectUrl"
                type="text"
                placeholder="Paste: https://www.google.com/?s=ok&code=200&auth_code=eyJ...&state=None"
                value={redirectUrl}
                onChange={handleUrlChange}
                className="mt-1 text-sm font-mono"
                data-testid="input-redirect-url"
                autoFocus={showUrlInput}
              />
              {urlMutation.isPending && (
                <p className="text-xs text-blue-600 mt-1 font-medium animate-pulse">
                  🔄 Connecting to Fyers API...
                </p>
              )}
              {!urlMutation.isPending && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✨ Just paste the URL - it will connect automatically!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-500 mb-2">Alternative login methods:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setShowUrlInput(true);
              setShowTokenInput(false);
              setShowCodeInput(false);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs ${showUrlInput ? 'bg-blue-100 text-blue-900' : 'text-blue-600'}`}
            data-testid="button-toggle-url"
          >
            📋 Auto Login (Paste URL)
          </Button>
          <Button
            onClick={() => {
              setShowTokenInput(true);
              setShowCodeInput(false);
              setShowUrlInput(false);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs ${showTokenInput ? 'bg-blue-100 text-blue-900' : 'text-blue-600'}`}
            data-testid="button-toggle-token"
          >
            🔑 Access Token
          </Button>
          <Button
            onClick={() => {
              setShowCodeInput(true);
              setShowTokenInput(false);
              setShowUrlInput(false);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs ${showCodeInput ? 'bg-blue-100 text-blue-900' : 'text-blue-600'}`}
            data-testid="button-toggle-code"
          >
            🔐 Auth Code
          </Button>
        </div>
      </div>
    </div>
  );
}