export interface ReserveConfig {
    asset: string;
    decimals: number;
    ltvBps: number;
    liquidationThresholdBps: number;
    liquidationBonusBps: number;
    baseRateBps: number;
    optimalUtilizationBps: number;
    rateSlope1Bps: number;
    rateSlope2Bps: number;
    reserveFactorBps: number;
}
export interface UserAccountData {
    user: string;
    totalCollateralUsd: bigint;
    totalDebtUsd: bigint;
    availableBorrowsUsd: bigint;
    currentLiquidationThresholdBps: number;
    healthFactor: number;
}
export interface InterestRateCalculation {
    utilizationRateBps: number;
    borrowRateBps: number;
    supplyRateBps: number;
}
