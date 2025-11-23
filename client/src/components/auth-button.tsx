import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ApiStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuthButton() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [appId, setAppId] = useState("");
  const [secretKey, setSecretKey] = useState("");

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
      
      toast({
        title: "✅ Connected!",
        description: "Fyers API connected successfully.",
      });
      
      setAccessToken("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Connection Failed",
        description: error?.message || "Invalid token. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const credentialsMutation = useMutation({
    mutationFn: async (credentials: { appId: string; secretKey: string }) => {
      return await apiRequest("POST", "/api/auth/credentials", credentials);
    },
    onSuccess: () => {
      toast({
        title: "✅ Saved!",
        description: "Fyers credentials saved successfully.",
      });
      setAppId("");
      setSecretKey("");
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed",
        description: error?.message || "Failed to save credentials.",
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

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appId.trim() && secretKey.trim()) {
      credentialsMutation.mutate({
        appId: appId.trim(),
        secretKey: secretKey.trim(),
      });
    }
  };

  const isConnected = apiStatus?.authenticated && apiStatus?.connected;

  // Show connected status
  if (isConnected) {
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
                All services operational.
              </p>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                await apiRequest("POST", "/api/auth/disconnect");
                queryClient.invalidateQueries({ queryKey: ["/api/status"] });
                queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
                toast({
                  title: "Disconnected",
                  description: "Token cleared. You can add a new token below.",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to disconnect.",
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            size="sm"
            className="border-green-600 text-green-600 hover:bg-green-50"
            data-testid="button-disconnect"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  // Show tabs for token or credentials setup
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          Connect to Fyers API
        </h3>
        <p className="text-xs text-blue-700">
          Paste your daily access token below, or set up your App ID & Secret Key for automatic authentication.
        </p>
      </div>

      <Tabs defaultValue="token" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="token">Access Token</TabsTrigger>
          <TabsTrigger value="credentials">App Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="token" className="mt-4">
          <form onSubmit={handleTokenSubmit}>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Label htmlFor="accessToken" className="text-xs text-blue-900">
                  Daily Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Paste your Fyers access token here..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-1 text-sm"
                  data-testid="input-access-token"
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
        </TabsContent>

        <TabsContent value="credentials" className="mt-4 space-y-4">
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <Label htmlFor="appId" className="text-xs text-blue-900">
                Fyers App ID
              </Label>
              <Input
                id="appId"
                placeholder="e.g., BUXMASTNCH-100"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="mt-1 text-sm"
                data-testid="input-app-id"
              />
            </div>
            <div>
              <Label htmlFor="secretKey" className="text-xs text-blue-900">
                Fyers Secret Key
              </Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Your secret key (saved securely)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="mt-1 text-sm"
                data-testid="input-secret-key"
              />
            </div>
            <p className="text-xs text-blue-600">
              Get these from: <a href="https://myapi.fyers.in/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Fyers Dashboard</a>
            </p>
            <Button
              type="submit"
              disabled={credentialsMutation.isPending || !appId.trim() || !secretKey.trim()}
              className="w-full bg-[hsl(122,39%,49%)] hover:bg-[hsl(122,39%,39%)] text-white"
              size="sm"
              data-testid="button-save-credentials"
            >
              <Settings className="mr-2 h-4 w-4" />
              {credentialsMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Saving...
                </span>
              ) : 'Save Credentials'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
