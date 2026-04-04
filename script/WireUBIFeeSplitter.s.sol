// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IGoodPool {
    function setFeeBeneficiary(address beneficiary) external;
    function feeBeneficiary() external view returns (address);
}

interface IUBIClaimV2 {
    function setFeeSplitter(address _feeSplitter) external;
    function feeSplitter() external view returns (address);
}

/**
 * @notice Wire new UBIFeeSplitter to all GoodPool instances and UBIClaimV2.
 *
 * Run after RedeployUBIAndLiFi.s.sol to complete the migration.
 *
 * GOO-243: deployed UBIFeeSplitter at 0xe7f172... was outdated (missing
 * claimableBalance/releaseToUBI). New splitter deployed by RedeployUBIAndLiFi:
 *   UBIFeeSplitter: 0xC0BF43A4Ca27e0976195E6661b099742f10507e5
 *
 * Usage:
 *   forge script script/WireUBIFeeSplitter.s.sol \
 *     --rpc-url http://localhost:8545 --broadcast
 */
contract WireUBIFeeSplitter is Script {
    // New UBIFeeSplitter (from RedeployUBIAndLiFi run 2026-04-04)
    address constant NEW_FEE_SPLITTER = 0xC0BF43A4Ca27e0976195E6661b099742f10507e5;

    // GoodPool instances (from CreateInitialPools deployment)
    address constant POOL_GD_WETH    = 0xA4899D35897033b927acFCf422bc745916139776;
    address constant POOL_GD_USDC    = 0xf953b3A269d80e3eB0F2947630Da976B896A8C5b;
    address constant POOL_WETH_USDC  = 0xAA292E8611aDF267e563f334Ee42320aC96D0463;

    // UBIClaimV2 (from RedeployGoodDollarToken run 2026-04-04)
    address constant UBI_CLAIM_V2    = 0x73C68f1f41e4890D06Ba3e71b9E9DfA555f1fb46;

    function run() external {
        uint256 key = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(key);

        // 1. Update feeBeneficiary on all three GoodPool instances
        IGoodPool(POOL_GD_WETH).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolGdWeth feeBeneficiary:", IGoodPool(POOL_GD_WETH).feeBeneficiary());

        IGoodPool(POOL_GD_USDC).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolGdUsdc feeBeneficiary:", IGoodPool(POOL_GD_USDC).feeBeneficiary());

        IGoodPool(POOL_WETH_USDC).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolWethUsdc feeBeneficiary:", IGoodPool(POOL_WETH_USDC).feeBeneficiary());

        // 2. Update UBIClaimV2's feeSplitter pointer
        IUBIClaimV2(UBI_CLAIM_V2).setFeeSplitter(NEW_FEE_SPLITTER);
        console.log("UBIClaimV2 feeSplitter:", IUBIClaimV2(UBI_CLAIM_V2).feeSplitter());

        vm.stopBroadcast();

        console.log("--- Wiring complete ---");
        console.log("New UBIFeeSplitter:", NEW_FEE_SPLITTER);
        console.log("Wired to: SwapPoolGdWeth, SwapPoolGdUsdc, SwapPoolWethUsdc, UBIClaimV2");
    }
}
