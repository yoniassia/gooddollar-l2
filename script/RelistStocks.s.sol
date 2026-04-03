// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/SyntheticAssetFactory.sol";
import "../src/stocks/CollateralVault.sol";
import "../src/stocks/PriceOracle.sol";

/**
 * @title RelistStocks
 * @notice Re-lists all 12 synthetic stocks on redeployed Factory + Vault,
 *         and sets manual prices on the existing (verified) PriceOracle.
 */
contract RelistStocks is Script {
    address constant FACTORY = 0xd9140951d8aE6E5F625a02F5908535e16e3af964;
    address constant VAULT   = 0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5;
    address constant ORACLE  = 0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A;

    struct Stock { string ticker; string name; uint256 price; }

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        SyntheticAssetFactory factory = SyntheticAssetFactory(FACTORY);
        CollateralVault vault = CollateralVault(VAULT);
        PriceOracle oracle = PriceOracle(ORACLE);

        Stock[12] memory stocks = [
            Stock("AAPL",  "Apple Inc.",              178_72_000_000),
            Stock("TSLA",  "Tesla Inc.",              248_50_000_000),
            Stock("NVDA",  "NVIDIA Corp.",            875_30_000_000),
            Stock("MSFT",  "Microsoft Corp.",         415_60_000_000),
            Stock("AMZN",  "Amazon.com Inc.",         182_15_000_000),
            Stock("GOOGL", "Alphabet Inc.",           155_80_000_000),
            Stock("META",  "Meta Platforms",          503_25_000_000),
            Stock("JPM",   "JPMorgan Chase",          198_40_000_000),
            Stock("V",     "Visa Inc.",               278_90_000_000),
            Stock("DIS",   "Walt Disney Co.",          98_45_000_000),
            Stock("NFLX",  "Netflix Inc.",            625_10_000_000),
            Stock("AMD",   "Advanced Micro Devices",  162_35_000_000)
        ];

        for (uint256 i = 0; i < stocks.length; i++) {
            string memory sName = string.concat("Synthetic ", stocks[i].name);
            address sToken = factory.listAsset(stocks[i].ticker, sName, address(vault));
            vault.registerAsset(stocks[i].ticker, sToken);
            oracle.setManualPrice(stocks[i].ticker, stocks[i].price, true);
            console.log(string.concat("s", stocks[i].ticker, ":"), sToken);
        }

        vm.stopBroadcast();
    }
}
