// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GoodDollarToken.sol";
import "../src/UBIFeeSplitter.sol";
import "../src/ValidatorStaking.sol";
import "../src/hooks/UBIFeeHook.sol";
import "../src/perps/PerpEngine.sol";
import "../src/perps/MarginVault.sol";
import "../src/perps/FundingRate.sol";
import "../src/predict/MarketFactory.sol";
import "../src/predict/ConditionalTokens.sol";
import "../src/stocks/SyntheticAssetFactory.sol";
import "../src/stocks/CollateralVault.sol";
import "../src/stocks/PriceOracle.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // === Core Protocol ===
        GoodDollarToken token = new GoodDollarToken(deployer, deployer, 1_000_000_000e18);
        console.log("GoodDollarToken:", address(token));

        UBIFeeSplitter splitter = new UBIFeeSplitter(address(token), deployer, deployer);
        console.log("UBIFeeSplitter:", address(splitter));

        ValidatorStaking staking = new ValidatorStaking(address(token), deployer);
        console.log("ValidatorStaking:", address(staking));

        // UBI Fee Hook (placeholder pool manager for devnet)
        address poolManager = address(0x1);
        UBIFeeHook hook = new UBIFeeHook(poolManager, address(splitter), 3333, deployer);
        console.log("UBIFeeHook:", address(hook));

        // Fund hook with G$
        token.transfer(address(hook), 10_000_000e18);

        // === GoodPerps ===
        FundingRate fundingRate = new FundingRate();
        console.log("FundingRate:", address(fundingRate));

        MarginVault marginVault = new MarginVault(address(splitter));
        console.log("MarginVault:", address(marginVault));

        PerpEngine perpEngine = new PerpEngine(address(marginVault), address(fundingRate), address(splitter), deployer);
        console.log("PerpEngine:", address(perpEngine));

        // === GoodPredict ===
        ConditionalTokens conditionalTokens = new ConditionalTokens();
        console.log("ConditionalTokens:", address(conditionalTokens));

        MarketFactory marketFactory = new MarketFactory(address(conditionalTokens), address(splitter), deployer);
        console.log("MarketFactory:", address(marketFactory));

        // === GoodStocks ===
        PriceOracle priceOracle = new PriceOracle(deployer);
        console.log("PriceOracle:", address(priceOracle));

        CollateralVault collateralVault = new CollateralVault(address(token), address(splitter));
        console.log("CollateralVault:", address(collateralVault));

        SyntheticAssetFactory stockFactory = new SyntheticAssetFactory(
            address(collateralVault),
            address(priceOracle),
            address(splitter),
            deployer
        );
        console.log("SyntheticAssetFactory:", address(stockFactory));

        vm.stopBroadcast();

        console.log("");
        console.log("=== ALL CONTRACTS DEPLOYED ===");
        console.log("Deployer:", deployer);
    }
}
