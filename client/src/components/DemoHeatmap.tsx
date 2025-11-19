import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateKey, getHeatmapColor } from "./heatmap-utils";

interface DemoHeatmapProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function DemoHeatmap({ onDateSelect, selectedDate }: DemoHeatmapProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [demoData, setDemoData] = useState<Record<string, any>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  // Load demo data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("demoTradingDataByDate");
    if (stored) {
      setDemoData(JSON.parse(stored));
      console.log("📊 DEMO HEATMAP: Loaded demo data:", Object.keys(JSON.parse(stored)).length, "dates");
    }
  }, []);

  // Generate month data organized by day of week
  const generateMonthsData = () => {
    const startMonth = (year === 2025) ? 5 : 0; // June for 2025, January for other years
    const months = [];
    
    for (let monthIndex = startMonth; monthIndex < 12; monthIndex++) {
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

  const months = generateMonthsData();
  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  // Year navigation functions
  const handlePreviousYear = () => setYear(year - 1);
  const handleNextYear = () => setYear(year + 1);

  const formatSelectedDate = (date: Date | null) => {
    if (!date) return "Select a date";
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle date range selection
  const handleDateRangeSubmit = () => {
    if (fromDate && toDate) {
      // Convert dd-mm-yyyy to Date objects
      const [fromDay, fromMonth, fromYear] = fromDate.split('-').map(Number);
      const [toDay, toMonth, toYear] = toDate.split('-').map(Number);
      
      const from = new Date(fromYear, fromMonth - 1, fromDay);
      const to = new Date(toYear, toMonth - 1, toDay);
      
      // Select the "from" date
      onDateSelect(from);
      
      console.log(`📅 Date range selected: ${fromDate} to ${toDate}`);
      setIsDateRangeOpen(false);
    }
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
                            key={dayIndex}
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

      {/* Year Navigation & Date Range Picker */}
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
            <div className="flex items-center gap-2 min-w-[250px] justify-center cursor-pointer hover-elevate rounded-md px-3 py-1">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatSelectedDate(selectedDate)}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="center">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                Select Date Range
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  From Date
                </label>
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  data-testid="input-from-date"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  To Date
                </label>
                <input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  data-testid="input-to-date"
                />
              </div>

              <Button
                onClick={handleDateRangeSubmit}
                className="w-full"
                disabled={!fromDate || !toDate}
                data-testid="button-apply-date-range"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
