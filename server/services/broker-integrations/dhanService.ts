import type { DhanCredentials, BrokerTrade } from "@shared/schema";
import axios from "axios";

export async function fetchDhanTrades(
  credentials: DhanCredentials
): Promise<BrokerTrade[]> {
  try {
    const { clientId, accessToken } = credentials;

    const tradesResponse = await axios.get(
      "https://api.dhan.co/v2/trades",
      {
        headers: {
          "Content-Type": "application/json",
          "access-token": accessToken,
          "client-id": clientId,
        },
      }
    );

    if (!Array.isArray(tradesResponse.data)) {
      throw new Error("Invalid response format from Dhan API");
    }

    const trades: BrokerTrade[] = tradesResponse.data.map((trade: any) => ({
      broker: "dhan" as const,
      tradeId: trade.exchangeTradeId,
      symbol: trade.tradingSymbol,
      action: trade.transactionType as "BUY" | "SELL",
      quantity: trade.tradedQuantity,
      price: trade.tradedPrice,
      executedAt: trade.exchangeTime,
      pnl: undefined,
      fees: undefined,
      notes: `Exchange: ${trade.exchangeSegment}, Product: ${trade.productType}`,
    }));

    return trades;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "Failed to connect to Dhan API";
      throw new Error(`Dhan API Error: ${message}`);
    }
    throw new Error("Failed to fetch Dhan trades. Please check your credentials.");
  }
}
