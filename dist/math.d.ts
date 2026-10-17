import { ReserveConfig, InterestRateCalculation } from "./types.js";
export declare class LendingMath {
    static readonly BPS_DIVISOR = 10000n;
    static readonly HEALTH_FACTOR_PRECISION = 10000;
    static readonly HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 10000;
    /**
     * Calculates the utilization rate in basis points:
     * U = (totalBorrows / totalDeposits) * 10_000
     */
    static calculateUtilizationRate(totalBorrows: bigint, totalDeposits: bigint): number;
    /**
     * Calculates the kinked interest rates:
     * If U <= U_optimal:
     *   R_borrow = R_base + (U / U_optimal) * R_slope1
     * If U > U_optimal:
     *   R_borrow = R_base + R_slope1 + ((U - U_optimal) / (1 - U_optimal)) * R_slope2
     * Supply Rate:
     *   R_supply = U * R_borrow * (1 - reserveFactor)
     */
    static calculateInterestRates(totalBorrows: bigint, totalDeposits: bigint, config: ReserveConfig): InterestRateCalculation;
    /**
     * Calculates user Health Factor in basis points (10,000 = 1.0000):
     * HF = (totalCollateralUsd * liquidationThresholdBps) / totalDebtUsd
     */
    static calculateHealthFactor(totalCollateralUsd: bigint, liquidationThresholdBps: number, totalDebtUsd: bigint): number;
    /**
     * Checks if an account is eligible for liquidation (HF < 1.0000).
     */
    static isLiquidatable(healthFactor: number): boolean;
    /**
     * Calculates maximum borrowable amount given collateral and LTV.
     */
    static calculateMaxBorrow(totalCollateralUsd: bigint, ltvBps: number): bigint;
    /**
     * Calculates liquidation reward collateral given debt repaid and bonus.
     */
    static calculateLiquidationCollateralToSeize(debtToCoverUsd: bigint, liquidationBonusBps: number): bigint;
}
