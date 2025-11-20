import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonalHeatmapProps {
  userId: string | null;
  onDateSelect: (date: Date, firebaseData: any) => void;
  selectedDate: Date | null;
}

// Simple function to calculate P&L from trade data
function calculatePnL(data: any): number {
  if (!data) return 0;
  
  // ✅ CRITICAL FIX: Handle Firebase wrapped data structure
  // Firebase stores data as: { date, userId, tradingData: { performanceMetrics: { netPnL } } }
  // Try wrapped structure first (Firebase format)
  if (data.tradingData?.performanceMetrics?.netPnL !== undefined) {
    return data.tradingData.performanceMetrics.netPnL;
  }
  
  // Try direct performanceMetrics (unwrapped format)
  if (data.performanceMetrics?.netPnL !== undefined) {
    return data.performanceMetrics.netPnL;
  }
  
  // Try calculating from wrapped tradeHistory (Firebase format)
  if (data.tradingData?.tradeHistory && Array.isArray(data.tradingData.tradeHistory)) {
    let totalPnL = 0;
    data.tradingData.tradeHistory.forEach((trade: any) => {
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
  
  // Try calculating from direct tradeHistory (unwrapped format)
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

export function PersonalHeatmap({ userId, onDateSelect, selectedDate }: PersonalHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // FETCH ALL DATES FROM FIREBASE - SIMPLE AND DIRECT
  useEffect(() => {
    if (!userId) {
      console.log("🔥 PersonalHeatmap: No userId provided, skipping fetch");
      setHeatmapData({});
      setIsLoading(false);
      return;
    }

    console.log("🔥 PersonalHeatmap: Fetching ALL personal data from Firebase for userId:", userId);
    setIsLoading(true);
    
    fetch(`/api/user-journal/${userId}/all`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ PersonalHeatmap: Raw Firebase data received:", data);
        console.log("✅ PersonalHeatmap: Total dates:", Object.keys(data).length);
        
        // Store the raw Firebase data - NO PROCESSING, NO FILTERING
        setHeatmapData(data);
        setIsLoading(false);
        
        // Log each date for debugging
        Object.keys(data).forEach(dateKey => {
          const pnl = calculatePnL(data[dateKey]);
          console.log(`📊 PersonalHeatmap: ${dateKey} = ₹${pnl.toFixed(2)}`);
        });
      })
      .catch(error => {
        console.error("❌ PersonalHeatmap: Fetch error:", error);
        setIsLoading(false);
      });
  }, [userId]);

  // HANDLE DATE CLICK - FETCH FRESH DATA FROM FIREBASE
  const handleDateClick = async (date: Date) => {
    if (!userId) return;
    
    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    console.log(`🔥 PersonalHeatmap: Date clicked: ${dateKey}, fetching FRESH data from Firebase...`);
    
    try {
      // FETCH FRESH DATA FROM FIREBASE FOR THIS SPECIFIC DATE
      const response = await fetch(`/api/user-journal/${userId}/${dateKey}`);
      const freshData = await response.json();
      
      console.log(`✅ PersonalHeatmap: Fresh Firebase data for ${dateKey}:`, freshData);
      
      // Update the selected date
      setCurrentDate(date);
      
      // Pass the FRESH FIREBASE DATA to parent component
      onDateSelect(date, freshData);
      
    } catch (error) {
      console.error(`❌ PersonalHeatmap: Error fetching data for ${dateKey}:`, error);
      // If fetch fails, pass empty data to parent
      onDateSelect(date, {});
    }
  };

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

  if (!userId) {
    return (
      <div className="flex flex-col gap-2 p-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to view your personal trading heatmap
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Personal Trading Calendar {currentDate.getFullYear()}
        </h3>
        <span className="text-xs text-gray-500">
          {isLoading ? "Loading..." : `${Object.keys(heatmapData).length} dates with data`}
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
                          
                          // Get data from heatmapData (ONLY FIREBASE DATA)
                          const data = heatmapData[dateKey];
                          
                          // Calculate P&L from FIREBASE DATA ONLY
                          const netPnL = calculatePnL(data);
                          let cellColor = getPnLColor(netPnL);
                            
                          // Override for selected date
                          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                          if (isSelected) {
                            cellColor = "bg-blue-500 dark:bg-blue-400 ring-2 ring-blue-600";
                          }

                          return (
                            <div
                              key={colIndex}
                              className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${cellColor}`}
                              onClick={() => handleDateClick(date)}
                              title={`${dateKey}: ₹${netPnL.toFixed(2)}`}
                              data-testid={`personal-heatmap-cell-${dateKey}`}
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
        
        <Button variant="ghost" size="sm" className="h-8 min-w-[200px]">
          <Calendar className="w-3 h-3 mr-2" />
          <span className="text-xs">{formatDisplayDate()}</span>
        </Button>

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
