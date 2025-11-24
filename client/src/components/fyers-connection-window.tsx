import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Key, Plug, AlertCircle } from "lucide-react";
import type { ApiStatus } from "@shared/schema";

export function FyersConnectionWindow() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: status, isLoading: statusLoading } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 3000,
  });

  const connectionMutation = useMutation({
    mutationFn: async (accessToken: string) => {
      return await apiRequest("POST", "/api/auth/token", { accessToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "✅ Connected!",
        description: "Fyers API connected successfully.",
      });
      setToken("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed",
        description: error?.message || "Connection failed. Check token and try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "Disconnected",
        description: "Token cleared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Disconnect failed.",
        variant: "destructive",
      });
    },
  });

  const isConnected = status?.authenticated && status?.connected;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      connectionMutation.mutate(token.trim());
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isConnected ? "bg-green-100" : "bg-gray-100"}`}>
              {isConnected ? (
                <Plug className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">Fyers API Connection</CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {isConnected ? "🟢 Connected" : "🔴 Not Connected"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-fyers"
          >
            {isExpanded ? "−" : "+"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-6">
          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Connected</p>
                    <p className="text-xs text-green-700">All systems operational</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                variant="outline"
                className="w-full"
                data-testid="button-disconnect"
              >
                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <Label htmlFor="fyers-token" className="text-xs font-medium">
                  Fyers Access Token
                </Label>
                <Input
                  id="fyers-token"
                  type="text"
                  placeholder="Paste your Fyers access token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-2 font-mono text-xs"
                  data-testid="input-fyers-token"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get token from: <a href="https://myapi.fyers.in/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Fyers Dashboard</a>
                </p>
              </div>

              <Button
                type="submit"
                disabled={connectionMutation.isPending || !token.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-connect-fyers"
              >
                <Key className="h-4 w-4 mr-2" />
                {connectionMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}
