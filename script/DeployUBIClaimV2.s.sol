// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UBIClaimV2.sol";
import "../src/GoodDollarToken.sol";

/**
 * @notice Deploy UBIClaimV2 and wire it to GoodDollarToken + UBIFeeSplitter.
 *
 * Steps:
 *   1. Deploy UBIClaimV2 with GoodDollarToken, UBIFeeSplitter, and deployer as admin.
 *   2. Grant UBIClaimV2 the minter role on GoodDollarToken (setMinter).
 *   3. Set deployer as initial trusted relayer so gas-free claims can begin.
 *
 * Usage (devnet):
 *   forge script script/DeployUBIClaimV2.s.sol \
 *     --rpc-url http://localhost:8545 --broadcast
 *
 * GOO-234: UBIClaimV2 was present in src/ but had no deployment script and
 * GoodDollarToken had not granted it MINTER_ROLE — this script fixes both gaps.
 */
contract DeployUBIClaimV2 is Script {
    // Devnet addresses (op-stack/addresses.json + GOO-238 redeployment)
    address constant GOOD_DOLLAR_TOKEN = 0x6533158b042775e2FdFeF3cA1a782EFDbB8EB9b1;
    address constant UBI_FEE_SPLITTER  = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    function run() external {
        uint256 key = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(key);

        vm.startBroadcast(key);

        // 1. Deploy UBIClaimV2
        UBIClaimV2 ubiClaim = new UBIClaimV2(
            GOOD_DOLLAR_TOKEN,
            UBI_FEE_SPLITTER,
            deployer
        );
        console.log("UBIClaimV2 deployed:", address(ubiClaim));

        // 2. Grant MINTER_ROLE on GoodDollarToken
        GoodDollarToken(GOOD_DOLLAR_TOKEN).setMinter(address(ubiClaim), true);
        console.log("Minter role granted to UBIClaimV2");

        // 3. Set deployer as initial trusted relayer
        ubiClaim.setRelayer(deployer, true);
        console.log("Deployer set as trusted relayer:", deployer);

        vm.stopBroadcast();

        console.log("--- UBIClaimV2 deployment complete ---");
        console.log("Address:", address(ubiClaim));
        console.log("GoodDollarToken:", GOOD_DOLLAR_TOKEN);
        console.log("UBIFeeSplitter:", UBI_FEE_SPLITTER);
        console.log("Admin/Relayer:", deployer);
    }
}
