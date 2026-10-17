import { test } from "node:test";
import assert from "node:assert/strict";
import { LendingMath } from "../dist/index.js";

const mockConfig = {
  asset: "USDC",
  decimals: 6,
  ltvBps: 7500,               // 75% max borrow
  liquidationThresholdBps: 8000, // 80% liquidation threshold
  liquidationBonusBps: 500,   // 5% bonus
  baseRateBps: 200,           // 2% base APY
  optimalUtilizationBps: 8000, // 80% kink
  rateSlope1Bps: 400,         // +4% at kink
  rateSlope2Bps: 6000,        // +60% beyond kink
  reserveFactorBps: 1000      // 10% protocol fee
};

test("1. Utilization rate calculation", () => {
  assert.equal(LendingMath.calculateUtilizationRate(0n, 100_000n), 0);
  assert.equal(LendingMath.calculateUtilizationRate(50_000n, 100_000n), 5000); // 50%
  assert.equal(LendingMath.calculateUtilizationRate(80_000n, 100_000n), 8000); // 80%
  assert.equal(LendingMath.calculateUtilizationRate(100_000n, 100_000n), 10000); // 100%
  assert.equal(LendingMath.calculateUtilizationRate(120_000n, 100_000n), 10000); // capped at 100%
});

test("2. Interest rate kink curve calculation", () => {
  // At 0% utilization: borrow rate = baseRate (200 bps = 2%)
  const rate0 = LendingMath.calculateInterestRates(0n, 100_000n, mockConfig);
  assert.equal(rate0.borrowRateBps, 200);
  assert.equal(rate0.supplyRateBps, 0);

  // At 40% utilization (halfway to kink): borrow rate = 200 + (40/80)*400 = 400 bps (4%)
  const rate40 = LendingMath.calculateInterestRates(40_000n, 100_000n, mockConfig);
  assert.equal(rate40.borrowRateBps, 400);

  // At 80% utilization (at kink): borrow rate = 200 + 400 = 600 bps (6%)
  const rate80 = LendingMath.calculateInterestRates(80_000n, 100_000n, mockConfig);
  assert.equal(rate80.borrowRateBps, 600);

  // At 90% utilization (beyond kink): borrow rate = 600 + (10/20)*6000 = 3600 bps (36%)
  const rate90 = LendingMath.calculateInterestRates(90_000n, 100_000n, mockConfig);
  assert.equal(rate90.borrowRateBps, 3600);
});

test("3. Health Factor & Liquidation criteria", () => {
  // $10,000 collateral, 80% threshold ($8,000 weighted), $4,000 debt -> HF = 2.0 (20,000 bps)
  const hfHealthy = LendingMath.calculateHealthFactor(10_000n, 8000, 4000n);
  assert.equal(hfHealthy, 20000);
  assert.equal(LendingMath.isLiquidatable(hfHealthy), false);

  // $10,000 collateral, 80% threshold ($8,000 weighted), $8,000 debt -> HF = 1.0 (10,000 bps)
  const hfBoundary = LendingMath.calculateHealthFactor(10_000n, 8000, 8000n);
  assert.equal(hfBoundary, 10000);
  assert.equal(LendingMath.isLiquidatable(hfBoundary), false);

  // $10,000 collateral, 80% threshold ($8,000 weighted), $8,500 debt -> HF = 0.9411 (9411 bps)
  const hfUnder = LendingMath.calculateHealthFactor(10_000n, 8000, 8500n);
  assert.ok(hfUnder < 10000);
  assert.equal(LendingMath.isLiquidatable(hfUnder), true);
});

test("4. Liquidation collateral calculation with bonus", () => {
  // Liquidator covers $1,000 debt with 5% bonus -> receives $1,050 of collateral
  const seized = LendingMath.calculateLiquidationCollateralToSeize(1000n, 500);
  assert.equal(seized, 1050n);
});
