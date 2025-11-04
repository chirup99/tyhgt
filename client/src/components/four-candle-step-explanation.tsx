import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Target, TrendingUp, TrendingDown, Clock, Calculator, AlertTriangle } from 'lucide-react';

interface StepExplanationProps {
  analysisData?: any;
}

const FourCandleStepExplanation: React.FC<StepExplanationProps> = ({ analysisData }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Data Collection & Candle Formation",
      description: "Collect 4 consecutive candles with complete OHLC data",
      icon: <Target className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="text-sm">
            <strong>July 25th NIFTY Example:</strong> 4 × 10min candles (9:15-9:55 AM)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <strong>C1A (9:15-9:25):</strong><br/>
              O:24994.85, H:24994.85<br/>
              L:24907.6, C:24932.85
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <strong>C1B (9:25-9:35):</strong><br/>
              O:24931.6, H:24993.85<br/>
              L:24924.35, C:24950.0
            </div>
            <div className="bg-green-50 p-2 rounded">
              <strong>C2A (9:35-9:45):</strong><br/>
              O:24950.15, H:24978.75<br/>
              L:24924.6, C:24926.35
            </div>
            <div className="bg-green-50 p-2 rounded">
              <strong>C2B (9:45-9:55):</strong><br/>
              O:24922.6, H:24943.35<br/>
              L:24912.7, C:24903.3
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Point A & Point B Detection",
      description: "Find exact timestamps where price extremes occurred using 1-minute precision",
      icon: <Target className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="font-medium text-yellow-800 mb-2">C1 Block Analysis</div>
            <div className="text-sm space-y-1">
              <div>C1 High: 24994.85 (C1A) at <strong>09:15:00 AM</strong></div>
              <div>C1 Low: 24907.6 (C1A) at <strong>09:22:00 AM</strong></div>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <div className="font-medium text-green-800 mb-2">C2 Block Analysis</div>
            <div className="text-sm space-y-1">
              <div>C2 High: 24978.75 (C2A) at <strong>09:38:00 AM</strong></div>
              <div>C2 Low: 24912.7 (C2B) at <strong>09:49:00 AM</strong></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium text-blue-800">Uptrend (1-3)</div>
              <div className="text-xs">Point A: 24907.6 @ 09:22</div>
              <div className="text-xs">Point B: 24978.75 @ 09:38</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-medium text-red-800">Downtrend (1-4)</div>
              <div className="text-xs">Point A: 24994.85 @ 09:15</div>
              <div className="text-xs">Point B: 24912.7 @ 09:49</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Slope Calculation & Pattern Classification",
      description: "Calculate mathematical slopes and determine dominant trend",
      icon: <Calculator className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <div className="font-medium text-green-700 mb-2">Uptrend Slope (1-3 Pattern)</div>
            <div className="text-sm space-y-1">
              <div>Price Difference: 24978.75 - 24907.6 = <strong>71.15 points</strong></div>
              <div>Time Difference: 09:38 - 09:22 = <strong>16 minutes</strong></div>
              <div>Slope: 71.15 ÷ 16 = <strong className="text-green-600">+4.446875 pts/min</strong></div>
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <div className="font-medium text-red-700 mb-2">Downtrend Slope (1-4 Pattern)</div>
            <div className="text-sm space-y-1">
              <div>Price Difference: 24912.7 - 24994.85 = <strong>-82.15 points</strong></div>
              <div>Time Difference: 09:49 - 09:15 = <strong>34 minutes</strong></div>
              <div>Slope: -82.15 ÷ 34 = <strong className="text-red-600">-2.416176 pts/min</strong></div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-800">Dominant Trend Selection</div>
            <div className="text-sm">
              Uptrend Strength: |4.446875| = 4.446875<br/>
              Downtrend Strength: |2.416176| = 2.416176<br/>
              <Badge className="mt-1 bg-green-600">UPTREND SELECTED (Stronger Slope)</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Breakout Level & Target Calculation",
      description: "Set breakout trigger level and calculate precise targets",
      icon: <TrendingUp className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="bg-orange-50 p-3 rounded border border-orange-200">
            <div className="font-medium text-orange-800 mb-2">Breakout Level (1-3 Uptrend)</div>
            <div className="text-sm">
              Breakout Level = Point B Price = <strong>24978.75</strong><br/>
              Trigger: Price must break <strong>ABOVE</strong> 24978.75
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="font-medium text-green-700 mb-2">5th Candle Target</div>
              <div className="text-xs space-y-1">
                <div>Duration: 09:38 → 10:05 = 27 min</div>
                <div>Projected: 4.446875 × 27 = 120.06</div>
                <div>Target: 24978.75 + 120.06 = <strong>25098.81</strong></div>
                <div>80% Exit: 24978.75 + 96.05 = <strong>25074.80</strong></div>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="font-medium text-blue-700 mb-2">6th Candle Target</div>
              <div className="text-xs space-y-1">
                <div>Duration: 09:38 → 10:15 = 37 min</div>
                <div>Projected: 4.446875 × 37 = 164.53</div>
                <div>Target: 24978.75 + 164.53 = <strong>25143.28</strong></div>
                <div>80% Exit: 24978.75 + 131.62 = <strong>25110.37</strong></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Dual Timing Validation Rules",
      description: "Validate timing requirements before trade authorization",
      icon: <Clock className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <div className="font-medium text-red-700 mb-2">Rule 1: 50% Duration Rule</div>
            <div className="text-sm space-y-1">
              <div>Point A→B Duration: <strong>16 minutes</strong></div>
              <div>Total 4-Candle Duration: <strong>40 minutes</strong></div>
              <div>Required: 50% of 40 min = <strong>20 minutes</strong></div>
              <div>Result: 16 min &lt; 20 min = <Badge variant="destructive">FAIL (40%)</Badge></div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="font-medium text-yellow-700 mb-2">Rule 2: 34% Wait Rule</div>
            <div className="text-sm space-y-1">
              <div>Point A→B Duration: <strong>16 minutes</strong></div>
              <div>Required Wait: 34% of 16 min = <strong>5.44 minutes</strong></div>
              <div>Status: <Badge variant="outline">DYNAMIC (depends on breakout timing)</Badge></div>
              <div className="text-xs text-yellow-600 mt-1">
                Must wait ≥5.44 min from Point B (09:38) before valid breakout
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Trade Decision & Order Placement",
      description: "Final trade authorization and automatic order logic",
      icon: <AlertTriangle className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <div className="font-medium text-red-700 mb-2">Current Trade Status</div>
            <div className="text-sm space-y-1">
              <div>Rule 1 (50%): <Badge variant="destructive">FAIL</Badge></div>
              <div>Rule 2 (34%): <Badge variant="outline">PENDING</Badge></div>
              <div>Trade Authorization: <Badge variant="destructive">NOT AUTHORIZED</Badge></div>
              <div className="text-xs text-red-600 mt-1">
                Insufficient Point A→B duration (40% vs 50% required)
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-700 mb-2">Automatic SL Order Logic</div>
            <div className="text-sm space-y-1">
              <div><strong>IF</strong> no breakout in 5th & 6th candles:</div>
              <div className="ml-3">→ Place SL order at 34% timing (09:43:26)</div>
              <div><strong>IF</strong> breakout detected:</div>
              <div className="ml-3">→ Cancel timer, manual decision required</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const formatPrice = (price: number) => {
    return price?.toFixed(2) || '0.00';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          4-Candle Rule: Step-by-Step Process
        </CardTitle>
        <CardDescription>
          Complete walkthrough using July 25th NIFTY data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    idx === currentStep
                      ? 'bg-blue-600'
                      : idx < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Current step content */}
          <div className="min-h-[400px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {steps[currentStep].icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{steps[currentStep].title}</h3>
                <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              {steps[currentStep].content}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick reference summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-medium text-blue-800 mb-2">July 25th NIFTY Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Pattern</div>
                <div className="font-medium">1-3 Uptrend</div>
              </div>
              <div>
                <div className="text-gray-600">Slope</div>
                <div className="font-medium">+4.45 pts/min</div>
              </div>
              <div>
                <div className="text-gray-600">Breakout</div>
                <div className="font-medium">24978.75</div>
              </div>
              <div>
                <div className="text-gray-600">5th Target</div>
                <div className="font-medium">25098.81</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FourCandleStepExplanation;