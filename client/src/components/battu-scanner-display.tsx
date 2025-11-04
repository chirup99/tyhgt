import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Settings, TrendingUp, Activity, CheckCircle, Target } from "lucide-react";
import { useState } from "react";
import SymbolDataPicker from "./symbol-data-picker";

interface BattuTestResponse {
  success: boolean;
  message: string;
  database: {
    connected: boolean;
    symbols: number;
    symbolsList: string[];
  };
  scanner: {
    available: boolean;
    engines: string[];
  };
  timestamp: string;
}

interface BattuStatusResponse {
  success: boolean;
  system: string;
  status: string;
  activeSessions: number;
  discoveredPatterns: number;
  activeTrades: number;
  timestamp: string;
}

export default function BattuScannerDisplay() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Test BATTU Scanner System
  const { data: battuTest, isLoading: testLoading, error: testError } = useQuery<BattuTestResponse>({
    queryKey: ['/api/battu/test', refreshKey],
    queryFn: () => apiRequest('/api/battu/test')
  });

  // Get BATTU Scanner Status  
  const { data: battuStatus, isLoading: statusLoading, error: statusError } = useQuery<BattuStatusResponse>({
    queryKey: ['/api/battu/status', refreshKey],
    queryFn: () => apiRequest('/api/battu/status')
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Scanner Overview</TabsTrigger>
        <TabsTrigger value="symbols">Symbol Picker</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">BATTU Scanner System</h1>
        </div>
        <Button onClick={handleRefresh} className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>Refresh Status</span>
        </Button>
      </div>
      
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Test Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>System Test</span>
            </CardTitle>
            <CardDescription>Core system functionality verification</CardDescription>
          </CardHeader>
          <CardContent>
            {testLoading ? (
              <div className="text-gray-500">Testing system...</div>
            ) : testError ? (
              <div className="text-red-600">System test failed: {String(testError)}</div>
            ) : battuTest?.success ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">System Operational</span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Database:</strong> {battuTest.database?.symbols || 0} symbols connected
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Engines:</strong> {battuTest.scanner?.engines?.length || 0} available
                </div>
                <div className="text-xs text-gray-500">
                  Last checked: {new Date(battuTest.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-red-600">System Error - No response</div>
            )}
          </CardContent>
        </Card>

        {/* Scanner Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Scanner Status</span>
            </CardTitle>
            <CardDescription>Real-time scanner activity</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="text-gray-500">Loading status...</div>
            ) : statusError ? (
              <div className="text-red-600">Status check failed: {String(statusError)}</div>
            ) : battuStatus?.success ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-600 font-medium capitalize">{battuStatus.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-600">Active Sessions</div>
                    <div className="font-semibold">{battuStatus.activeSessions}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Patterns Found</div>
                    <div className="font-semibold">{battuStatus.discoveredPatterns}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Active Trades</div>
                    <div className="font-semibold">{battuStatus.activeTrades}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">System</div>
                    <div className="font-semibold">{battuStatus.system}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(battuStatus.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-red-600">Scanner Offline</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scanner Architecture */}
      {battuTest?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Scanner Architecture</CardTitle>
            <CardDescription>
              Core BATTU Scanner components and workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Workflow Overview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Scanner Workflow Process</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="bg-blue-200 px-3 py-1 rounded">Loop Symbols</span>
                  <span className="text-blue-600">→</span>
                  <span className="bg-green-200 px-3 py-1 rounded">Find Valid Trades</span>
                  <span className="text-blue-600">→</span>
                  <span className="bg-yellow-200 px-3 py-1 rounded">Record Patterns</span>
                  <span className="text-blue-600">→</span>
                  <span className="bg-orange-200 px-3 py-1 rounded">Execute Trades Later</span>
                  <span className="text-blue-600">→</span>
                  <span className="bg-purple-200 px-3 py-1 rounded">Scan Until Market Close</span>
                </div>
              </div>

              {/* Engine Components */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Active Scanner Engines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {battuTest.scanner.engines.map((engine: string, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm font-medium text-gray-900">{engine}</div>
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Database Status */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Database Status</h3>
                <div className="text-sm text-gray-700">
                  <div><strong>Connected:</strong> {battuTest.database.connected ? 'Yes' : 'No'}</div>
                  <div><strong>Total Symbols:</strong> {battuTest.database.symbols}</div>
                  <div><strong>Sample Symbols:</strong> {battuTest.database.symbolsList?.join(', ')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            BATTU Scanner implementation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Automated symbol scanning</li>
                  <li>Pattern detection and recording</li>
                  <li>Database persistence</li>
                  <li>Trade execution engine</li>
                  <li>Continuous market monitoring</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">API Endpoints</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><code>/api/battu/test</code> - System validation</li>
                  <li><code>/api/battu/status</code> - Scanner status</li>
                  <li>Database tables - Symbols, patterns, trades</li>
                  <li>Real-time monitoring capabilities</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </TabsContent>
      
      <TabsContent value="symbols">
        <SymbolDataPicker />
      </TabsContent>
    </Tabs>
  );
}