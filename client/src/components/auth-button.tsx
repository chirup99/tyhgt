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
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  
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
      window.open(authUrl, '_blank', 'width=600,height=700');
      
      toast({
        title: "Authentication Started",
        description: "Please complete authentication in the popup window.",
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
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          Fyers API Authentication Required
        </h3>
        <p className="text-xs text-blue-700">
          Enter your Fyers access token from your Python code or authenticate through Fyers.
        </p>
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