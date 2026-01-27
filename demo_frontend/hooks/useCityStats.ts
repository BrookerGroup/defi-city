"use client";

import { useMemo } from "react";
import { WalletAsset } from "./useWalletBalances";
import { formatUnits } from "viem";

interface CityStats {
  totalValue: string; // Total USD value
  totalValueETH: string; // Total ETH value
  apr: string; // Annual Percentage Rate
  yieldPerDay: string; // Daily yield in USD
}

// Mock prices for demo - should be replaced with real price feed
const MOCK_PRICES = {
  ETH: 3000, // $3000 per ETH
  USDC: 1, // $1 per USDC
};

// Mock APR - should be calculated from building yields
const MOCK_APR = 5.25; // 5.25%

/**
 * Calculate city statistics from Smart Wallet assets
 */
export function useCityStats(assets: WalletAsset[]): CityStats {
  const stats = useMemo(() => {
    // Calculate total value in USD
    let totalValueUSD = 0;
    let totalValueETH = 0;

    assets.forEach((asset) => {
      const balance = parseFloat(asset.balance);
      const price = MOCK_PRICES[asset.symbol as keyof typeof MOCK_PRICES] || 0;
      const valueUSD = balance * price;

      totalValueUSD += valueUSD;

      // Calculate ETH equivalent
      if (asset.symbol === "ETH") {
        totalValueETH += balance;
      } else {
        totalValueETH += valueUSD / MOCK_PRICES.ETH;
      }
    });

    // Calculate yield per day
    const yieldPerDayUSD = (totalValueUSD * MOCK_APR) / 100 / 365;

    return {
      totalValue: totalValueUSD.toFixed(2),
      totalValueETH: totalValueETH.toFixed(4),
      apr: MOCK_APR.toFixed(2),
      yieldPerDay: yieldPerDayUSD.toFixed(2),
    };
  }, [assets]);

  return stats;
}
