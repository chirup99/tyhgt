import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface DemoHeatmapProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  tradingDataByDate?: Record<string, any>;
  onDataUpdate?: (data: Record<string, any>) => void;
  onRangeChange?: (range: { from: Date; to: Date } | null) => void;
}

// Simple function to calculate P&L from trade data
function calculatePnL(data: any): number {
  if (!data) return 0;
  
  // Try performanceMetrics first
  if (data.performanceMetrics?.netPnL !== undefined) {
    return data.performanceMetrics.netPnL;
  }
  
  // Try calculating from tradeHistory
  if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
    let totalPnL = 0;
    data.tradeHistory.forEach((trade: any) => {
      if (trade.pnl && typeof trade.pnl === 'string') {
        // Remove ₹ symbol and commas, parse as number
        const pnlValue = parseFloat(trade.pnl.replace(/[₹,]/g, ''));
        if (!isNaN(pnlValue)) {
          totalPnL += pnlValue;
        }
      }
    });
    return totalPnL;
  }
  
  return 0;
}

// Get color based on P&L value - SIMPLE AND CLEAR
function getPnLColor(pnl: number): string {
  if (pnl === 0) return "bg-gray-200 dark:bg-gray-700";
  
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

export function DemoHeatmap({ onDateSelect, selectedDate, onDataUpdate, onRangeChange }: DemoHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDatesForEdit, setSelectedDatesForEdit] = useState<string[]>([]);
  const { toast } = useToast();

  // SIMPLE FETCH - No filters, no complications
  useEffect(() => {
    console.log("🔥 DemoHeatmap: Fetching ALL data from Firebase...");
    setIsLoading(true);
    
    fetch('/api/journal/all-dates')
      .then(res => res.json())
      .then(data => {
        console.log("✅ DemoHeatmap: Raw Firebase data received:", data);
        console.log("✅ DemoHeatmap: Total dates:", Object.keys(data).length);
        
        // Process each date to calculate P&L
        const processedData: Record<string, any> = {};
        Object.keys(data).forEach(key => {
          // Extract date from key (format: journal_YYYY-MM-DD)
          const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            const dateKey = dateMatch[1];
            processedData[dateKey] = data[key];
            const pnl = calculatePnL(data[key]);
            console.log(`📊 DemoHeatmap: ${dateKey} = ₹${pnl.toFixed(2)}`);
          }
        });
        
        console.log("✅ DemoHeatmap: Processed data:", processedData);
        setHeatmapData(processedData);
        setIsLoading(false);
        
        // Emit data to parent component
        if (onDataUpdate) {
          onDataUpdate(processedData);
        }
      })
      .catch(error => {
        console.error("❌ DemoHeatmap: Fetch error:", error);
        setIsLoading(false);
      });
  }, []); // Run once on mount

  // Update selectedRange when both fromDate and toDate are set
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      // Make sure from is before to
      if (from <= to) {
        const range = { from, to };
        setSelectedRange(range);
        setIsDateRangeOpen(false); // Close the popover
        
        // Notify parent
        if (onRangeChange) {
          onRangeChange(range);
        }
        
        console.log("📅 DemoHeatmap: Date range selected:", { from: from.toDateString(), to: to.toDateString() });
      } else {
        console.warn("⚠️ DemoHeatmap: From date must be before to date");
        toast({
          title: "Invalid Range",
          description: "From date must be before to date",
          variant: "destructive",
        });
      }
    }
  }, [fromDate, toDate, onRangeChange]);

  // Filter heatmap data based on selected range
  const getFilteredData = () => {
    if (!selectedRange) {
      return heatmapData;
    }

    const filtered: Record<string, any> = {};
    const startTime = selectedRange.from.getTime();
    const endTime = selectedRange.to.getTime();

    Object.keys(heatmapData).forEach(dateKey => {
      const date = new Date(dateKey);
      const dateTime = date.getTime();
      
      if (dateTime >= startTime && dateTime <= endTime) {
        filtered[dateKey] = heatmapData[dateKey];
      }
    });

    return filtered;
  };

  // Generate calendar data for the year (or date range)
  const generateMonthsData = () => {
    let startYear, endYear, startMonth, endMonth;

    if (selectedRange) {
      // Use the selected range
      startYear = selectedRange.from.getFullYear();
      endYear = selectedRange.to.getFullYear();
      startMonth = selectedRange.from.getMonth();
      endMonth = selectedRange.to.getMonth();
    } else {
      // Use current year
      startYear = endYear = currentDate.getFullYear();
      startMonth = 0;
      endMonth = 11;
    }

    const months = [];
    
    for (let year = startYear; year <= endYear; year++) {
      const firstMonth = (year === startYear) ? startMonth : 0;
      const lastMonth = (year === endYear) ? endMonth : 11;

      for (let monthIndex = firstMonth; monthIndex <= lastMonth; monthIndex++) {
        const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' });
        const lastDay = new Date(year, monthIndex + 1, 0);
        
        // Create 7 rows (one for each day of week)
        const dayRows: (Date | null)[][] = [[], [], [], [], [], [], []];
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
          const date = new Date(year, monthIndex, day);
          
          // If range is selected, only include dates within range
          if (selectedRange) {
            if (date < selectedRange.from || date > selectedRange.to) {
              continue; // Skip dates outside the range
            }
          }
          
          const dayOfWeek = date.getDay();
          dayRows[dayOfWeek].push(date);
        }
        
        months.push({ name: monthName, dayRows });
      }
    }
    
    return months;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  // Handle date click - either load date or select for edit
  const handleDateClick = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    // If in edit mode, select the date for editing instead of loading
    if (isEditMode) {
      setSelectedDatesForEdit(prev => {
        // If date already selected, remove it
        if (prev.includes(dateKey)) {
          return prev.filter(d => d !== dateKey);
        }
        // If less than 2 dates selected, add it
        if (prev.length < 2) {
          return [...prev, dateKey];
        }
        // If 2 dates already selected, replace the second one
        return [prev[0], dateKey];
      });
      return;
    }
    
    // Normal mode - load the date
    setCurrentDate(date);
    onDateSelect(date);
  };

  // Handle "Edit date" menu item click
  const handleEditDateClick = () => {
    setIsEditMode(true);
    setSelectedDatesForEdit([]);
  };

  // Handle cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedDatesForEdit([]);
  };

  // Handle save selected dates
  const handleSaveEdit = () => {
    if (selectedDatesForEdit.length !== 2) {
      toast({
        title: "Select Two Dates",
        description: "Please select exactly two dates on the heatmap",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Dates Selected",
      description: `Selected: ${selectedDatesForEdit[0]} and ${selectedDatesForEdit[1]}`,
    });

    // TODO: Implement actual edit logic here
    console.log("📅 Selected dates for edit:", selectedDatesForEdit);
    
    // Exit edit mode
    setIsEditMode(false);
    setSelectedDatesForEdit([]);
  };

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
  const filteredData = getFilteredData();

  const formatDisplayDate = () => {
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleResetRange = () => {
    setSelectedRange(null);
    setFromDate("");
    setToDate("");
    
    // Emit range reset to parent
    if (onRangeChange) {
      onRangeChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Trading Calendar {selectedRange 
            ? `${selectedRange.from.getFullYear()}${selectedRange.from.getFullYear() !== selectedRange.to.getFullYear() ? `-${selectedRange.to.getFullYear()}` : ''}`
            : currentDate.getFullYear()
          }
        </h3>
        <span className="text-xs text-gray-500">
          {isLoading ? "Loading..." : selectedRange 
            ? `${Object.keys(filteredData).length} of ${Object.keys(heatmapData).length} dates in range`
            : `${Object.keys(heatmapData).length} dates with data`
          }
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="overflow-x-auto thin-scrollbar">
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
                          
                          // Format date key YYYY-MM-DD
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateKey = `${year}-${month}-${day}`;
                          
                          // Get data from heatmapData
                          const data = heatmapData[dateKey];
                          
                          // Calculate P&L
                          const netPnL = calculatePnL(data);
                          let cellColor = getPnLColor(netPnL);
                            
                          // Override for selected date
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          if (isSelected && !isEditMode) {
                            cellColor = "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-600";
                          }

                          // Check if date is selected for edit
                          const isSelectedForEdit = selectedDatesForEdit.includes(dateKey);
                          const editIndex = selectedDatesForEdit.indexOf(dateKey);

                          return (
                            <div
                              key={colIndex}
                              className={`w-3 h-3 rounded-sm cursor-pointer transition-all relative ${cellColor}`}
                              onClick={() => handleDateClick(date)}
                              title={`${dateKey}: ₹${netPnL.toFixed(2)}`}
                              data-testid={`heatmap-cell-${dateKey}`}
                            >
                              {isSelectedForEdit && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      editIndex === 0 
                                        ? 'bg-purple-600 dark:bg-purple-400' 
                                        : 'bg-orange-600 dark:bg-orange-400'
                                    }`}
                                    data-testid={`edit-marker-${dateKey}`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Date Range / Year Navigation */}
      <div className="relative flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {!selectedRange ? (
          // Show year navigation when no range is selected
          <>
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

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextYear}
              className="h-8 w-8"
              data-testid="button-next-year"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          // Show selected range with close button (no left/right navigation)
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {selectedRange.from.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {selectedRange.to.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
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

        {/* 3-dot menu in right corner */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute right-0"
              data-testid="button-calendar-menu"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleEditDateClick} data-testid="menu-item-edit-date">
              Edit date
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-delete">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Mode Control Bar */}
      {isEditMode && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
                Select two dates on the heatmap
              </p>
              {selectedDatesForEdit.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {selectedDatesForEdit.map((dateKey, index) => (
                    <div
                      key={dateKey}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: index === 0 
                          ? 'rgb(147 51 234 / 0.1)' 
                          : 'rgb(234 88 12 / 0.1)',
                        color: index === 0 
                          ? 'rgb(147 51 234)' 
                          : 'rgb(234 88 12)'
                      }}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          index === 0 
                            ? 'bg-purple-600' 
                            : 'bg-orange-600'
                        }`}
                      />
                      {dateKey}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdit}
                disabled={selectedDatesForEdit.length !== 2}
                data-testid="button-save-edit"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

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
