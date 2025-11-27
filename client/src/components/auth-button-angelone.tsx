import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, Shield, Eye, EyeOff, Clock, RefreshCw, CheckCircle, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

// Global auto-connect component that runs on app startup (renders nothing)
export function AngelOneGlobalAutoConnect() {
  const { toast } = useToast();
  const autoConnectAttempted = useRef(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  
  const hasEnvCredentials = !!(import.meta.env.VITE_ANGEL_ONE_CLIENT_CODE && import.meta.env.VITE_ANGEL_ONE_API_KEY);
  const clientCode = import.meta.env.VITE_ANGEL_ONE_CLIENT_CODE || "";
  const pin = import.meta.env.VITE_ANGEL_ONE_PIN || "";
  const apiKey = import.meta.env.VITE_ANGEL_ONE_API_KEY || "";
  const totpSecret = import.meta.env.VITE_ANGEL_ONE_TOTP_SECRET || "";

  const { data: angelStatus } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 5000,
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
    },
    onError: (error: any) => {
      console.log('🔶 Angel One auto-connect failed:', error?.message);
    },
  });

  // Global auto-connect on app startup
  useEffect(() => {
    const shouldAutoConnect = 
      hasEnvCredentials && 
      !autoConnectAttempted.current && 
      angelStatus !== undefined &&
      !angelStatus?.connected &&
      !angelStatus?.authenticated &&
      clientCode.trim() && 
      pin.trim() && 
      apiKey.trim() && 
      totpSecret.trim();

    if (shouldAutoConnect) {
      autoConnectAttempted.current = true;
      setIsAutoConnecting(true);
      console.log('🔶 [GLOBAL] Auto-connecting to Angel One with environment credentials...');
      
      connectMutation.mutate({
        clientCode: clientCode.trim(),
        pin: pin.trim(),
        apiKey: apiKey.trim(),
        totpSecret: totpSecret.trim(),
      }, {
        onSettled: () => {
          setIsAutoConnecting(false);
        }
      });
    }
  }, [hasEnvCredentials, angelStatus, clientCode, pin, apiKey, totpSecret]);

  // This component renders nothing - it just handles the auto-connect logic
  return null;
}

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
  const autoConnectAttempted = useRef(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

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

  // Auto-connect when environment credentials are available
  useEffect(() => {
    const shouldAutoConnect = 
      hasEnvCredentials && 
      !autoConnectAttempted.current && 
      angelStatus !== undefined &&
      !angelStatus?.connected &&
      !angelStatus?.authenticated &&
      clientCode.trim() && 
      pin.trim() && 
      apiKey.trim() && 
      totpSecret.trim();

    if (shouldAutoConnect) {
      autoConnectAttempted.current = true;
      setIsAutoConnecting(true);
      console.log('🔶 Auto-connecting to Angel One with environment credentials...');
      
      connectMutation.mutate({
        clientCode: clientCode.trim(),
        pin: pin.trim(),
        apiKey: apiKey.trim(),
        totpSecret: totpSecret.trim(),
      }, {
        onSettled: () => {
          setIsAutoConnecting(false);
        }
      });
    }
  }, [hasEnvCredentials, angelStatus, clientCode, pin, apiKey, totpSecret]);

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
    // Auto-connecting state
    if (isAutoConnecting || connectMutation.isPending) {
      return (
        <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-3 py-2">
            <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
            <div>
              <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
                Connecting to Angel One...
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Using environment credentials for automatic connection
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // If we have env credentials but failed to connect, show retry button with disconnect option
    return (
      <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 font-normal">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200">
              Angel One - Connection Failed
            </h3>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
            Authentication failed (Token expired or invalid). Try reconnecting or clear credentials.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              autoConnectAttempted.current = false;
              setIsAutoConnecting(true);
              connectMutation.mutate({
                clientCode: clientCode.trim(),
                pin: pin.trim(),
                apiKey: apiKey.trim(),
                totpSecret: totpSecret.trim(),
              }, {
                onSettled: () => setIsAutoConnecting(false)
              });
            }}
            disabled={connectMutation.isPending || !clientCode.trim()}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
            data-testid="button-angelone-connect-env"
          >
            <Key className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
          <Button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            variant="outline"
            size="sm"
            className="border-red-600 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            data-testid="button-angelone-disconnect-failed"
          >
            {disconnectMutation.isPending ? "..." : "Disconnect"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 font-normal">
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

interface AngelOneApiStats {
  connected: boolean;
  authenticated: boolean;
  version: string;
  dailyLimit: number;
  requestsUsed: number;
  lastUpdate: string | null;
  websocketActive: boolean;
  responseTime: number;
  successRate: number;
  throughput: string;
  activeSymbols: number;
  updatesPerSec: number;
  uptime: number;
  latency: number;
  clientCode: string | null;
}

interface AngelOneActivityLog {
  id: number;
  timestamp: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  endpoint?: string;
}

export function AngelOneStatus() {
  const { toast } = useToast();

  const { data: angelStatus } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 3000, // Keep-alive heartbeat every 3 seconds
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
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/activity-logs"] });
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

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/angelone/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      toast({
        title: "Disconnected",
        description: "Angel One connection has been closed.",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Angel One.",
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
          <span className={`w-2 h-2 rounded-full animate-pulse ${isConnected && isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          Angel One Connection
        </h4>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || disconnectMutation.isPending}
            size="sm"
            variant="ghost"
            className="h-8"
            data-testid="button-angelone-refresh"
            title="Refresh connection status"
          >
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
          {isConnected && isAuthenticated && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to disconnect from Angel One?')) {
                  disconnectMutation.mutate();
                }
              }}
              disabled={disconnectMutation.isPending || refreshMutation.isPending}
              size="sm"
              variant="ghost"
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-angelone-disconnect"
              title="Disconnect from Angel One"
            >
              <LogOut className={`h-4 w-4 ${disconnectMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
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

export function AngelOneApiStatistics() {
  const { data: stats } = useQuery<{ success: boolean } & AngelOneApiStats>({
    queryKey: ["/api/angelone/statistics"],
    refetchInterval: 5000,
  });

  const responseTimePercentage = Math.min((stats?.responseTime || 0) / 100 * 100, 100);
  const successRatePercentage = stats?.successRate || 0;
  const throughputValue = parseFloat(stats?.throughput?.split(' ')[0] || '0');
  const throughputPercentage = Math.min(throughputValue / 5 * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Angel One API Statistics</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time API performance metrics</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Response Time</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.responseTime || 0}ms</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(responseTimePercentage, 5)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.successRate || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${successRatePercentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Throughput</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.throughput || '0 MB/s'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(throughputPercentage, 5)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.activeSymbols || 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Active Symbols</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.updatesPerSec?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Updates/sec</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.uptime || 0}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.latency || 0}ms</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Latency</p>
        </div>
      </div>
    </div>
  );
}

export function AngelOneSystemStatus() {
  const { data: stats } = useQuery<{ success: boolean } & AngelOneApiStats>({
    queryKey: ["/api/angelone/statistics"],
    refetchInterval: 5000,
  });

  const { data: logsData } = useQuery<{ success: boolean; logs: AngelOneActivityLog[] }>({
    queryKey: ["/api/angelone/activity-logs"],
    refetchInterval: 10000,
  });

  const logs = logsData?.logs || [];

  const formatTime = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRelativeTime = (timestamp: string | Date) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      if (isNaN(time.getTime())) {
        return 'unknown';
      }
      
      const diff = Math.floor((now.getTime() - time.getTime()) / 60000);

      if (diff < 1) return 'just now';
      if (diff < 60) return `${diff} min ago`;
      return `${Math.floor(diff / 60)} hr ago`;
    } catch (error) {
      return 'unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Angel One System Status</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Error handling and system notifications</p>
      </div>

      <div className={`flex items-center space-x-3 p-4 rounded-lg ${
        stats?.connected 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          stats?.connected ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
        }`}>
          <CheckCircle className={`h-4 w-4 ${
            stats?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {stats?.connected ? 'All Systems Operational' : 'Connection Issues Detected'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {stats?.connected 
              ? 'Angel One API connection stable, no errors detected'
              : 'Unable to connect to Angel One API, please check credentials'
            }
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {stats?.lastUpdate ? getRelativeTime(stats.lastUpdate) : 'Unknown'}
        </span>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">Recent Activity</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {logs.length > 0 ? (
            logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center space-x-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(log.type)}`}></div>
                <span className="text-gray-600 dark:text-gray-400 text-xs w-20">{formatTime(log.timestamp)}</span>
                <span className="text-gray-900 dark:text-gray-100 text-xs flex-1 truncate">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}
