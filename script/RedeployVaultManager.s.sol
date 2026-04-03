// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stable/VaultManager.sol";

/**
 * @title RedeployVaultManager
 * @notice Separate script for VaultManager to avoid interface collisions
 *         with CollateralVault (both define IUBIFeeSplitter).
 */
contract RedeployVaultManager is Script {
    address constant ADMIN           = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant UBI_FEE_SPLITTER= 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address constant GUSD_TOKEN      = 0x0E801D84Fa97b50751Dbf25036d067dCf18858bF;
    address constant COLLATERAL_REG  = 0x9d4454B023096f34B160D6B654540c56A1F81688;
    address constant STABLE_ORACLE   = 0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        VaultManager vm2 = new VaultManager(
            GUSD_TOKEN,
            COLLATERAL_REG,
            STABLE_ORACLE,
            UBI_FEE_SPLITTER,
            ADMIN,  // dAppRecipient
            ADMIN   // admin
        );
        console.log("VaultManager:", address(vm2));

        vm.stopBroadcast();
    }
}
