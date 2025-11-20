import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DemoHeatmapProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

// SIMPLE: Get P&L from data - try all possible fields
function getDataPnL(data: any): number {
  if (!data) return 0;
  
  // Try direct netPnL field
  if (typeof data.netPnL === 'number') return data.netPnL;
  
  // Try profit/loss fields
  if (typeof data.totalProfit === 'number' || typeof data.totalLoss === 'number') {
    return (data.totalProfit || 0) - Math.abs(data.totalLoss || 0);
  }
  
  // Try trade history
  if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
    let total = 0;
    for (const trade of data.tradeHistory) {
      if (trade.pnl) {
        const pnl = typeof trade.pnl === 'string' 
          ? parseFloat(trade.pnl.replace(/[₹,]/g, ''))
          : trade.pnl;
        if (!isNaN(pnl)) total += pnl;
      }
    }
    return total;
  }
  
  return 0;
}

// SIMPLE: Get color based on P&L value
function getPnLColor(pnl: number): string {
  if (pnl === 0) return "bg-gray-100 dark:bg-gray-700";
  
  const amount = Math.abs(pnl);
  
  if (pnl > 0) {
    // Profit - Green shades
    if (amount >= 5000) return "bg-green-800 dark:bg-green-700";
    if (amount >= 1500) return "bg-green-600 dark:bg-green-500";
    return "bg-green-300 dark:bg-green-300";
  } else {
    // Loss - Red shades
    if (amount >= 5000) return "bg-red-800 dark:bg-red-700";
    if (amount >= 1500) return "bg-red-600 dark:bg-red-500";
    return "bg-red-300 dark:bg-red-300";
  }
}

export function DemoHeatmap({ onDateSelect, selectedDate }: DemoHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [demoData, setDemoData] = useState<Record<string, any>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch DEMO data from API
  useEffect(() => {
    const loadDemoData = async () => {
      try {
        setIsLoading(true);
        console.log("📊 DEMO HEATMAP: Fetching demo data...");
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/journal/all-dates`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ DEMO HEATMAP: Got data for", Object.keys(data).length, "dates");
          
          // Debug: Log first entry to see structure
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const sample = data[firstKey];
            const pnl = getDataPnL(sample);
            console.log("📊 Sample date:", firstKey, "P&L:", pnl, "Color:", getPnLColor(pnl));
          }
          
          setDemoData(data);
          localStorage.setItem("demoTradingDataByDate", JSON.stringify(data));
        } else {
          console.warn("⚠️ Failed to load demo data, using localStorage");
          const stored = localStorage.getItem("demoTradingDataByDate");
          if (stored) setDemoData(JSON.parse(stored));
        }
      } catch (error) {
        console.error("❌ Error loading demo data:", error);
        const stored = localStorage.getItem("demoTradingDataByDate");
        if (stored) setDemoData(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoData();
  }, []);

  // Generate calendar data for the year
  const generateMonthsData = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' });
      const lastDay = new Date(year, monthIndex + 1, 0);
      
      // Create 7 rows (one for each day of week)
      const dayRows: (Date | null)[][] = [[], [], [], [], [], [], []];
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, monthIndex, day);
        const dayOfWeek = date.getDay();
        dayRows[dayOfWeek].push(date);
      }
      
      months.push({ name: monthName, dayRows });
    }
    
    return months;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  const handlePreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };
  
  const handleNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };
  
  const months = generateMonthsData();

  const formatDisplayDate = () => {
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Auto-apply date range
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from <= to) {
        setSelectedRange({ from, to });
        setIsDateRangeOpen(false);
      }
    }
  }, [fromDate, toDate]);

  const handleResetRange = () => {
    setSelectedRange(null);
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Demo Trading Calendar {currentDate.getFullYear()}
        </h3>
        {isLoading && (
          <span className="text-xs text-gray-500">Loading...</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="overflow-x-auto thin-scrollbar">
          {isLoading ? (
            <div className="text-center text-sm text-gray-500 py-4">Loading calendar...</div>
          ) : (
            <div className="flex gap-3 pb-2 select-none" style={{ minWidth: 'fit-content' }}>
              {months.map((month, monthIndex) => (
                <div key={monthIndex} className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 text-center select-none">
                    {month.name}
                  </div>
                  <div className="flex gap-1">
                    <div className="flex flex-col gap-1 select-none">
                      {dayLabels.map((label, index) => (
                        <div
                          key={index}
                          className="w-3 h-3 flex items-center justify-center text-[8px] text-gray-500 dark:text-gray-500 select-none"
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1 min-w-fit select-none">
                      {month.dayRows.map((dayRow, dayIndex) => (
                        <div key={dayIndex} className="flex gap-0.5 select-none">
                          {dayRow.map((date, colIndex) => {
                            if (!date) return <div key={colIndex} className="w-3 h-3" />;
                            
                            // SIMPLE: Format date key YYYY-MM-DD
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateKey = `${year}-${month}-${day}`;
                            
                            // SIMPLE: Get data for this date
                            const dayData = demoData[dateKey];
                            
                            // SIMPLE: Calculate P&L and get color
                            const pnl = getDataPnL(dayData);
                            let cellColor = getPnLColor(pnl);
                            
                            // Override for selected date
                            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                            if (isSelected) {
                              cellColor = "bg-gray-900 dark:bg-gray-100";
                            }

                            return (
                              <div
                                key={colIndex}
                                className={`w-3 h-3 rounded-sm cursor-pointer ${cellColor}`}
                                onClick={() => {
                                  setCurrentDate(date);
                                  onDateSelect(date);
                                }}
                                title={`${dateKey}: ₹${pnl.toFixed(2)}`}
                                data-testid={`demo-calendar-day-${date.getDate()}-${date.getMonth()}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* P&L Legend */}
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

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousYear}
          className="h-8 w-8"
          data-testid="button-prev-year"
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
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextYear}
          className="h-8 w-8"
          data-testid="button-next-year"
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
