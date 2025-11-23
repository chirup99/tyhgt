import { useMutation, useQuery } from "@tanstack/react-query";
import { Key } from "lucide-react";
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

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const tokenMutation = useMutation({
    mutationFn: async (token: string) => {
      console.log("🔐 [TOKEN] Submitting token to /api/auth/token...");
      console.log("🔐 [TOKEN] Token length:", token.length);
      console.log("🔐 [TOKEN] First 30 chars:", token.substring(0, 30));
      const result = await apiRequest("POST", "/api/auth/token", { accessToken: token });
      console.log("✅ [TOKEN] Backend response:", result);
      return result;
    },
    onSuccess: () => {
      console.log("✅ [TOKEN] Connection successful, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
      
      toast({
        title: "✅ Connected!",
        description: "Fyers API connected successfully.",
      });
      
      setAccessToken("");
    },
    onError: (error: any) => {
      console.error("❌ [TOKEN] Connection failed:", error);
      console.error("❌ [TOKEN] Error message:", error?.message);
      console.error("❌ [TOKEN] Error status:", error?.status);
      toast({
        title: "❌ Connection Failed",
        description: error?.message || "Invalid token. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessToken.trim()) {
      tokenMutation.mutate(accessToken.trim());
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

  // Show simple token input
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          Connect to Fyers API
        </h3>
        <p className="text-xs text-blue-700">
          Paste your daily Fyers access token below and click Connect.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Label htmlFor="accessToken" className="text-xs text-blue-900">
              Access Token
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
    </div>
  );
}
