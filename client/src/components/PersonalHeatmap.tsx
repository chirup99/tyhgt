import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateKey, getHeatmapColor, generateYearHeatmapDays } from "./heatmap-utils";

interface PersonalHeatmapProps {
  userId: string | null;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function PersonalHeatmap({ userId, onDateSelect, selectedDate }: PersonalHeatmapProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [personalData, setPersonalData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoClicked, setHasAutoClicked] = useState(false);

  // Load personal data from Firebase when userId changes or year changes
  useEffect(() => {
    if (!userId) {
      console.log("⚠️ PERSONAL HEATMAP: No userId provided");
      return;
    }

    const loadPersonalData = async () => {
      setIsLoading(true);
      setHasAutoClicked(false); // Reset auto-click flag when loading new data
      
      try {
        console.log(`📊 PERSONAL HEATMAP: Loading data for userId: ${userId}, year: ${year}`);
        
        const response = await fetch(`/api/user-journal/${userId}/all`);
        if (!response.ok) {
          throw new Error(`Failed to load personal data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ PERSONAL HEATMAP: Loaded ${Object.keys(data).length} dates from Firebase`);
        
        // Filter data for the selected year
        const yearData = Object.keys(data).reduce((acc, dateStr) => {
          const date = new Date(dateStr);
          if (date.getFullYear() === year) {
            acc[dateStr] = data[dateStr];
          }
          return acc;
        }, {} as Record<string, any>);
        
        setPersonalData(yearData);
        localStorage.setItem("personalTradingDataByDate", JSON.stringify(yearData));
        
        console.log(`📅 PERSONAL HEATMAP: Filtered to ${Object.keys(yearData).length} dates for year ${year}`);
      } catch (error) {
        console.error("❌ PERSONAL HEATMAP: Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonalData();
  }, [userId, year]);

  // AUTO-CLICK all dates with data for the current year
  // This is the critical fix: separate auto-click logic for personal heatmap
  useEffect(() => {
    // Only auto-click once after data is loaded
    if (isLoading || hasAutoClicked || Object.keys(personalData).length === 0) {
      return;
    }

    console.log(`🎯 PERSONAL HEATMAP: Starting auto-click for year ${year}...`);
    
    const datesWithData = Object.keys(personalData);
    console.log(`📊 PERSONAL HEATMAP: Found ${datesWithData.length} dates with data:`, datesWithData);
    
    // Auto-click each date in sequence with a small delay
    let clickIndex = 0;
    const clickInterval = setInterval(() => {
      if (clickIndex < datesWithData.length) {
        const dateStr = datesWithData[clickIndex];
        const date = new Date(dateStr);
        
        console.log(`👆 PERSONAL HEATMAP: Auto-clicking date ${clickIndex + 1}/${datesWithData.length}: ${dateStr}`);
        onDateSelect(date);
        
        clickIndex++;
      } else {
        clearInterval(clickInterval);
        setHasAutoClicked(true);
        console.log(`✅ PERSONAL HEATMAP: Auto-click completed! Clicked ${datesWithData.length} dates.`);
      }
    }, 50); // 50ms between clicks

    return () => clearInterval(clickInterval);
  }, [personalData, isLoading, hasAutoClicked, year, onDateSelect]);

  const months = generateYearHeatmapDays(year);

  const handlePreviousYear = () => {
    setYear(year - 1);
    setHasAutoClicked(false); // Reset to allow auto-click for new year
  };
  
  const handleNextYear = () => {
    setYear(year + 1);
    setHasAutoClicked(false); // Reset to allow auto-click for new year
  };

  if (!userId) {
    return (
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view your personal trading heatmap
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-lg font-semibold">
              Personal Trading Heatmap
            </CardTitle>
            {isLoading && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Loading data...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousYear}
              className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400"
              data-testid="button-personal-prev-year"
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
              data-testid="button-personal-next-year"
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
                        const savedData = personalData[dateStr];
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
                            data-testid={`personal-calendar-day-${date.getDate()}-${date.getMonth()}`}
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

          {/* Data summary */}
          {Object.keys(personalData).length > 0 && (
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              {Object.keys(personalData).length} trading days recorded in {year}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
