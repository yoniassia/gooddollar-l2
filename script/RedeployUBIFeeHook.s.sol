// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/hooks/UBIFeeHook.sol";

/**
 * @title RedeployUBIFeeHook
 * @notice Redeploys UBIFeeHook with the correct poolManager address.
 *
 * The previously deployed UBIFeeHook (0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9)
 * was constructed with poolManager = address(0x1) — a sentinel/placeholder that
 * made the afterSwap modifier always revert (requires msg.sender == poolManager).
 * Result: totalSwapsProcessed = 0, totalUBIFees = 0 across all pools (GOO-205).
 *
 * Since poolManager is immutable the fix requires redeployment with the correct
 * poolManager = GoodSwapRouter (0xaC9fCBA56E42d5960f813B9D0387F3D3bC003338).
 *
 * Constructor params preserved from the broken deployment:
 *   _ubiPool        = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 (UBIFeeSplitter)
 *   _ubiFeeShareBPS = 3333 (33.33%)
 *   _admin          = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 *
 * After running this script:
 *   1. Update op-stack/addresses.json: UBIFeeHook → new address
 *   2. Verify afterSwap fires on a test GoodPool swap
 *   3. Tester Alpha will re-run swap tests to confirm (GOO-205)
 *
 * Usage (devnet):
 *   PRIVATE_KEY=<key> \
 *     forge script script/RedeployUBIFeeHook.s.sol \
 *     --rpc-url $DEVNET_RPC --broadcast --legacy
 */
contract RedeployUBIFeeHook is Script {
    // ── Existing devnet addresses ─────────────────────────────────────────────
    address constant GOOD_SWAP_ROUTER = 0xaC9fCBA56E42d5960f813B9D0387F3D3bC003338;
    address constant UBI_FEE_SPLITTER = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    // ── Preserved constructor params ──────────────────────────────────────────
    uint256 constant UBI_FEE_BPS = 3333;  // 33.33%

    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        UBIFeeHook hook = new UBIFeeHook(
            GOOD_SWAP_ROUTER,  // poolManager — GoodSwapRouter, not 0x1 sentinel
            UBI_FEE_SPLITTER,  // ubiPool — UBIFeeSplitter
            UBI_FEE_BPS,       // 33.33%
            deployer           // admin
        );

        vm.stopBroadcast();

        console.log("=== UBIFeeHook Redeployment Complete ===");
        console.log("Old UBIFeeHook (BROKEN):  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
        console.log("New UBIFeeHook (FIXED):  ", address(hook));
        console.log("poolManager:             ", GOOD_SWAP_ROUTER);
        console.log("ubiPool:                 ", UBI_FEE_SPLITTER);
        console.log("ubiFeeShareBPS:          ", UBI_FEE_BPS);
        console.log("");
        console.log("TODO: Update op-stack/addresses.json: UBIFeeHook ->", address(hook));
        console.log("TODO: Verify afterSwap fires on a test GoodPool swap");
    }
}
