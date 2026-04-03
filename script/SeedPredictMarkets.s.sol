// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/predict/MarketFactory.sol";

/**
 * @title SeedPredictMarkets
 * @notice Creates initial prediction markets on the devnet MarketFactory.
 *         Also buys some YES/NO positions to seed liquidity and implied probabilities.
 */
contract SeedPredictMarkets is Script {
    MarketFactory constant factory = MarketFactory(0xc7cDb7A2E5dDa1B7A0E792Fe1ef08ED20A6F56D4);
    address constant GD = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    address constant DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // Approve factory to spend G$
        IPredictToken(GD).approve(address(factory), type(uint256).max);

        // Market 0: BTC $150K by end of 2026
        uint256 m0 = factory.createMarket(
            "Will Bitcoin reach $150K by end of 2026?",
            1798761599, // 2026-12-31
            DEPLOYER
        );
        factory.buy(m0, true, 7200e18);   // 7200 G$ on YES
        factory.buy(m0, false, 2800e18);  // 2800 G$ on NO → ~72% YES

        // Market 1: ETH above $10K in 2026
        uint256 m1 = factory.createMarket(
            "Will Ethereum trade above $10,000 in 2026?",
            1798761599,
            DEPLOYER
        );
        factory.buy(m1, true, 5500e18);
        factory.buy(m1, false, 4500e18);  // ~55% YES

        // Market 2: GoodDollar 1M daily claimers by 2027
        uint256 m2 = factory.createMarket(
            "Will GoodDollar reach 1M daily claimers by 2027?",
            1830297599, // 2027-12-31
            DEPLOYER
        );
        factory.buy(m2, true, 3500e18);
        factory.buy(m2, false, 6500e18);  // ~35% YES

        // Market 3: Fed rate below 3% by end of 2026
        uint256 m3 = factory.createMarket(
            "Will the Fed Funds rate be below 3% by Dec 2026?",
            1798761599,
            DEPLOYER
        );
        factory.buy(m3, true, 4200e18);
        factory.buy(m3, false, 5800e18);  // ~42% YES

        // Market 4: AGI achieved by 2030
        uint256 m4 = factory.createMarket(
            "Will AGI be achieved by 2030?",
            1924991999, // 2030-12-31
            DEPLOYER
        );
        factory.buy(m4, true, 1800e18);
        factory.buy(m4, false, 8200e18);  // ~18% YES

        // Market 5: eToro stock above $100 by end of 2026
        uint256 m5 = factory.createMarket(
            "Will eToro (ETOR) trade above $100 by end of 2026?",
            1798761599,
            DEPLOYER
        );
        factory.buy(m5, true, 6000e18);
        factory.buy(m5, false, 4000e18);  // ~60% YES

        // Market 6: AI agent manages $1B+ AUM by 2027
        uint256 m6 = factory.createMarket(
            "Will an AI trading agent manage over $1B AUM by 2027?",
            1830297599,
            DEPLOYER
        );
        factory.buy(m6, true, 2500e18);
        factory.buy(m6, false, 7500e18);  // ~25% YES

        // Market 7: SpaceX crewed Mars mission by 2030
        uint256 m7 = factory.createMarket(
            "Will SpaceX launch a crewed Mars mission by 2030?",
            1924991999,
            DEPLOYER
        );
        factory.buy(m7, true, 1200e18);
        factory.buy(m7, false, 8800e18);  // ~12% YES

        // Market 8: US passes stablecoin regulation in 2026
        uint256 m8 = factory.createMarket(
            "Will the US pass comprehensive stablecoin legislation in 2026?",
            1798761599,
            DEPLOYER
        );
        factory.buy(m8, true, 6800e18);
        factory.buy(m8, false, 3200e18);  // ~68% YES

        // Market 9: Nvidia surpasses $5T market cap in 2026
        uint256 m9 = factory.createMarket(
            "Will NVIDIA surpass $5 trillion market cap in 2026?",
            1798761599,
            DEPLOYER
        );
        factory.buy(m9, true, 4500e18);
        factory.buy(m9, false, 5500e18);  // ~45% YES

        console.log("Created 10 prediction markets with seeded liquidity");
        console.log("Market count:", factory.marketCount());

        vm.stopBroadcast();
    }
}
