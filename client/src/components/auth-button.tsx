import { useMutation, useQuery } from "@tanstack/react-query";
import { LogIn, ExternalLink, Key, Trash2 } from "lucide-react";
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
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [manualAuthUrl, setManualAuthUrl] = useState<string | null>(null);

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  // Query to fetch Firebase token count
  const { data: tokenCountData } = useQuery<{ success: boolean; count: number }>({
    queryKey: ["/api/auth/token/firebase/count"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mutation to delete Firebase tokens
  const deleteTokenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/auth/token/firebase");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/token/firebase/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      
      toast({
        title: "Firebase Tokens Deleted",
        description: `Successfully deleted ${data.count} token(s) from Firebase. You can now add a new token.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to delete Firebase tokens.";
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const tokenMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest("POST", "/api/auth/token", { accessToken: token });
    },
    onSuccess: (data: any) => {
      // Immediately invalidate queries to show token as authenticated
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/token/firebase/count"] });

      // Hide authentication form after successful token save
      setShowTokenInput(false);
      setShowCodeInput(false);

      // Show success message - token is saved and verification is in progress
      toast({
        title: "Token Saved Successfully!",
        description: "Your token has been saved. Connection verification is running in the background.",
      });

      setAccessToken("");
    },
    onError: (error: any) => {
      let errorMessage = "Invalid access token. Please check and try again.";
      
      if (error?.message) {
        if (error.message.includes('timeout')) {
          errorMessage = "Connection timeout. The server is taking too long to respond. Please try again.";
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('400')) {
          errorMessage = "Invalid token format. Please ensure you're using a valid Fyers access token.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
    onError: (error: any) => {
      let errorMessage = "Invalid authorization code. Please check and try again.";
      
      if (error?.message) {
        if (error.message.includes('timeout')) {
          errorMessage = "Connection timeout. The exchange is taking too long. Please try again.";
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const authMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await apiRequest("GET", "/api/auth/url");
      const authData = response as unknown as { authUrl: string };
      return authData.authUrl;
    },
    onSuccess: (authUrl) => {
      // Store the auth URL for manual access
      setManualAuthUrl(authUrl);
      
      // Try to open Fyers authentication in new window
      const popup = window.open(authUrl, '_blank', 'width=600,height=700,noopener,noreferrer');

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup was blocked, show direct link instead
        toast({
          title: "Popup Blocked",
          description: "Click the 'Open Authentication' link below to authenticate manually.",
          variant: "destructive",
        });
        
        // Show the auth code input field with the URL as a clickable link
        setShowCodeInput(true);
        setShowTokenInput(false);
      } else {
        // Popup opened successfully
        toast({
          title: "Authentication Started",
          description: "Please complete authentication in the popup window, then paste the code from the redirect URL.",
        });
        
        // Automatically show code input for when user returns with the code
        setShowCodeInput(true);
        setShowTokenInput(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Failed to start authentication process. Please try again or use the manual token input.",
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

  // Show authentication options when: no token, disconnected, force show, or token null/missing
  const hasValidToken = apiStatus?.accessToken && apiStatus?.accessToken !== null;
  const isAuthenticated = apiStatus?.authenticated;
  const isConnected = apiStatus?.connected;
  const shouldShowAuth = !hasValidToken || showTokenInput;

  // Token saved but verification pending or failed (authenticated but not connected)
  if (hasValidToken && isAuthenticated && !isConnected && !showTokenInput) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Key className="text-yellow-600 h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-900">
                Token Saved - Verification Pending
              </h3>
              <p className="text-xs text-yellow-700">
                Your token is saved. Connection verification is in progress or temporarily rate-limited. The dashboard will update automatically.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowTokenInput(true);
              setShowCodeInput(false);
            }}
            variant="outline"
            size="sm"
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
          >
            Update Token
          </Button>
        </div>
      </div>
    );
  }

  // Fully connected
  if (hasValidToken && isAuthenticated && isConnected && !showTokenInput) {
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

                // Force authentication form to show
                setShowTokenInput(true);
                setShowCodeInput(false);
                setAccessToken("");
                setAuthCode("");

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
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-blue-900">
            Fyers API Authentication Required
          </h3>
          <Button
            onClick={() => deleteTokenMutation.mutate()}
            disabled={deleteTokenMutation.isPending || (tokenCountData && tokenCountData.count === 0)}
            variant="outline"
            size="sm"
            className="border-red-600 text-red-600 hover:bg-red-50"
            data-testid="button-delete-firebase-token"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            {deleteTokenMutation.isPending 
              ? 'Deleting...' 
              : `Delete Firebase Token (${tokenCountData?.count || 0})`
            }
          </Button>
        </div>
        <p className="text-xs text-blue-700">
          Enter your Fyers access token from your Python code or authenticate through Fyers.
        </p>
        {tokenCountData && tokenCountData.count > 0 && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Found {tokenCountData.count} old token(s) in Firebase. Delete them to add a new token.
          </p>
        )}
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
                data-testid="button-connect-token"
              >
                <Key className="mr-2 h-4 w-4" />
                {tokenMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Connecting...
                  </span>
                ) : 'Connect'}
              </Button>
            </div>
          </form>
        )}

        {/* Authorization Code Input */}
        {showCodeInput && (
          <form onSubmit={handleCodeSubmit}>
            {manualAuthUrl && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 mb-2">
                  If the popup was blocked, click the button below to authenticate manually:
                </p>
                <Button
                  type="button"
                  onClick={() => window.open(manualAuthUrl, '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  size="sm"
                  className="border-[hsl(207,90%,54%)] text-[hsl(207,90%,54%)] hover:bg-[hsl(207,90%,54%)]/10"
                  data-testid="button-manual-auth"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Authentication Page
                </Button>
              </div>
            )}
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
                data-testid="button-exchange-code"
              >
                <Key className="mr-2 h-4 w-4" />
                {codeMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Exchanging...
                  </span>
                ) : 'Exchange'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-blue-200">
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setShowTokenInput(!showTokenInput);
              setShowCodeInput(false);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs ${showTokenInput ? 'bg-blue-100 text-blue-900' : 'text-blue-600'}`}
          >
            Access Token
          </Button>
          <Button
            onClick={() => {
              setShowCodeInput(!showCodeInput);
              setShowTokenInput(false);
            }}
            variant="ghost"
            size="sm"
            className={`text-xs ${showCodeInput ? 'bg-blue-100 text-blue-900' : 'text-blue-600'}`}
          >
            Auth Code
          </Button>
        </div>
        <Button
          onClick={() => authMutation.mutate()}
          disabled={authMutation.isPending}
          variant="outline"
          className="border-[hsl(207,90%,54%)] text-[hsl(207,90%,54%)] hover:bg-[hsl(207,90%,54%)]/10"
          size="sm"
        >
          <LogIn className="mr-2 h-4 w-4" />
          {authMutation.isPending ? 'Opening...' : 'OAuth Login'}
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}