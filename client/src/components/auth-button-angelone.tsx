import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, Shield, Eye, EyeOff, Clock, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AngelOneProfile {
  name: string;
  email: string;
  clientCode: string;
  broker: string;
}

interface AngelOneStatusData {
  success: boolean;
  connected: boolean;
  authenticated: boolean;
  clientCode?: string;
}

export function AuthButtonAngelOne() {
  const { toast } = useToast();
  const [clientCode, setClientCode] = useState(import.meta.env.VITE_ANGEL_ONE_CLIENT_CODE || "");
  const [pin, setPin] = useState(import.meta.env.VITE_ANGEL_ONE_PIN || "");
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANGEL_ONE_API_KEY || "");
  const [totpSecret, setTotpSecret] = useState(import.meta.env.VITE_ANGEL_ONE_TOTP_SECRET || "");
  const [showPin, setShowPin] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const hasEnvCredentials = !!(import.meta.env.VITE_ANGEL_ONE_CLIENT_CODE && import.meta.env.VITE_ANGEL_ONE_API_KEY);

  const { data: angelStatus } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 5000,
  });

  const { data: profileData } = useQuery<{ success: boolean; profile: AngelOneProfile }>({
    queryKey: ["/api/angelone/profile"],
    enabled: !!(angelStatus?.connected && angelStatus?.authenticated),
    refetchInterval: 10000,
  });

  const connectMutation = useMutation({
    mutationFn: async (credentials: { clientCode: string; pin: string; apiKey: string; totpSecret: string }) => {
      return await apiRequest("POST", "/api/angelone/connect", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      
      toast({
        title: "Connected!",
        description: "Angel One API connected successfully.",
      });
      
      setClientCode("");
      setPin("");
      setApiKey("");
      setTotpSecret("");
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error?.message || "Invalid credentials. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/angelone/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      
      toast({
        title: "Disconnected",
        description: "Angel One API disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to disconnect.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientCode.trim() && pin.trim() && apiKey.trim() && totpSecret.trim()) {
      connectMutation.mutate({
        clientCode: clientCode.trim(),
        pin: pin.trim(),
        apiKey: apiKey.trim(),
        totpSecret: totpSecret.trim(),
      });
    }
  };

  const isConnected = angelStatus?.connected && angelStatus?.authenticated;
  const userName = profileData?.profile?.name || angelStatus?.clientCode || "User";

  if (isConnected) {
    return (
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-orange-600 dark:text-orange-400 h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Angel One Connected
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 truncate">
                User: <span className="font-semibold">{userName}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            variant="outline"
            size="sm"
            className="border-orange-600 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 flex-shrink-0"
            data-testid="button-angelone-disconnect"
          >
            {disconnectMutation.isPending ? "..." : "Disconnect"}
          </Button>
        </div>
      </div>
    );
  }

  if (hasEnvCredentials) {
    return (
      <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
              Credentials Found in Environment
            </h3>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mb-3">
            Angel One SmartAPI credentials are configured. Click below to connect automatically.
          </p>
        </div>
        <Button
          onClick={() => connectMutation.mutate({
            clientCode: clientCode.trim(),
            pin: pin.trim(),
            apiKey: apiKey.trim(),
            totpSecret: totpSecret.trim(),
          })}
          disabled={connectMutation.isPending || !clientCode.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="sm"
          data-testid="button-angelone-connect-env"
        >
          <Key className="mr-2 h-4 w-4" />
          {connectMutation.isPending ? 'Connecting...' : 'Connect with Environment Credentials'}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
            Connect to Angel One (SmartAPI)
          </h3>
        </div>
        <p className="text-xs text-orange-700 dark:text-orange-300">
          Free API with automatic TOTP authentication. No daily token refresh needed.
        </p>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="angelClientCode" className="text-xs text-orange-900 dark:text-orange-200">
              Client Code
            </Label>
            <Input
              id="angelClientCode"
              placeholder="e.g., A12345"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              className="mt-1 text-sm bg-white dark:bg-gray-800"
              data-testid="input-angel-client-code"
            />
          </div>
          <div className="relative">
            <Label htmlFor="angelPin" className="text-xs text-orange-900 dark:text-orange-200">
              PIN (4 digits)
            </Label>
            <div className="relative mt-1">
              <Input
                id="angelPin"
                type={showPin ? "text" : "password"}
                placeholder="****"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-sm bg-white dark:bg-gray-800 pr-8"
                data-testid="input-angel-pin"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="angelApiKey" className="text-xs text-orange-900 dark:text-orange-200">
            API Key
          </Label>
          <Input
            id="angelApiKey"
            placeholder="Your SmartAPI Key from Angel One"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 text-sm bg-white dark:bg-gray-800"
            data-testid="input-angel-api-key"
          />
        </div>

        <div className="relative">
          <Label htmlFor="angelTotpSecret" className="text-xs text-orange-900 dark:text-orange-200">
            TOTP Secret (from Authenticator setup)
          </Label>
          <div className="relative mt-1">
            <Input
              id="angelTotpSecret"
              type={showSecret ? "text" : "password"}
              placeholder="Base32 secret key"
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value.toUpperCase())}
              className="text-sm bg-white dark:bg-gray-800 pr-8"
              data-testid="input-angel-totp-secret"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Get this from Angel One SmartAPI setup when you enable 2FA
          </p>
        </div>

        <Button
          type="submit"
          disabled={connectMutation.isPending || !clientCode.trim() || !pin.trim() || !apiKey.trim() || !totpSecret.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          size="sm"
          data-testid="button-angelone-connect"
        >
          <Key className="mr-2 h-4 w-4" />
          {connectMutation.isPending ? (
            <span className="flex items-center gap-2">
              Connecting...
            </span>
          ) : 'Connect to Angel One'}
        </Button>

        <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
          Get credentials from: <a href="https://smartapi.angelbroking.com/publisher-api" target="_blank" rel="noopener noreferrer" className="underline">Angel One SmartAPI Portal</a>
        </p>
      </form>
    </div>
  );
}

export function AngelOneStatus() {
  const { toast } = useToast();

  const { data: angelStatus } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 5000,
  });

  const { data: profileData } = useQuery<{ success: boolean; profile: AngelOneProfile }>({
    queryKey: ["/api/angelone/profile"],
    enabled: !!(angelStatus?.connected && angelStatus?.authenticated),
    refetchInterval: 10000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/angelone/status/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      toast({
        title: "Connection Refreshed",
        description: "Angel One API status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh Angel One API connection status.",
        variant: "destructive",
      });
    },
  });

  const isConnected = angelStatus?.connected;
  const isAuthenticated = angelStatus?.authenticated;
  const userName = profileData?.profile?.name || angelStatus?.clientCode || "Not connected";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected && isAuthenticated ? 'bg-orange-500' : 'bg-gray-400'}`}></span>
          Angel One Connection
        </h4>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          size="sm"
          variant="ghost"
          className="h-8"
          data-testid="button-angelone-refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <CheckCircle className={`h-4 w-4 ${
              isConnected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
            <p className="text-xs text-gray-500">API Status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isAuthenticated ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Shield className={`h-4 w-4 ${
              isAuthenticated ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {isAuthenticated ? 'Authenticated' : 'Not Auth'}
            </p>
            <p className="text-xs text-gray-500">Auth Status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px]">
              {userName}
            </p>
            <p className="text-xs text-gray-500">User</p>
          </div>
        </div>
      </div>
    </div>
  );
}
