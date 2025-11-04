import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  TrendingUp, 
  Target, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3
} from "lucide-react";

interface BattuDocumentationDisplayProps {
  className?: string;
}

export function BattuDocumentationDisplay({ className }: BattuDocumentationDisplayProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'setup', title: 'Initial Setup', icon: Clock },
    { id: 'blocks', title: 'Block Structure', icon: BarChart3 },
    { id: 'patterns', title: 'Pattern Recognition', icon: TrendingUp },
    { id: 'timing', title: 'Timing Rules', icon: Target },
    { id: 'trading', title: 'Trading Rules', icon: Shield },
    { id: 'advanced', title: 'Advanced Features', icon: Zap },
    { id: 'workflow', title: 'Complete Workflow', icon: ArrowRight }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6" />
            Battu API Complete Documentation
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Comprehensive guide to the Battu API trading analysis system with corrected block methodology
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              <section.icon className="h-3 w-3 mr-1" />
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Section */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">Core Purpose</h3>
                <p className="text-indigo-700">
                  The Battu API is a sophisticated trading analysis system that predicts future candles using pattern recognition and slope calculations. 
                  It follows a continuous backtesting methodology from market open to close.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Real-Time Analysis</h4>
                  <p className="text-green-700 text-sm">Live market data streaming with authentic Fyers API integration</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Pattern Detection</h4>
                  <p className="text-blue-700 text-sm">Advanced pattern recognition for uptrend and downtrend identification</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Automated Trading</h4>
                  <p className="text-purple-700 text-sm">Complete trading rules with stop loss, targets, and exit strategies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initial Setup Section */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Initial Setup - CORRECTED METHODOLOGY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-red-900">Critical Correction Applied</h3>
                </div>
                <p className="text-red-700">
                  Initial blocks are <strong>2 candles each</strong>, not 4 candles each as previously documented.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50">Step 1</Badge>
                  <span>Start with 5-minute candles from market open (9:15 AM IST)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50">Step 2</Badge>
                  <span>Wait for 4 complete candles</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50">Step 3</Badge>
                  <span>Create initial C1 and C2 blocks</span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Corrected Block Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-green-800">C1 Block</h4>
                    <p className="text-sm text-green-700">C1a + C1b = 2 candles total</p>
                    <p className="text-xs text-green-600">(1st and 2nd candles)</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-green-800">C2 Block</h4>
                    <p className="text-sm text-green-700">C2a + C2b = 2 candles total</p>
                    <p className="text-xs text-green-600">(3rd and 4th candles)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Block Structure Section */}
        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Block Structure Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">C1 Block Analysis</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">C1a:</span>
                        <span>1st candle (index 0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">C1b:</span>
                        <span>2nd candle (index 1)</span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mt-3">
                      <strong>Purpose:</strong> Find extreme points for slope calculation from first 2 candles
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">C2 Block Analysis</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">C2a:</span>
                        <span>3rd candle (index 2)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">C2b:</span>
                        <span>4th candle (index 3)</span>
                      </div>
                    </div>
                    <p className="text-sm text-purple-700 mt-3">
                      <strong>Purpose:</strong> Determine breakout levels and trendlines from next 2 candles
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">C3 Block Prediction</h3>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Target:</strong> Next set of candles after C1+C2</li>
                  <li>• <strong>Validation:</strong> Compare predicted vs actual C3 values</li>
                  <li>• <strong>Size:</strong> C3 block size matches the smaller of C1 or C2</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pattern Recognition Section */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Pattern Recognition Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    pattern: "1-3 Pattern",
                    description: "Point A from C1a → Point B from C2a",
                    breakout: "Breakout at C2a level",
                    color: "green"
                  },
                  {
                    pattern: "1-4 Pattern", 
                    description: "Point A from C1a → Point B from C2b",
                    breakout: "Breakout at C2b level",
                    color: "blue"
                  },
                  {
                    pattern: "2-3 Pattern",
                    description: "Point A from C1b → Point B from C2b (High Risk - Special Case)",
                    breakout: "Breakout at C2a level ONLY (Special Exception)",
                    color: "red"
                  },
                  {
                    pattern: "2-4 Pattern",
                    description: "Point A from C1b → Point B from C2b", 
                    breakout: "Breakout at C2b level",
                    color: "purple"
                  }
                ].map((item, index) => (
                  <div key={index} className={`bg-${item.color}-50 p-4 rounded-lg border`}>
                    <h4 className={`font-semibold text-${item.color}-900 mb-2`}>{item.pattern}</h4>
                    <p className={`text-sm text-${item.color}-700 mb-2`}>{item.description}</p>
                    <p className={`text-xs text-${item.color}-600`}>{item.breakout}</p>
                    {item.pattern === "2-3 Pattern" && (
                      <Badge variant="destructive" className="mt-2 text-xs">High Risk</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-2">Point A & Point B Methodology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-yellow-800">Point A (Starting Point)</h4>
                    <p className="text-yellow-700">Lowest low from C1 block (uptrend) or Highest high from C1 block (downtrend)</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800">Point B (Ending Point)</h4>
                    <p className="text-yellow-700">Highest high from C2 block (uptrend) or Lowest low from C2 block (downtrend)</p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-100 rounded">
                  <code className="text-sm">Slope = (Price B - Price A) / (Time B - Time A in minutes)</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timing Rules Section */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Timing Validation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Rule 1: 50% Validation</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Point A → Point B duration ≥ 50% of total 4-candle duration
                  </p>
                  <div className="bg-white p-2 rounded">
                    <code className="text-xs">(Point B time - Point A time) ≥ 0.5 × (Total 4-candle duration)</code>
                  </div>
                  <p className="text-xs text-red-600 mt-2">Ensures sufficient trend development time</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Rule 2: 34% Validation</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Point B → Trigger duration ≥ 34% of Point A → Point B duration
                  </p>
                  <div className="bg-white p-2 rounded">
                    <code className="text-xs">(Trigger time - Point B time) ≥ 0.34 × (Point B time - Point A time)</code>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Confirms adequate confirmation time before entry</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Individual Candle Validation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span><strong>5th Candle:</strong> Must satisfy both breakout AND timing rules independently</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span><strong>6th Candle:</strong> Must satisfy both breakout AND timing rules independently</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span><strong>Trade Validity:</strong> Valid when ANY candle (5th OR 6th) meets BOTH conditions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Rules Section */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Trading Rules & Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Stop Loss Rules</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">5th Candle Trigger:</span>
                      <p className="text-green-700">Stop Loss = 4th candle low (uptrend) or high (downtrend)</p>
                    </div>
                    <div>
                      <span className="font-medium">6th Candle Trigger:</span>
                      <p className="text-green-700">Stop Loss = 5th candle low (uptrend) or high (downtrend)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Target Calculation</h3>
                  <div className="bg-white p-2 rounded mb-2">
                    <code className="text-xs">Target = Breakout Price + (Slope × Duration from Point B)</code>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• <strong>80% Exit:</strong> At 80% of projected target</div>
                    <div>• <strong>Emergency Exit:</strong> At 98% of candle close</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">15-Minute Invalidation Rule</h3>
                <div className="space-y-2 text-sm text-red-700">
                  <div>• <strong>Trigger:</strong> If 5th candle breaks trigger before timing rules pass</div>
                  <div>• <strong>Penalty:</strong> Pattern invalid for 15 minutes from early breakout</div>
                  <div>• <strong>Recovery:</strong> Pattern becomes valid again after 15-minute penalty expires</div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Order Placement Logic</h3>
                <div className="space-y-2 text-sm text-purple-700">
                  <div>• <strong>Automatic SL:</strong> Only when NO breakout occurs in 5th AND 6th candles</div>
                  <div>• <strong>Manual Orders:</strong> Required when breakout detected in either candle</div>
                  <div>• <strong>Timing:</strong> At 34% of Point A→B duration from Point B</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Features Section */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">T-Rule</h3>
                  <p className="text-sm text-yellow-700 mb-2">6th Candle Prediction Method</p>
                  <div className="space-y-1 text-xs text-yellow-600">
                    <div>• Input: C2 block + C3a candles</div>
                    <div>• Method: Apply Step 2 methods</div>
                    <div>• Output: Complete 6th candle prediction</div>
                  </div>
                </div>

                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-cyan-900 mb-2">Mini 4-Rule</h3>
                  <p className="text-sm text-cyan-700 mb-2">C3a Prediction Method</p>
                  <div className="space-y-1 text-xs text-cyan-600">
                    <div>• Input: C2 block (4 candles)</div>
                    <div>• Method: Predict C3a (2 candles)</div>
                    <div>• Output: C3a prediction with momentum</div>
                  </div>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-pink-900 mb-2">Progressive Doubling</h3>
                  <p className="text-sm text-pink-700 mb-2">Timeframe Enhancement</p>
                  <div className="space-y-1 text-xs text-pink-600">
                    <div>• Trigger: {'>'}6 candles detected</div>
                    <div>• Action: Double timeframe</div>
                    <div>• Limit: Maximum 80 minutes</div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-3">Continuous Backtest Methodology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-indigo-800 mb-2">Equal Count Scenario</h4>
                    <div className="bg-white p-2 rounded text-xs">
                      <code>If count(C1) = count(C2):</code><br/>
                      <code>• Merge: C1 + C2 → new C1</code><br/>
                      <code>• Assign: C3 → new C2</code>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo-800 mb-2">Unequal Count Scenario</h4>
                    <div className="bg-white p-2 rounded text-xs">
                      <code>If count(C1) ≠ count(C2):</code><br/>
                      <code>• Keep: C1 remains same</code><br/>
                      <code>• Merge: C2 + C3 → new C2</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complete Workflow Section */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-green-500" />
                Complete Workflow Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">7-Step Battu API Process</h3>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Market Open", desc: "Start with 5-minute candles from 9:15 AM" },
                    { step: 2, title: "Block Formation", desc: "Create C1(2) + C2(2) blocks from first 4 candles" },
                    { step: 3, title: "Battu Analysis", desc: "Apply all rules to predict C3 block" },
                    { step: 4, title: "Validation", desc: "Compare prediction vs actual market reality" },
                    { step: 5, title: "Merging Logic", desc: "Apply count-based merging rules" },
                    { step: 6, title: "Cycle Repeat", desc: "Continue cycles until market close" },
                    { step: 7, title: "Final Output", desc: "Complete trading session analysis report" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-white">{item.step}</Badge>
                      <div>
                        <span className="font-medium">{item.title}:</span>
                        <span className="text-gray-600 ml-2">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Quality Assurance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-800">Data Integrity</h4>
                    <p className="text-gray-600">Only authentic Fyers API data, no fallback</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Error Handling</h4>
                    <p className="text-gray-600">Comprehensive validation and recovery</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Performance</h4>
                    <p className="text-gray-600">Real-time processing with minimal latency</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}