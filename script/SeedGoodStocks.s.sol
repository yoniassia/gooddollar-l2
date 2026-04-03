// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/PriceOracle.sol";
import "../src/stocks/CollateralVault.sol";
import "../src/stocks/SyntheticAssetFactory.sol";
import "../src/stocks/SyntheticAsset.sol";
import "../src/GoodDollarToken.sol";

/**
 * @title SeedGoodStocks
 * @notice Seeds the GoodStocks system with initial positions.
 *         Deposits G$ collateral and mints the first 4 flagship synthetic stocks
 *         (sAAPL, sTSLA, sNVDA, sGOOG) so the frontend shows real positions.
 *
 * Usage:
 *   PRIVATE_KEY=0x... \
 *   GOOD_DOLLAR_TOKEN=0x... \
 *   COLLATERAL_VAULT=0x... \
 *   forge script script/SeedGoodStocks.s.sol --rpc-url $RPC --broadcast --legacy
 */
contract SeedGoodStocks is Script {
    struct SeedPosition {
        string ticker;
        uint256 collateralG;  // G$ to deposit (18 decimals)
        uint256 shares;       // Synthetic shares to mint (18 decimals, 1e18 = 1 share)
    }

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address gdToken = vm.envAddress("GOOD_DOLLAR_TOKEN");
        address vaultAddr = vm.envAddress("COLLATERAL_VAULT");

        CollateralVault vault = CollateralVault(vaultAddr);
        GoodDollarToken gd = GoodDollarToken(gdToken);

        // Seed positions: deposit generous collateral, mint a few shares each
        SeedPosition[] memory positions = new SeedPosition[](4);
        positions[0] = SeedPosition("AAPL",  50_000e18, 10e18);  // 10 sAAPL
        positions[1] = SeedPosition("TSLA",  75_000e18, 10e18);  // 10 sTSLA
        positions[2] = SeedPosition("NVDA", 250_000e18, 10e18);  // 10 sNVDA
        positions[3] = SeedPosition("GOOGL", 50_000e18, 10e18);  // 10 sGOOGL

        vm.startBroadcast(deployerKey);

        // Approve vault to spend G$
        gd.approve(vaultAddr, type(uint256).max);

        for (uint256 i = 0; i < positions.length; i++) {
            SeedPosition memory pos = positions[i];

            // Deposit collateral
            vault.depositCollateral(pos.ticker, pos.collateralG);
            console.log(string.concat("Deposited ", vm.toString(pos.collateralG / 1e18), " G$ for ", pos.ticker));

            // Mint synthetic shares
            vault.mint(pos.ticker, pos.shares);
            console.log(string.concat("Minted ", vm.toString(pos.shares / 1e18), " s", pos.ticker));
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== GoodStocks Seeding Complete ===");
        console.log("Positions created: 4 (sAAPL, sTSLA, sNVDA, sGOOGL)");
    }
}
