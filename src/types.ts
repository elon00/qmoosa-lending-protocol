export interface ReserveConfig {
  asset: string;
  decimals: number;
  ltvBps: number;              // Loan-to-value in basis points (e.g. 7500 = 75%)
  liquidationThresholdBps: number; // e.g. 8000 = 80%
  liquidationBonusBps: number; // e.g. 500 = 5%
  baseRateBps: number;        // e.g. 200 = 2%
  optimalUtilizationBps: number; // e.g. 8000 = 80%
  rateSlope1Bps: number;      // e.g. 400 = 4%
  rateSlope2Bps: number;      // e.g. 6000 = 60%
  reserveFactorBps: number;   // e.g. 1000 = 10%
}

export interface UserAccountData {
  user: string;
  totalCollateralUsd: bigint;
  totalDebtUsd: bigint;
  availableBorrowsUsd: bigint;
  currentLiquidationThresholdBps: number;
  healthFactor: number;       // Scaled 1e18 or float representation
}

export interface InterestRateCalculation {
  utilizationRateBps: number;
  borrowRateBps: number;
  supplyRateBps: number;
}
