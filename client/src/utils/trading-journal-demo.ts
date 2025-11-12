// Demo Trading Journal Data for June - September 2025
// This provides new users with a realistic preview of the trading journal features

export interface DemoTrade {
  id: string;
  time: string;
  symbol: string;
  type: "LONG" | "SHORT";
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  tags?: string[];
}

export interface DemoDayData {
  date: string;
  trades: DemoTrade[];
  tradeHistory?: DemoTrade[]; // For compatibility with existing UI
  performanceMetrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netPnL: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  };
  tradingNotes?: string;
  notesContent?: string; // For compatibility with existing UI
  mood?: "excellent" | "good" | "neutral" | "poor";
  images?: string[];
  content?: string; // Additional notes field for compatibility
}

export interface DemoJournalDataset {
  range: {
    start: string;
    end: string;
  };
  dataByDate: Record<string, DemoDayData>;
}

// Helper to calculate performance metrics from trades (ensures accuracy)
const calculateMetrics = (trades: DemoTrade[]) => {
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  
  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    netPnL: totalPnL,
    avgWin: winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0,
    avgLoss: losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
      : 0,
    largestWin: winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.pnl)) 
      : 0,
    largestLoss: losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.pnl)) 
      : 0,
  };
};

// Helper to create trade with automatic P&L calculation
const createTrade = (
  id: string,
  time: string,
  symbol: string,
  type: "LONG" | "SHORT",
  entry: number,
  exit: number,
  qty: number,
  tags?: string[]
): DemoTrade => {
  const pnl = type === "LONG" ? (exit - entry) * qty : (entry - exit) * qty;
  return { id, time, symbol, type, entry, exit, qty, pnl: Math.round(pnl * 100) / 100, tags };
};

// Helper to create day data with auto-calculated metrics
const createDayData = (
  date: string,
  trades: DemoTrade[],
  notes: string,
  mood: "excellent" | "good" | "neutral" | "poor",
  images?: string[]
): DemoDayData => {
  const metrics = calculateMetrics(trades);
  return {
    date,
    trades,
    tradeHistory: trades, // Duplicate for compatibility
    performanceMetrics: metrics,
    tradingNotes: notes,
    notesContent: notes, // Duplicate for compatibility
    content: notes, // Additional compatibility
    mood,
    images: images || [],
  };
};

