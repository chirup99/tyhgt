import type {
  BrokerCredentials,
  BrokerTrade,
  KiteCredentials,
  FyersCredentials,
  DhanCredentials,
} from "@shared/schema";
import { fetchKiteTrades } from "./kiteService";
import { fetchFyersTrades } from "./fyersService";
import { fetchDhanTrades } from "./dhanService";

export async function fetchBrokerTrades(
  credentials: BrokerCredentials
): Promise<BrokerTrade[]> {
  switch (credentials.broker) {
    case "kite":
      return fetchKiteTrades(credentials as KiteCredentials);
    case "fyers":
      return fetchFyersTrades(credentials as FyersCredentials);
    case "dhan":
      return fetchDhanTrades(credentials as DhanCredentials);
    default:
      throw new Error(`Unsupported broker: ${(credentials as any).broker}`);
  }
}
