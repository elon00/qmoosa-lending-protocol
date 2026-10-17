export class LendingMath {
    static BPS_DIVISOR = 10000n;
    static HEALTH_FACTOR_PRECISION = 10_000; // 10000 = 1.0000
    static HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 10_000; // HF < 1.0 is liquidatable
    /**
     * Calculates the utilization rate in basis points:
     * U = (totalBorrows / totalDeposits) * 10_000
     */
    static calculateUtilizationRate(totalBorrows, totalDeposits) {
        if (totalDeposits === 0n) {
            return 0;
        }
        if (totalBorrows >= totalDeposits) {
            return 10_000;
        }
        const utilBps = (totalBorrows * this.BPS_DIVISOR) / totalDeposits;
        return Number(utilBps);
    }
    /**
     * Calculates the kinked interest rates:
     * If U <= U_optimal:
     *   R_borrow = R_base + (U / U_optimal) * R_slope1
     * If U > U_optimal:
     *   R_borrow = R_base + R_slope1 + ((U - U_optimal) / (1 - U_optimal)) * R_slope2
     * Supply Rate:
     *   R_supply = U * R_borrow * (1 - reserveFactor)
     */
    static calculateInterestRates(totalBorrows, totalDeposits, config) {
        const util = this.calculateUtilizationRate(totalBorrows, totalDeposits);
        let borrowRateBps = config.baseRateBps;
        if (util <= config.optimalUtilizationBps) {
            if (config.optimalUtilizationBps > 0) {
                const slopeExcess = Math.floor((util * config.rateSlope1Bps) / config.optimalUtilizationBps);
                borrowRateBps += slopeExcess;
            }
        }
        else {
            const excessUtil = util - config.optimalUtilizationBps;
            const remainingUtil = 10_000 - config.optimalUtilizationBps;
            borrowRateBps += config.rateSlope1Bps;
            if (remainingUtil > 0) {
                const slope2Excess = Math.floor((excessUtil * config.rateSlope2Bps) / remainingUtil);
                borrowRateBps += slope2Excess;
            }
        }
        // Supply rate = (util * borrowRate * (1 - reserveFactor)) / 10000^2
        const netMultiplier = 10_000 - config.reserveFactorBps;
        const supplyRateBps = Math.floor((util * borrowRateBps * netMultiplier) / (10_000 * 10_000));
        return {
            utilizationRateBps: util,
            borrowRateBps,
            supplyRateBps
        };
    }
    /**
     * Calculates user Health Factor in basis points (10,000 = 1.0000):
     * HF = (totalCollateralUsd * liquidationThresholdBps) / totalDebtUsd
     */
    static calculateHealthFactor(totalCollateralUsd, liquidationThresholdBps, totalDebtUsd) {
        if (totalDebtUsd === 0n) {
            return 1_000_000; // Practically infinite health factor
        }
        const weightedCollateral = (totalCollateralUsd * BigInt(liquidationThresholdBps)) / this.BPS_DIVISOR;
        const hf = (weightedCollateral * BigInt(this.HEALTH_FACTOR_PRECISION)) / totalDebtUsd;
        return Number(hf);
    }
    /**
     * Checks if an account is eligible for liquidation (HF < 1.0000).
     */
    static isLiquidatable(healthFactor) {
        return healthFactor < this.HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
    }
    /**
     * Calculates maximum borrowable amount given collateral and LTV.
     */
    static calculateMaxBorrow(totalCollateralUsd, ltvBps) {
        return (totalCollateralUsd * BigInt(ltvBps)) / this.BPS_DIVISOR;
    }
    /**
     * Calculates liquidation reward collateral given debt repaid and bonus.
     */
    static calculateLiquidationCollateralToSeize(debtToCoverUsd, liquidationBonusBps) {
        const bonusMultiplier = this.BPS_DIVISOR + BigInt(liquidationBonusBps);
        return (debtToCoverUsd * bonusMultiplier) / this.BPS_DIVISOR;
    }
}
