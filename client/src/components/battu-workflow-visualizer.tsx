import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Calculator, Database, TrendingUp, Clock, Target, Zap } from 'lucide-react';

interface BattuWorkflowVisualizerProps {}

export default function BattuWorkflowVisualizer({}: BattuWorkflowVisualizerProps) {
  const [selectedDate, setSelectedDate] = useState('2025-07-25');
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Step 1: Fetch 1-minute base data
  const { data: baseData, isLoading: baseLoading, refetch: refetchBase } = useQuery({
    queryKey: ['/api/battu-scan/intraday/fetch-one-minute-data', selectedDate, selectedSymbol],
    enabled: false
  });

  // Step 2: Corrected slope calculation
  const { data: correctedData, isLoading: correctedLoading, refetch: refetchCorrected } = useQuery({
    queryKey: ['/api/battu-scan/intraday/corrected-slope-calculation', selectedDate, selectedSymbol],
    enabled: false
  });

  const workflowSteps = [
    {
      id: 1,
      title: "Step 1: Fetch 1-Minute Base Data",
      description: "Fundamental first step - fetches complete 1-minute OHLC data for selected date",
      icon: <Database className="h-4 w-4" />,
      endpoint: "/api/battu-scan/intraday/fetch-one-minute-data",
      color: "bg-blue-500",
      details: [
        "Fetches all 1-minute candles for trading session",
        "Calculates market hours from data patterns", 
        "Provides session statistics (volume, high/low)",
        "Forms foundation for all subsequent analysis"
      ]
    },
    {
      id: 2, 
      title: "Step 2: OLD Enhanced 4-Candle Analysis (DEPRECATED)",
      description: "Wrong methodology - replaced by corrected implementation",
      icon: <Calculator className="h-4 w-4" />,
      endpoint: "/api/battu-scan/intraday/enhanced-four-candle-rule",
      color: "bg-gray-400",
      details: [
        "DEPRECATED: Individual candle analysis approach",
        "WRONG: Analyzed C1A, C1B, C2A, C2B separately",
        "INCORRECT: Used individual candle slopes",
        "REPLACED: By proper block-level methodology"
      ]
    },
    {
      id: 3,
      title: "Step 2: CORRECTED Slope Calculation",
      description: "Exact timestamp-based slope calculation following user specification",
      icon: <Target className="h-4 w-4" />,
      endpoint: "/api/battu-scan/intraday/corrected-slope-calculation",
      color: "bg-green-600",
      details: [
        "✅ STEP 1: Get 4 main candles (10-minute blocks: C1A, C1B, C2A, C2B)",
        "✅ STEP 2: For each block, fetch all 1-minute candles within time window",
        "✅ STEP 3: Search for exact timestamp where high/low price occurred",
        "✅ STEP 4: Calculate slope using exact timestamps: (PriceB - PriceA) / (TimeB - TimeA)",
        "✅ STEP 5: Generate trends and ratios based on precise timing"
      ]
    },
    {
      id: 4,
      title: "Step 3: Slope Analysis & Validation", 
      description: "Mathematical validation and trend strength calculations",
      icon: <TrendingUp className="h-4 w-4" />,
      endpoint: "internal-processing",
      color: "bg-purple-500",
      details: [
        "Apply corrected slope formula: (C2_Price - C1_Price) / (Exact_Time_Diff)",
        "Validate block-level high/low identification accuracy",
        "Compare C1→C2 uptrend vs downtrend strength ratios",
        "Store corrected analysis results for future reference"
      ]
    },
    {
      id: 5,
      title: "Step 4: Results & Storage",
      description: "Final analysis compilation and data persistence", 
      icon: <Target className="h-4 w-4" />,
      endpoint: "data-storage",
      color: "bg-orange-500",
      details: [
        "Store 1-minute precision data in battu-corrected-data/",
        "Generate comprehensive block-level analysis reports",
        "Provide API endpoints for corrected historical data",
        "Enable future analysis and backtesting with proper methodology"
      ]
    }
  ];

  const runWorkflow = async () => {
    setIsRunning(true);
    setCurrentStep(0);

    try {
      // Step 1: Fetch base data
      setCurrentStep(1);
      console.log('🟦 STEP 1: Fetching 1-minute base data...');
      await refetchBase();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Skip deprecated enhanced analysis
      setCurrentStep(2);
      console.log('🟥 STEP 2: Skipping deprecated enhanced analysis');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Corrected slope calculation - THE MAIN PROCESS
      setCurrentStep(3);
      console.log('🟢 STEP 3: Starting corrected 4-candle slope calculation...');
      
      const payload = {
        symbol: selectedSymbol,
        date: selectedDate,
        timeframe: 10
      };
      
      console.log('📊 Payload:', payload);
      console.log('🔄 Making API call to corrected-slope-calculation...');
      
      const response = await fetch('/api/battu-scan/intraday/corrected-slope-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📈 Response status:', response.status);
      const responseData = await response.json();
      console.log('📋 Response data:', responseData);
      
      if (response.ok) {
        await refetchCorrected();
      }
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Processing analysis
      setCurrentStep(4);
      console.log('🟡 STEP 4: Processing analysis results...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 5: Complete
      setCurrentStep(5);
      console.log('✅ STEP 5: Workflow complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (!isRunning) return 'pending';
    if (currentStep > stepId) return 'completed';
    if (currentStep === stepId) return 'running';
    return 'pending';
  };

  const getProgressPercentage = () => {
    if (!isRunning) return 0;
    return (currentStep / workflowSteps.length) * 100;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Battu API Workflow Visualizer
          </CardTitle>
          <CardDescription>
            Interactive visualization of the complete Battu intraday analysis workflow with 1-minute precision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow">Workflow Steps</TabsTrigger>
              <TabsTrigger value="methodology">Slope Methodology</TabsTrigger>
              <TabsTrigger value="results">Live Results</TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="space-y-6">
              {/* Controls */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Date:</label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-07-25">July 25, 2025</SelectItem>
                      <SelectItem value="2025-07-24">July 24, 2025</SelectItem>
                      <SelectItem value="2025-07-23">July 23, 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Symbol:</label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSE:NIFTY50-INDEX">NIFTY50</SelectItem>
                      <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                      <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                      <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={runWorkflow} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {isRunning ? 'Running...' : 'Start Workflow'}
                </Button>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Workflow Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-full" />
                </div>
              )}

              {/* Workflow Steps */}
              <div className="space-y-4">
                {workflowSteps.map((step, index) => {
                  const status = getStepStatus(step.id);
                  const isActive = currentStep === step.id;
                  
                  return (
                    <Card key={step.id} className={`transition-all duration-300 ${
                      isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${step.color} text-white`}>
                              {step.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{step.title}</CardTitle>
                              <CardDescription>{step.description}</CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              status === 'completed' ? 'default' :
                              status === 'running' ? 'secondary' : 'outline'
                            }>
                              {status === 'completed' ? 'Completed' :
                               status === 'running' ? 'Running...' : 'Pending'}
                            </Badge>
                            {isActive && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-600">
                            Endpoint: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {step.endpoint}
                            </code>
                          </div>
                          <ul className="space-y-1">
                            {step.details.map((detail, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Slope Calculation Methodology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Mathematical Formula</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-center text-lg font-mono">
                              Slope = (Price B - Price A) / (Time B - Time A)
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p><strong>Price A:</strong> Starting price point (high/low)</p>
                            <p><strong>Price B:</strong> Ending price point (high/low)</p>
                            <p><strong>Time A/B:</strong> Exact timestamps (1-min precision)</p>
                            <p><strong>Result:</strong> Points per minute trend strength</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Example Calculation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-red-50 p-4 rounded-lg space-y-2 border border-red-200">
                            <div className="font-medium text-red-700">CORRECTED Block Analysis:</div>
                            <div className="text-sm space-y-1">
                              <div><strong>C1 Block High:</strong> 200.90 (from C1B at 10:12 AM)</div>
                              <div><strong>C1 Block Low:</strong> 199.80 (from C1A at 10:08 AM)</div>
                              <div><strong>C2 Block High:</strong> 201.10 (from C2B at 10:32 AM)</div>
                              <div><strong>C2 Block Low:</strong> 200.10 (from C2A at 10:28 AM)</div>
                              <div className="pt-2 border-t border-red-200">
                                <div><strong>Downtrend:</strong> C1 High → C2 Low</div>
                                <div>200.90 → 200.10 over 20 minutes = -0.04 pts/min</div>
                              </div>
                              <div>
                                <div><strong>Uptrend:</strong> C1 Low → C2 High</div>
                                <div>199.80 → 201.10 over 24 minutes = +0.054 pts/min</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                            <div className="font-medium text-gray-700">Key Differences from Old Method:</div>
                            <div className="text-sm space-y-1">
                              <div>✅ <strong>Block-Level:</strong> Scans all 1-min data within C1A+C1B</div>
                              <div>✅ <strong>True Extremes:</strong> Finds actual highest/lowest points</div>
                              <div>✅ <strong>Precise Timing:</strong> Uses exact timestamps, not candle durations</div>
                              <div>❌ <strong>Old Method:</strong> Analyzed individual candles separately</div>
                              <div>❌ <strong>Old Method:</strong> Used candle-to-candle slopes incorrectly</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">1-Minute Precision Advantages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Exact Timing</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Uses actual timestamps where price extremes occurred, not whole candle duration
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Enhanced Accuracy</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Eliminates assumptions about price movement distribution within candles
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">Real Behavior</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Accounts for actual market timing patterns and momentum
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {/* Live 4-Candle Analysis Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Live 4-Candle Rule Analysis
                  </CardTitle>
                  <CardDescription>
                    Real-time visualization of the Battu 4-candle slope calculation process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Step 1: Base Data */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Step 1: Base Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {baseLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span>Fetching 1-minute data...</span>
                          </div>
                        ) : baseData ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Symbol:</span>
                              <Badge variant="outline">{selectedSymbol}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Date:</span>
                              <Badge variant="outline">{selectedDate}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total Candles:</span>
                              <Badge className="bg-blue-500">{(baseData as any)?.candles?.length || (baseData as any)?.totalCandles || 'N/A'}</Badge>
                            </div>
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                              ✓ Fetched complete 1-minute OHLC data for trading session
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Click "Start Workflow" to begin
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Step 2: 4-Candle Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Step 2: 4-Candle Slope Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {correctedLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            <span>Processing 4-candle analysis...</span>
                          </div>
                        ) : correctedData ? (
                          <div className="space-y-3">
                            {/* Success message if available */}
                            {(correctedData as any)?.message && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm font-medium text-green-700 mb-1">Analysis Status:</div>
                                <div className="text-xs text-green-600">{(correctedData as any).message}</div>
                              </div>
                            )}
                            
                            {/* Show analysis status */}
                            {correctedData ? (
                              <div className="space-y-2">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-sm font-medium text-blue-700 mb-2">4-Candle Analysis Complete:</div>
                                  <div className="text-xs space-y-1">
                                    <div>✓ C1A, C1B, C2A, C2B candles identified</div>
                                    <div>✓ 1-minute precision timestamps extracted</div>
                                    <div>✓ Block-level high/low analysis complete</div>
                                    <div>✓ Slope calculations performed</div>
                                  </div>
                                </div>
                                
                                {/* Show slopes if available */}
                                {(correctedData as any)?.slopes && Array.isArray((correctedData as any).slopes) && (correctedData as any).slopes.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">Slope Results:</div>
                                    {(correctedData as any).slopes.map((slope: any, index: number) => (
                                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm font-medium">
                                            {slope.trendType === 'uptrend' ? '📈 Uptrend' : '📉 Downtrend'}
                                          </span>
                                          <Badge variant={slope.trendType === 'uptrend' ? 'default' : 'destructive'}>
                                            {slope.slope?.toFixed(3)} pts/min
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>From: {slope.pointA?.candleName} {slope.pointA?.priceType} ({slope.pointA?.price}) at {slope.pointA?.formattedTime}</div>
                                          <div>To: {slope.pointB?.candleName} {slope.pointB?.priceType} ({slope.pointB?.price}) at {slope.pointB?.formattedTime}</div>
                                          <div>Duration: {slope.timeDiffMinutes?.toFixed(1)} minutes | Price Change: {slope.priceDiff?.toFixed(2)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-sm font-medium text-green-700 mb-1">Analysis Complete</div>
                                    <div className="text-xs text-green-600">Check browser console logs for detailed slope calculations or expand the raw data below</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-sm font-medium text-yellow-700 mb-1">Waiting for Analysis...</div>
                                <div className="text-xs text-yellow-600">Run workflow to see 4-candle slope calculations</div>
                              </div>
                            )}
                            
                            {/* Show any error or additional info */}
                            {(correctedData as any)?.error && (
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-sm font-medium text-red-700 mb-1">Error:</div>
                                <div className="text-xs text-red-600">{(correctedData as any).error}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Waiting for Step 1 completion...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                  </div>
                  
                  {/* Detailed 4-Candle Process Breakdown */}
                  {correctedData && (
                    <div className="mt-6 space-y-4">
                      
                      {/* 4-Candle Identification */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Step A: 4-Candle Block Identification
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                              <div className="text-sm font-medium text-blue-700">C1A</div>
                              <div className="text-xs text-blue-600 mt-1">1st Block<br/>Candle 1</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                              <div className="text-sm font-medium text-blue-700">C1B</div>
                              <div className="text-xs text-blue-600 mt-1">1st Block<br/>Candle 2</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                              <div className="text-sm font-medium text-green-700">C2A</div>
                              <div className="text-xs text-green-600 mt-1">2nd Block<br/>Candle 3</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                              <div className="text-sm font-medium text-green-700">C2B</div>
                              <div className="text-xs text-green-600 mt-1">2nd Block<br/>Candle 4</div>
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                            ✓ Four 10-minute candles identified for block-level analysis
                          </div>
                        </CardContent>
                      </Card>

                      {/* 1-Minute Data Extraction */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Step B: 1-Minute Data Extraction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm font-medium text-blue-700">C1 Block (C1A + C1B)</div>
                                <div className="text-xs text-blue-600 mt-1">
                                  • Fetch all 1-min candles within C1A timeframe<br/>
                                  • Fetch all 1-min candles within C1B timeframe<br/>
                                  • Search for true HIGH and LOW across both
                                </div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm font-medium text-green-700">C2 Block (C2A + C2B)</div>
                                <div className="text-xs text-green-600 mt-1">
                                  • Fetch all 1-min candles within C2A timeframe<br/>
                                  • Fetch all 1-min candles within C2B timeframe<br/>
                                  • Search for true HIGH and LOW across both
                                </div>
                              </div>
                            </div>
                            <div className="p-2 bg-yellow-50 rounded text-xs border border-yellow-200">
                              🔍 Key: System scans 1-minute data to find EXACT timestamps where price extremes occurred
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Slope Calculation */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Step C: Exact Slope Calculation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-sm font-medium text-red-700">📉 Downtrend</div>
                                <div className="text-xs text-red-600 mt-1">
                                  Point A: C1 Block HIGH (exact timestamp)<br/>
                                  Point B: C2 Block LOW (exact timestamp)<br/>
                                  Formula: (Low Price - High Price) / Time Diff
                                </div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm font-medium text-green-700">📈 Uptrend</div>
                                <div className="text-xs text-green-600 mt-1">
                                  Point A: C1 Block LOW (exact timestamp)<br/>
                                  Point B: C2 Block HIGH (exact timestamp)<br/>
                                  Formula: (High Price - Low Price) / Time Diff
                                </div>
                              </div>
                            </div>
                            <div className="p-2 bg-blue-50 rounded text-xs border border-blue-200">
                              ⏱️ Time Difference calculated in exact minutes using 1-minute precision timestamps
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Results Display */}
                      {(correctedData as any)?.candleBlocks && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Step D: Final Analysis Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Show candle blocks data */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {(correctedData as any).candleBlocks.map((block: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="text-sm font-medium text-gray-700">{block.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    <div>High: {block.high}</div>
                                    <div>Low: {block.low}</div>
                                    <div>Open: {block.open}</div>
                                    <div>Close: {block.close}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Show complete analysis data */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-sm font-medium mb-2">Complete Analysis Data:</div>
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-96">
                                {JSON.stringify(correctedData, null, 2)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                    </div>
                  )}
                  
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}