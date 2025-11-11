import type { FyersCredentials, BrokerTrade } from "@shared/schema";
import axios from "axios";
import crypto from "crypto";

export async function fetchFyersTrades(
  credentials: FyersCredentials
): Promise<BrokerTrade[]> {
  try {
    const { appId, secretId, authCode } = credentials;

    const appIdHash = crypto
      .createHash("sha256")
      .update(`${appId}:${secretId}`)
      .digest("hex");

    const tokenResponse = await axios.post(
      "https://api-t1.fyers.in/api/v3/validate-authcode",
      {
        grant_type: "authorization_code",
        appIdHash: appIdHash,
        code: authCode,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const tradesResponse = await axios.get(
      "https://api-t1.fyers.in/data-rest/v3/tradebook",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const trades: BrokerTrade[] = tradesResponse.data.tradeBook.map(
      (trade: any) => ({
        broker: "fyers" as const,
        tradeId: trade.id,
        symbol: trade.symbol,
        action: trade.side === 1 ? ("BUY" as const) : ("SELL" as const),
        quantity: trade.tradedQty,
        price: trade.tradePrice,
        executedAt: trade.orderDateTime,
        pnl: undefined,
        fees: undefined,
        notes: `Segment: ${trade.segment}, Product: ${trade.productType}`,
      })
    );

    return trades;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "Failed to connect to Fyers API";
      throw new Error(`Fyers API Error: ${message}`);
    }
    throw new Error("Failed to fetch Fyers trades. Please check your credentials.");
  }
}
