import type { KiteCredentials, BrokerTrade } from "@shared/schema";
import axios from "axios";
import crypto from "crypto";

export async function fetchKiteTrades(
  credentials: KiteCredentials
): Promise<BrokerTrade[]> {
  try {
    const { apiKey, apiSecret, requestToken } = credentials;

    const checksum = crypto
      .createHash("sha256")
      .update(`${apiKey}${requestToken}${apiSecret}`)
      .digest("hex");

    const response = await axios.post(
      "https://api.kite.trade/session/token",
      {
        api_key: apiKey,
        request_token: requestToken,
        checksum: checksum,
      },
      {
        headers: {
          "X-Kite-Version": "3",
        },
      }
    );

    const accessToken = response.data.data.access_token;

    const tradesResponse = await axios.get("https://api.kite.trade/trades", {
      headers: {
        "X-Kite-Version": "3",
        Authorization: `token ${apiKey}:${accessToken}`,
      },
    });

    const trades: BrokerTrade[] = tradesResponse.data.data.map((trade: any) => ({
      broker: "kite" as const,
      tradeId: trade.trade_id,
      symbol: trade.tradingsymbol,
      action: trade.transaction_type as "BUY" | "SELL",
      quantity: trade.quantity,
      price: trade.average_price,
      executedAt: trade.fill_timestamp,
      pnl: undefined,
      fees: undefined,
      notes: `Exchange: ${trade.exchange}, Product: ${trade.product}`,
    }));

    return trades;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error_type ||
        "Failed to connect to Kite API";
      throw new Error(`Kite API Error: ${message}`);
    }
    throw new Error("Failed to fetch Kite trades. Please check your credentials.");
  }
}
