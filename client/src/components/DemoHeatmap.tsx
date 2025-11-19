import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateKey, getHeatmapColor } from "./heatmap-utils";

interface DemoHeatmapProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function DemoHeatmap({ onDateSelect, selectedDate }: DemoHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [demoData, setDemoData] = useState<Record<string, any>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch DEMO data from /api/journal/all-dates (common for all users)
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setIsLoading(true);
        console.log("📊 DEMO HEATMAP: Fetching common demo data from /api/journal/all-dates");
        
        // Fetch common DEMO data from API
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/journal/all-dates`);
        
        if (response.ok) {
          const data = await response.json();
          setDemoData(data);
          localStorage.setItem("demoTradingDataByDate", JSON.stringify(data));
          console.log("✅ DEMO HEATMAP: Loaded", Object.keys(data).length, "dates from demo API");
        } else {
          console.log("⚠️ Failed to load demo data:", response.statusText);
          // Try localStorage fallback
          const stored = localStorage.getItem("demoTradingDataByDate");
          if (stored) {
            setDemoData(JSON.parse(stored));
            console.log("📊 DEMO HEATMAP: Loaded from localStorage fallback");
          } else {
            setDemoData({});
          }
        }
      } catch (error) {
        console.error("❌ Error loading demo data:", error);
        // Try localStorage fallback
        const stored = localStorage.getItem("demoTradingDataByDate");
        if (stored) {
          setDemoData(JSON.parse(stored));
          console.log("📊 DEMO HEATMAP: Loaded from localStorage fallback after error");
        } else {
          setDemoData({});
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoData();
  }, []);

  // Generate month data organized by day of week
  const generateMonthsData = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    // Start from January
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' });
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      
      // Create 7 rows (one for each day of week: S, M, T, W, TH, F, S)
      const dayRows: (Date | null)[][] = [[], [], [], [], [], [], []];
      
      // Fill in all days of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, monthIndex, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        dayRows[dayOfWeek].push(date);
      }
      
      months.push({
        name: monthName,
        dayRows
      });
    }
    
    return months;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  // Date navigation functions
  const handlePreviousDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };
  
  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };
  
  // Generate months data based on current date
  const months = generateMonthsData();

  // Format date like the image: "Friday, November 28, 2025"
  const formatDisplayDate = () => {
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Auto-apply date range when both dates are selected
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      setSelectedRange({ from, to });
      onDateSelect(from);
      
      console.log(`📅 Date range selected: ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`);
      setIsDateRangeOpen(false);
    }
  }, [fromDate, toDate, onDateSelect]);

  // Reset date range
  const handleResetRange = () => {
    setFromDate("");
    setToDate("");
    setSelectedRange(null);
  };

  return (
    <div className="space-y-3">
      {/* Heatmap Grid */}
      <div className="flex gap-2">
        {/* Day of week labels */}
        <div className="flex flex-col gap-1 pt-6">
          {dayLabels.map((label, index) => (
            <div 
              key={index} 
              className="h-3 flex items-center justify-end text-[10px] font-medium text-gray-600 dark:text-gray-400 pr-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Scrollable month grid with thin scrollbar */}
        <div className="flex-1 overflow-x-auto thin-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-24 text-sm text-gray-500 dark:text-gray-400">
              Loading demo data...
            </div>
          ) : (
            <div className="flex gap-3 pb-2">
              {months.map((monthData, monthIndex) => (
                <div key={monthIndex} className="flex flex-col gap-1 min-w-fit">
                  {/* Month header */}
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center h-5 flex items-center justify-center">
                    {monthData.name}
                  </div>
                  
                  {/* Day rows (S, M, T, W, TH, F, S) */}
                  <div className="flex flex-col gap-1">
                    {monthData.dayRows.map((daysInRow, rowIndex) => (
                      <div key={rowIndex} className="flex gap-1">
                        {daysInRow.map((date, dayIndex) => {
                          if (!date) {
                            return (
                              <div
                                key={dayIndex}
                                className="w-3 h-3"
                              ></div>
                            );
                          }

                          const dateStr = formatDateKey(date);
                          const savedData = demoData[dateStr];
                          const netPnL = savedData?.performanceMetrics?.netPnL || 0;

                          // Show data from demo API
                          const hasActualTradeData =
                            savedData &&
                            ((savedData.tradeHistory && savedData.tradeHistory.length > 0) ||
                              (savedData.performanceMetrics && savedData.performanceMetrics.totalTrades > 0) ||
                              savedData.tradingNotes ||
                              savedData.notesContent);

                          // ONLY show colors when Firebase data exists - NO hardcoded data
                          let cellColor = "bg-gray-100 dark:bg-gray-700";
                          
                          // Show color ONLY if real Firebase demo data exists
                          if (hasActualTradeData) {
                            cellColor = netPnL !== 0 ? getHeatmapColor(netPnL) : "bg-green-200 dark:bg-green-700";
                          }

                          // Selected date: gray-900 instead of blue
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          if (isSelected) {
                            cellColor = "bg-gray-900 dark:bg-gray-100 ring-1 ring-gray-600 dark:ring-gray-400";
                          }

                          return (
                            <div
                              key={dayIndex}
                              className={`
                                w-3 h-3 rounded-sm cursor-pointer transition-all duration-200
                                ${cellColor}
                                hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600
                              `}
                              onClick={() => onDateSelect(date)}
                              title={`${date.toDateString()}${
                                hasActualTradeData ? ` - P&L: ₹${netPnL.toLocaleString("en-IN")}` : " - No data"
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
          )}
        </div>
      </div>

      {/* P&L Color Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Loss</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-red-800 dark:bg-red-700 rounded-full" title="High Loss (₹5000+)"></div>
            <div className="w-2.5 h-2.5 bg-red-600 dark:bg-red-500 rounded-full" title="Medium Loss (₹1500+)"></div>
            <div className="w-2.5 h-2.5 bg-red-300 dark:bg-red-300 rounded-full" title="Small Loss"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-green-300 dark:bg-green-300 rounded-full" title="Small Profit"></div>
            <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-500 rounded-full" title="Medium Profit (₹1500+)"></div>
            <div className="w-2.5 h-2.5 bg-green-800 dark:bg-green-700 rounded-full" title="High Profit (₹5000+)"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Profit</span>
        </div>
      </div>

      {/* Date Navigation & Date Range Picker - Like the image */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousDate}
          className="h-8 w-8"
          data-testid="button-prev-date"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 min-w-[200px]">
              <Calendar className="w-3 h-3 mr-2" />
              <span className="text-xs">{formatDisplayDate()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="space-y-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From Date"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="input-from-date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To Date"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="input-to-date"
              />
            </div>
          </PopoverContent>
        </Popover>

        {selectedRange && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Selected: {selectedRange.from.getFullYear()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetRange}
                  className="h-5 w-5"
                  data-testid="button-reset-range"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-400">
                {selectedRange.from.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} - {selectedRange.to.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextDate}
          className="h-8 w-8"
          data-testid="button-next-date"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <style>{`
        .thin-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