// Demo data for each trading day from June to September 2025
export const DEMO_JOURNAL_DATA: DemoJournalDataset = {
  range: {
    start: "2025-06-01",
    end: "2025-09-30",
  },
  dataByDate: {
    // June 2025 - Building confidence
    "2025-06-02": createDayData(
      "2025-06-02",
      [
        createTrade("1", "09:30", "NIFTY 24000 CE", "LONG", 150.5, 165.75, 50, ["breakout", "strong-volume"]),
        createTrade("2", "10:45", "BANKNIFTY 52000 PE", "SHORT", 280.25, 265.50, 25, ["resistance", "trend-following"]),
        createTrade("3", "14:15", "RELIANCE", "LONG", 2850.00, 2865.50, 20, ["support-bounce"]),
      ],
      "Great start to the month! All three trades worked perfectly. Followed the plan and took profits at targets.",
      "excellent"
    ),
    "2025-06-05": createDayData(
      "2025-06-05",
      [
        createTrade("4", "09:25", "NIFTY 24100 PE", "SHORT", 175.00, 158.25, 50, ["opening-range-breakout"]),
        createTrade("5", "11:00", "INFY", "LONG", 1450.00, 1442.50, 30, ["reversal-fail"]),
        createTrade("6", "13:45", "TATASTEEL", "LONG", 145.20, 147.80, 100, ["support-hold", "strong-momentum"]),
      ],
      "One losing trade on INFY - should have cut losses faster. Other trades went well.",
      "good"
    ),
    "2025-06-10": createDayData(
      "2025-06-10",
      [
        createTrade("7", "09:35", "BANKNIFTY 52500 CE", "LONG", 325.00, 345.75, 30, ["breakout", "high-volume"]),
        createTrade("8", "10:50", "HDFC", "LONG", 2750.00, 2742.00, 15, ["false-breakout"]),
        createTrade("9", "12:20", "ITC", "SHORT", 425.50, 422.00, 50, ["resistance-rejection"]),
        createTrade("10", "14:00", "SBIN", "LONG", 625.00, 631.50, 40, ["trend-continuation"]),
      ],
      "Good discipline today. Cut the HDFC loss quickly and moved on to better setups.",
      "good"
    ),
    "2025-06-17": createDayData(
      "2025-06-17",
      [
        createTrade("11", "09:40", "NIFTY 24200 CE", "LONG", 180.00, 195.50, 40, ["gap-up", "momentum"]),
        createTrade("12", "11:15", "WIPRO", "SHORT", 480.00, 475.25, 25, ["breakdown"]),
        createTrade("13", "13:00", "ADANIPORTS", "LONG", 1250.00, 1235.00, 20, ["support-fail"]),
        createTrade("14", "14:30", "COALINDIA", "LONG", 385.00, 390.75, 60, ["consolidation-breakout"]),
      ],
      "ADANIPORTS loss hurt but recovered with COALINDIA trade. Need to be more selective with entries.",
      "good"
    ),
    "2025-06-23": createDayData(
      "2025-06-23",
      [
        createTrade("15", "09:30", "BANKNIFTY 53000 PE", "SHORT", 290.00, 275.50, 30, ["trend-following"]),
        createTrade("16", "10:45", "TECHM", "LONG", 1180.00, 1195.00, 20, ["support-bounce"]),
        createTrade("17", "12:30", "BAJFINANCE", "SHORT", 7250.00, 7280.00, 5, ["over-extended"]),
        createTrade("18", "14:15", "MARUTI", "LONG", 12500.00, 12575.00, 2, ["breakout-retest"]),
      ],
      "Solid trading day. BAJFINANCE was a quick stop-out but other trades compensated well.",
      "good"
    ),
    
    // July 2025 - Peak performance
    "2025-07-01": createDayData(
      "2025-07-01",
      [
        createTrade("19", "09:25", "NIFTY 24500 CE", "LONG", 200.00, 225.00, 50, ["monthly-opening", "strong-momentum"]),
        createTrade("20", "11:00", "RELIANCE", "LONG", 2900.00, 2925.00, 25, ["breakout"]),
        createTrade("21", "13:30", "HDFCBANK", "SHORT", 1650.00, 1642.50, 30, ["resistance"]),
        createTrade("22", "14:45", "TCS", "LONG", 3850.00, 3875.00, 15, ["trend-continuation"]),
      ],
      "Perfect day! All trades hit targets. Market momentum was excellent. This is what consistency looks like!",
      "excellent"
    ),
    "2025-07-07": createDayData(
      "2025-07-07",
      [
        createTrade("23", "09:35", "BANKNIFTY 53500 CE", "LONG", 350.00, 375.00, 35, ["gap-fill", "momentum"]),
        createTrade("24", "10:50", "ICICIBANK", "LONG", 1125.00, 1142.50, 40, ["support-bounce"]),
        createTrade("25", "12:15", "ASIANPAINT", "SHORT", 3250.00, 3230.00, 15, ["breakdown"]),
        createTrade("26", "14:00", "SUNPHARMA", "LONG", 1580.00, 1595.00, 25, ["reversal"]),
      ],
      "Another clean sweep! Market conditions are ideal. Sticking to the plan is paying off big time.",
      "excellent"
    ),
    "2025-07-14": createDayData(
      "2025-07-14",
      [
        createTrade("27", "09:30", "NIFTY 24800 PE", "SHORT", 210.00, 195.00, 45, ["opening-strength"]),
        createTrade("28", "11:00", "TATAMOTORS", "LONG", 875.00, 890.00, 50, ["breakout", "volume-spike"]),
        createTrade("29", "12:45", "BHARTIARTL", "SHORT", 1450.00, 1438.00, 30, ["resistance-rejection"]),
        createTrade("30", "14:20", "POWERGRID", "LONG", 285.00, 289.50, 80, ["support-hold"]),
      ],
      "Incredible winning streak! Every setup is working perfectly. Confidence is high but staying disciplined.",
      "excellent"
    ),
    "2025-07-21": createDayData(
      "2025-07-21",
      [
        createTrade("31", "09:40", "BANKNIFTY 54000 CE", "LONG", 380.00, 405.00, 32, ["breakout", "strong-volume"]),
        createTrade("32", "11:15", "HINDUNILVR", "SHORT", 2650.00, 2635.00, 20, ["overbought"]),
        createTrade("33", "13:00", "DRREDDY", "LONG", 6200.00, 6250.00, 5, ["trend-following"]),
        createTrade("34", "14:35", "AXISBANK", "LONG", 1075.00, 1088.00, 35, ["consolidation-breakout"]),
      ],
      "Four for four again! This month is turning out to be my best ever. Discipline + good market = success.",
      "excellent"
    ),
    "2025-07-28": createDayData(
      "2025-07-28",
      [
        createTrade("35", "09:25", "NIFTY 25000 CE", "LONG", 175.00, 198.00, 55, ["psychological-level", "breakout"]),
        createTrade("36", "10:55", "KOTAKBANK", "LONG", 1820.00, 1838.00, 25, ["support-bounce"]),
        createTrade("37", "12:30", "TITAN", "SHORT", 3450.00, 3430.00, 18, ["resistance"]),
        createTrade("38", "14:10", "ULTRACEMCO", "LONG", 9250.00, 9300.00, 3, ["trend-continuation"]),
      ],
      "Perfect month ending! All July trades were winners. This is the power of patience and planning.",
      "excellent"
    ),
    
    // August 2025 - Reality check and lessons
    "2025-08-04": createDayData(
      "2025-08-04",
      [
        createTrade("39", "09:30", "BANKNIFTY 54500 PE", "SHORT", 320.00, 305.00, 30, ["trend-following"]),
        createTrade("40", "10:45", "INFY", "LONG", 1500.00, 1485.00, 35, ["false-breakout"]),
        createTrade("41", "12:00", "LT", "SHORT", 3550.00, 3565.00, 15, ["over-traded"]),
        createTrade("42", "13:45", "WIPRO", "LONG", 495.00, 502.00, 40, ["recovery-attempt"]),
      ],
      "Rough start to August. Got overconfident from July's streak. Need to refocus on discipline, not revenge trading.",
      "poor"
    ),
    "2025-08-11": createDayData(
      "2025-08-11",
      [
        createTrade("43", "09:35", "NIFTY 25100 CE", "LONG", 190.00, 205.00, 45, ["gap-up", "momentum"]),
        createTrade("44", "11:00", "SBIN", "SHORT", 645.00, 638.00, 50, ["resistance-rejection"]),
        createTrade("45", "12:30", "HCLTECH", "LONG", 1350.00, 1340.00, 28, ["support-fail"]),
        createTrade("46", "14:15", "BPCL", "LONG", 585.00, 592.00, 45, ["reversal"]),
      ],
      "Better! Back on track. The HCL loss was acceptable risk. Maintained discipline throughout.",
      "good"
    ),
    "2025-08-18": createDayData(
      "2025-08-18",
      [
        createTrade("47", "09:30", "BANKNIFTY 55000 CE", "LONG", 365.00, 385.00, 33, ["breakout", "volume-confirmation"]),
        createTrade("48", "10:50", "TATASTEEL", "SHORT", 152.00, 148.50, 90, ["breakdown"]),
        createTrade("49", "12:15", "INDUSINDBK", "LONG", 1425.00, 1415.00, 22, ["over-extended"]),
        createTrade("50", "14:00", "COALINDIA", "SHORT", 395.00, 388.00, 65, ["resistance"]),
      ],
      "Strong performance. Cut the INDUSINDBK loss quickly and let winners run. This is how it's done!",
      "good"
    ),
    "2025-08-25": createDayData(
      "2025-08-25",
      [
        createTrade("51", "09:25", "NIFTY 25300 PE", "SHORT", 225.00, 212.00, 42, ["opening-strength"]),
        createTrade("52", "11:00", "RELIANCE", "LONG", 2950.00, 2975.00, 22, ["support-bounce", "strong-volume"]),
        createTrade("53", "12:45", "ADANIPORTS", "SHORT", 1285.00, 1295.00, 25, ["premature-entry"]),
        createTrade("54", "14:20", "MARUTI", "LONG", 12800.00, 12875.00, 2, ["breakout-retest"]),
      ],
      "Good week ending. ADANIPORTS was a timing issue. Overall satisfied with execution and risk management.",
      "good"
    ),
    
    // September 2025 - Consistent execution
    "2025-09-01": createDayData(
      "2025-09-01",
      [
        createTrade("55", "09:30", "BANKNIFTY 55500 CE", "LONG", 390.00, 415.00, 30, ["monthly-start", "breakout"]),
        createTrade("56", "10:45", "ICICIBANK", "LONG", 1155.00, 1172.00, 38, ["trend-following"]),
        createTrade("57", "12:20", "BAJFINANCE", "SHORT", 7400.00, 7380.00, 6, ["resistance-rejection"]),
        createTrade("58", "14:10", "TECHM", "LONG", 1210.00, 1225.00, 28, ["consolidation-breakout"]),
      ],
      "Excellent September start! All setups worked perfectly. Patience and discipline paying off again.",
      "excellent"
    ),
    "2025-09-08": createDayData(
      "2025-09-08",
      [
        createTrade("59", "09:35", "NIFTY 25500 CE", "LONG", 210.00, 230.00, 48, ["gap-up", "momentum"]),
        createTrade("60", "11:10", "HDFCBANK", "SHORT", 1680.00, 1665.00, 32, ["overbought"]),
        createTrade("61", "12:50", "TCS", "LONG", 3900.00, 3885.00, 16, ["support-fail"]),
        createTrade("62", "14:25", "SUNPHARMA", "LONG", 1620.00, 1638.00, 30, ["reversal", "strong-close"]),
      ],
      "TCS stop-out was clean. Other trades executed well. Maintaining consistency is key.",
      "good"
    ),
    "2025-09-15": createDayData(
      "2025-09-15",
      [
        createTrade("63", "09:30", "BANKNIFTY 56000 PE", "SHORT", 340.00, 325.00, 35, ["trend-following", "momentum"]),
        createTrade("64", "10:55", "BHARTIARTL", "LONG", 1480.00, 1498.00, 32, ["breakout"]),
        createTrade("65", "12:30", "HINDALCO", "SHORT", 625.00, 618.00, 55, ["resistance"]),
        createTrade("66", "14:15", "GRASIM", "LONG", 2150.00, 2175.00, 12, ["support-bounce"]),
      ],
      "Clean sweep again! Every trade followed the rules perfectly. This is the result of preparation and patience.",
      "excellent"
    ),
    "2025-09-22": createDayData(
      "2025-09-22",
      [
        createTrade("67", "09:25", "NIFTY 25700 CE", "LONG", 195.00, 215.00, 50, ["psychological-level"]),
        createTrade("68", "11:00", "KOTAKBANK", "LONG", 1850.00, 1870.00, 27, ["support-bounce", "volume"]),
        createTrade("69", "12:40", "TITAN", "SHORT", 3500.00, 3510.00, 20, ["resistance-fail"]),
        createTrade("70", "14:20", "ULTRACEMCO", "LONG", 9400.00, 9455.00, 4, ["trend-continuation"]),
      ],
      "TITAN was a premature short. Need to wait for confirmation. Other trades were textbook perfect.",
      "good"
    ),
    "2025-09-29": createDayData(
      "2025-09-29",
      [
        createTrade("71", "09:30", "BANKNIFTY 56500 CE", "LONG", 410.00, 435.00, 34, ["quarter-end", "breakout"]),
        createTrade("72", "11:10", "RELIANCE", "LONG", 3000.00, 3025.00, 24, ["round-number", "momentum"]),
        createTrade("73", "12:50", "ASIANPAINT", "SHORT", 3300.00, 3280.00, 17, ["resistance-rejection"]),
        createTrade("74", "14:30", "DRREDDY", "LONG", 6350.00, 6390.00, 6, ["trend-following"]),
      ],
      "Perfect ending to the quarter! Four months of consistent growth. This demo shows what's possible with discipline.",
      "excellent"
    ),
  },
};

// Calculate overall demo statistics
export const getDemoStatistics = () => {
  const allDays = Object.values(DEMO_JOURNAL_DATA.dataByDate);
  const totalTrades = allDays.reduce((sum, day) => sum + day.performanceMetrics.totalTrades, 0);
  const totalWinning = allDays.reduce((sum, day) => sum + day.performanceMetrics.winningTrades, 0);
  const totalPnL = allDays.reduce((sum, day) => sum + day.performanceMetrics.netPnL, 0);
  
  return {
    totalDays: allDays.length,
    totalTrades,
    winRate: ((totalWinning / totalTrades) * 100).toFixed(2),
    totalPnL: totalPnL.toFixed(2),
    avgDailyPnL: (totalPnL / allDays.length).toFixed(2),
  };
};
