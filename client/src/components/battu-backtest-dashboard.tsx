import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  timeframe: number;
  testType: 'rolling' | 'session' | 'pattern';
  minAccuracy: number;
  enableLogging: boolean;
}

interface BacktestResult {
  totalTests: number;
  successfulPredictions: number;
  accuracyPercentage: number;
  avgPriceError: number;
  avgDirectionAccuracy: number;
  patternPerformance: {
    [key: string]: {
      tested: number;
      successful: number;
      accuracy: number;
    };
  };
  bestPerformingPatterns: string[];
  recommendations: string[];
}

export function BattuBacktestDashboard() {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'NSE:NIFTY50-INDEX',
    startDate: '2025-07-30',
    endDate: '2025-07-30',
    timeframe: 5,
    testType: 'rolling',
    minAccuracy: 70,
    enableLogging: true
  });

  // Get backtesting configuration
  const { data: backtestConfig } = useQuery({
    queryKey: ['/api/backtesting/config'],
    enabled: true
  });

  // Run backtest mutation
  const runBacktestMutation = useMutation({
    mutationFn: (backtestConfig: BacktestConfig) => 
      apiRequest(`/api/backtesting/run`, {
        method: 'POST',
        body: JSON.stringify(backtestConfig),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtesting'] });
    }
  });

  // Quick test mutation
  const quickTestMutation = useMutation({
    mutationFn: ({ symbol, date }: { symbol: string; date: string }) => 
      apiRequest(`/api/backtesting/quick-test?symbol=${symbol}&date=${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtesting'] });
    }
  });

  // Multi-timeframe test mutation
  const multiTimeframeMutation = useMutation({
    mutationFn: (testConfig: any) => 
      apiRequest(`/api/backtesting/multi-timeframe`, {
        method: 'POST',
        body: JSON.stringify(testConfig),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtesting'] });
    }
  });

  // Pattern analysis mutation
  const patternAnalysisMutation = useMutation({
    mutationFn: (analysisConfig: any) => 
      apiRequest(`/api/backtesting/pattern-analysis`, {
        method: 'POST',
        body: JSON.stringify(analysisConfig),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtesting'] });
    }
  });

  const handleConfigChange = (field: keyof BacktestConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleRunBacktest = () => {
    runBacktestMutation.mutate(config);
  };

  const handleQuickTest = () => {
    quickTestMutation.mutate({ symbol: config.symbol, date: config.startDate });
  };

  const handleMultiTimeframe = () => {
    multiTimeframeMutation.mutate({
      symbol: config.symbol,
      date: config.startDate,
      timeframes: [1, 5, 10, 15]
    });
  };

  const handlePatternAnalysis = () => {
    patternAnalysisMutation.mutate({
      symbol: config.symbol,
      startDate: config.startDate,
      endDate: config.endDate,
      timeframe: config.timeframe
    });
  };

  const renderResults = (results: any) => {
    if (!results) return null;

    const isQuickTest = 'summary' in results;
    const actualResults: BacktestResult = isQuickTest ? results.fullResults : results.results;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {actualResults.accuracyPercentage.toFixed(1)}%
              </div>
              <Progress value={actualResults.accuracyPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actualResults.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                {actualResults.successfulPredictions} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Price Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {actualResults.avgPriceError.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Direction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {actualResults.avgDirectionAccuracy.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Pattern Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pattern Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(actualResults.patternPerformance).map(([pattern, data]: [string, any]) => (
                <div key={pattern} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant={data.accuracy >= 75 ? "default" : data.accuracy >= 50 ? "secondary" : "destructive"}>
                      {pattern}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.tested} tests • {data.successful} successful
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{data.accuracy.toFixed(1)}%</div>
                    {data.accuracy >= 75 && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                    {data.accuracy < 50 && <AlertTriangle className="h-4 w-4 text-red-600 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Performing Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actualResults.bestPerformingPatterns.map((pattern, index) => (
                <Badge key={index} variant="default" className="text-sm">
                  {pattern}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actualResults.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ready for Live Trading */}
        <Card className={actualResults.accuracyPercentage >= 75 ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {actualResults.accuracyPercentage >= 75 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  {actualResults.accuracyPercentage >= 75 ? "Ready for Live Trading" : "Needs Optimization"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {actualResults.accuracyPercentage >= 75 
                    ? "System shows high accuracy and can be used for live trading"
                    : "Consider optimizing prediction formulas or pattern detection logic"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Battu Backtest Dashboard</h2>
          <p className="text-muted-foreground">
            Test and validate C3 prediction accuracy with historical data
          </p>
        </div>
      </div>

      <Tabs defaultValue="quick" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick">Quick Test</TabsTrigger>
          <TabsTrigger value="custom">Custom Test</TabsTrigger>
          <TabsTrigger value="timeframe">Multi-Timeframe</TabsTrigger>
          <TabsTrigger value="pattern">Pattern Analysis</TabsTrigger>
        </TabsList>

        {/* Quick Test Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Backtest
              </CardTitle>
              <CardDescription>
                Run a fast validation test with default parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quickSymbol">Symbol</Label>
                  <Select value={config.symbol} onValueChange={(value) => handleConfigChange('symbol', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableSymbols?.map((symbol: string) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quickDate">Date</Label>
                  <Input
                    id="quickDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleQuickTest}
                disabled={quickTestMutation.isPending}
                className="w-full"
              >
                {quickTestMutation.isPending ? "Running Quick Test..." : "Run Quick Test"}
              </Button>
            </CardContent>
          </Card>

          {quickTestMutation.data && renderResults(quickTestMutation.data)}
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Backtest Configuration</CardTitle>
              <CardDescription>
                Configure all parameters for detailed backtesting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select value={config.symbol} onValueChange={(value) => handleConfigChange('symbol', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableSymbols?.map((symbol: string) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe (minutes)</Label>
                  <Select value={config.timeframe.toString()} onValueChange={(value) => handleConfigChange('timeframe', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableTimeframes?.map((tf: number) => (
                        <SelectItem key={tf} value={tf.toString()}>
                          {tf} minute{tf > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={config.endDate}
                    onChange={(e) => handleConfigChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={config.testType} onValueChange={(value: any) => handleConfigChange('testType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rolling">Rolling Window</SelectItem>
                      <SelectItem value="session">Session Based</SelectItem>
                      <SelectItem value="pattern">Pattern Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minAccuracy">Min Accuracy (%)</Label>
                  <Input
                    id="minAccuracy"
                    type="number"
                    min="0"
                    max="100"
                    value={config.minAccuracy}
                    onChange={(e) => handleConfigChange('minAccuracy', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleRunBacktest}
                disabled={runBacktestMutation.isPending}
                className="w-full"
              >
                {runBacktestMutation.isPending ? "Running Backtest..." : "Run Custom Backtest"}
              </Button>
            </CardContent>
          </Card>

          {runBacktestMutation.data && renderResults(runBacktestMutation.data)}
        </TabsContent>

        {/* Multi-Timeframe Tab */}
        <TabsContent value="timeframe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Multi-Timeframe Analysis
              </CardTitle>
              <CardDescription>
                Test accuracy across different timeframes to find optimal settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mtSymbol">Symbol</Label>
                  <Select value={config.symbol} onValueChange={(value) => handleConfigChange('symbol', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableSymbols?.map((symbol: string) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mtDate">Date</Label>
                  <Input
                    id="mtDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleMultiTimeframe}
                disabled={multiTimeframeMutation.isPending}
                className="w-full"
              >
                {multiTimeframeMutation.isPending ? "Testing Timeframes..." : "Run Multi-Timeframe Test"}
              </Button>
            </CardContent>
          </Card>

          {multiTimeframeMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle>Timeframe Comparison Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {multiTimeframeMutation.data.results?.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Badge variant="outline">{result.timeframe} minute{result.timeframe > 1 ? 's' : ''}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.totalTests} tests • {result.successful} successful
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{result.accuracy?.toFixed(1)}%</div>
                        <Progress value={result.accuracy || 0} className="w-20 mt-1" />
                      </div>
                    </div>
                  ))}
                  
                  {multiTimeframeMutation.data.bestTimeframe && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800">Best Performing Timeframe</h4>
                      <p className="text-sm text-green-700">
                        {multiTimeframeMutation.data.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pattern Analysis Tab */}
        <TabsContent value="pattern" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pattern-Specific Analysis
              </CardTitle>
              <CardDescription>
                Deep dive into individual pattern performance and reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paSymbol">Symbol</Label>
                  <Select value={config.symbol} onValueChange={(value) => handleConfigChange('symbol', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableSymbols?.map((symbol: string) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paTimeframe">Timeframe</Label>
                  <Select value={config.timeframe.toString()} onValueChange={(value) => handleConfigChange('timeframe', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backtestConfig?.availableTimeframes?.map((tf: number) => (
                        <SelectItem key={tf} value={tf.toString()}>
                          {tf} minute{tf > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paStartDate">Start Date</Label>
                  <Input
                    id="paStartDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paEndDate">End Date</Label>
                  <Input
                    id="paEndDate"
                    type="date"
                    value={config.endDate}
                    onChange={(e) => handleConfigChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handlePatternAnalysis}
                disabled={patternAnalysisMutation.isPending}
                className="w-full"
              >
                {patternAnalysisMutation.isPending ? "Analyzing Patterns..." : "Run Pattern Analysis"}
              </Button>
            </CardContent>
          </Card>

          {patternAnalysisMutation.data && (
            <div className="space-y-6">
              {renderResults(patternAnalysisMutation.data)}
              
              {patternAnalysisMutation.data.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pattern Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{patternAnalysisMutation.data.insights.totalPatterns}</div>
                        <p className="text-sm text-muted-foreground">Total Patterns</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {patternAnalysisMutation.data.insights.highestAccuracy?.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Highest Accuracy</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {patternAnalysisMutation.data.insights.lowestAccuracy?.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Lowest Accuracy</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {patternAnalysisMutation.data.insights.reliablePatterns?.length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Reliable Patterns</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-800 mb-2">Reliable Patterns (≥75% accuracy)</h4>
                        <div className="flex flex-wrap gap-2">
                          {patternAnalysisMutation.data.insights.reliablePatterns?.map((pattern: string, index: number) => (
                            <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">Risky Patterns (&lt;50% accuracy)</h4>
                        <div className="flex flex-wrap gap-2">
                          {patternAnalysisMutation.data.insights.riskyPatterns?.map((pattern: string, index: number) => (
                            <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {patternAnalysisMutation.data.tradingStrategy && (
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Strategy Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Focus On:</h4>
                        <div className="flex flex-wrap gap-2">
                          {patternAnalysisMutation.data.tradingStrategy.focusOn?.map((pattern: string, index: number) => (
                            <Badge key={index} variant="default">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Avoid:</h4>
                        <div className="flex flex-wrap gap-2">
                          {patternAnalysisMutation.data.tradingStrategy.avoid?.map((pattern: string, index: number) => (
                            <Badge key={index} variant="destructive">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Confidence Threshold:</strong> {patternAnalysisMutation.data.tradingStrategy.confidenceThreshold}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modification Tips */}
      {backtestConfig?.modificationTips && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Easy Modification Tips
            </CardTitle>
            <CardDescription>
              How to modify and improve the backtesting rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backtestConfig.modificationTips.map((tip: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}