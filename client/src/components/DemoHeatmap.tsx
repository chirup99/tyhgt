import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateKey, getHeatmapColor, generateYearHeatmapDays } from "./heatmap-utils";

interface DemoHeatmapProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function DemoHeatmap({ onDateSelect, selectedDate }: DemoHeatmapProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [demoData, setDemoData] = useState<Record<string, any>>({});

  // Load demo data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("demoTradingDataByDate");
    if (stored) {
      setDemoData(JSON.parse(stored));
      console.log("📊 DEMO HEATMAP: Loaded demo data:", Object.keys(JSON.parse(stored)).length, "dates");
    }
  }, []);

  // For demo mode in 2025, start from June since demo data starts from June
  const startMonth = (year === 2025) ? 5 : 0;
  const months = generateYearHeatmapDays(year, startMonth);

  const handlePreviousYear = () => setYear(year - 1);
  const handleNextYear = () => setYear(year + 1);

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Demo Trading Heatmap (Shared)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousYear}
              className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400"
              data-testid="button-demo-prev-year"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
              {year}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextYear}
              className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400"
              data-testid="button-demo-next-year"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {months.map((monthData, monthIndex) => (
              <div key={monthIndex} className="flex flex-col gap-1 min-w-fit">
                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center h-4">
                  {monthData.name}
                </div>
                <div className="flex gap-1">
                  {monthData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((date, dateIndex) => {
                        if (!date) {
                          return (
                            <div
                              key={dateIndex}
                              className="w-3 h-3"
                            ></div>
                          );
                        }

                        const dateStr = formatDateKey(date);
                        const savedData = demoData[dateStr];
                        const netPnL = savedData?.performanceMetrics?.netPnL || 0;

                        const hasActualTradeData =
                          savedData &&
                          ((savedData.tradeHistory && savedData.tradeHistory.length > 0) ||
                            (savedData.performanceMetrics && savedData.performanceMetrics.totalTrades > 0) ||
                            savedData.tradingNotes ||
                            savedData.notesContent);

                        let cellColor = "bg-gray-100 dark:bg-gray-700";
                        if (hasActualTradeData) {
                          cellColor = netPnL !== 0 ? getHeatmapColor(netPnL) : "bg-green-200 dark:bg-green-700";
                        }

                        const isToday = date.toDateString() === new Date().toDateString();
                        if (isToday && !hasActualTradeData) {
                          cellColor = "bg-teal-300 dark:bg-teal-600";
                        }

                        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                        if (isSelected) {
                          cellColor = "bg-blue-600 dark:bg-blue-500 ring-1 ring-blue-400";
                        }

                        return (
                          <div
                            key={dateIndex}
                            className={`
                              w-3 h-3 rounded-sm cursor-pointer transition-all duration-200
                              ${cellColor}
                              hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600
                            `}
                            onClick={() => onDateSelect(date)}
                            title={`${date.toDateString()}${
                              hasActualTradeData ? ` - P&L: ₹${netPnL.toLocaleString("en-IN")}` : ""
                            }`}
                            data-testid={`demo-calendar-day-${date.getDate()}-${date.getMonth()}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* P&L Color Legend */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Loss</span>
              <div className="flex gap-0.5">
                <div className="w-2 h-2 bg-red-800 dark:bg-red-700 rounded-sm" title="High Loss (₹5000+)"></div>
                <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-sm" title="Medium Loss (₹1500+)"></div>
                <div className="w-2 h-2 bg-red-300 dark:bg-red-300 rounded-sm" title="Small Loss"></div>
              </div>
            </div>
            <div className="w-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-sm" title="No trades"></div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-2 h-2 bg-green-300 dark:bg-green-300 rounded-sm" title="Small Profit"></div>
                <div className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-sm" title="Medium Profit (₹1500+)"></div>
                <div className="w-2 h-2 bg-green-800 dark:bg-green-700 rounded-sm" title="High Profit (₹5000+)"></div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Profit</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
