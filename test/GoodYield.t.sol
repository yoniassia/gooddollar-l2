// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/yield/GoodVault.sol";
import "../src/yield/VaultFactory.sol";

// ─── Mock Token ───
contract MockToken {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ─── Mock Strategy ───
contract MockStrategy {
    address public asset;
    uint256 public deposited;
    uint256 public simulatedProfit;
    bool public paused;

    constructor(address _asset) {
        asset = _asset;
    }

    function totalAssets() external view returns (uint256) {
        return deposited + simulatedProfit;
    }

    function deposit(uint256 amount) external {
        MockToken(asset).transferFrom(msg.sender, address(this), amount);
        deposited += amount;
    }

    function withdraw(uint256 amount) external returns (uint256) {
        uint256 available = deposited + simulatedProfit;
        if (amount > available) amount = available;
        MockToken(asset).transfer(msg.sender, amount);
        if (amount <= deposited) {
            deposited -= amount;
        } else {
            simulatedProfit -= (amount - deposited);
            deposited = 0;
        }
        return amount;
    }

    function harvest() external returns (uint256 profit, uint256 loss) {
        profit = simulatedProfit;
        loss = 0;
        // profit stays in strategy, vault will withdraw fees
    }

    function emergencyWithdraw() external returns (uint256) {
        uint256 total = deposited + simulatedProfit;
        MockToken(asset).transfer(msg.sender, total);
        deposited = 0;
        simulatedProfit = 0;
        paused = true;
        return total;
    }

    // Test helper: simulate yield
    function addProfit(uint256 amount) external {
        MockToken(asset).mint(address(this), amount);
        simulatedProfit += amount;
    }
}

// ─── Mock UBI Fee Splitter ───
contract MockUBIFee {
    uint256 public totalReceived;
    address public lastToken;

    function splitFeeToken(address token, uint256 amount, address) external {
        MockToken(token).transferFrom(msg.sender, address(this), amount);
        totalReceived += amount;
        lastToken = token;
    }
}

contract GoodYieldTest is Test {
    MockToken token;
    MockStrategy strategy;
    MockUBIFee ubiFee;
    GoodVault vault;
    VaultFactory factory;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        token = new MockToken();
        strategy = new MockStrategy(address(token));
        ubiFee = new MockUBIFee();

        vault = new GoodVault(
            address(token),
            address(strategy),
            address(ubiFee),
            "GoodYield MOCK",
            "gyMOCK",
            1_000_000 ether
        );

        // Fund users
        token.mint(alice, 100_000 ether);
        token.mint(bob, 50_000 ether);

        // Approve
        vm.prank(alice);
        token.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        token.approve(address(vault), type(uint256).max);
    }

    // ═══════════════════════════════════════════════════
    // Deposit & Withdraw
    // ═══════════════════════════════════════════════════

    function test_deposit_basic() public {
        vm.prank(alice);
        uint256 shares = vault.deposit(1000 ether, alice);

        assertEq(shares, 1000 ether, "first deposit: 1:1 shares");
        assertEq(vault.balanceOf(alice), 1000 ether);
        assertEq(vault.totalSupply(), 1000 ether);
        assertEq(vault.totalAssets(), 1000 ether);
    }

    function test_deposit_deploys_to_strategy() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        // All funds should be in strategy
        assertEq(token.balanceOf(address(vault)), 0);
        assertEq(vault.totalDebt(), 1000 ether);
    }

    function test_deposit_multiple_users() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vm.prank(bob);
        vault.deposit(500 ether, bob);

        assertEq(vault.totalSupply(), 1500 ether);
        assertEq(vault.totalAssets(), 1500 ether);
        assertEq(vault.balanceOf(alice), 1000 ether);
        assertEq(vault.balanceOf(bob), 500 ether);
    }

    function test_withdraw_basic() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vm.prank(alice);
        vault.withdraw(500 ether, alice, alice);

        assertEq(vault.balanceOf(alice), 500 ether);
        assertEq(token.balanceOf(alice), 99_500 ether);
    }

    function test_withdraw_all() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vm.prank(alice);
        vault.redeem(1000 ether, alice, alice);

        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalSupply(), 0);
        assertEq(token.balanceOf(alice), 100_000 ether);
    }

    function test_deposit_zero_reverts() public {
        vm.expectRevert(GoodVault.ZeroAssets.selector);
        vm.prank(alice);
        vault.deposit(0, alice);
    }

    function test_withdraw_zero_reverts() public {
        vm.expectRevert(GoodVault.ZeroAssets.selector);
        vm.prank(alice);
        vault.withdraw(0, alice, alice);
    }

    // ═══════════════════════════════════════════════════
    // Share Math After Yield
    // ═══════════════════════════════════════════════════

    function test_shares_appreciate_with_profit() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        // Simulate 100 ETH profit in strategy
        strategy.addProfit(100 ether);

        // Shares should now be worth more
        uint256 assetsPerShare = vault.convertToAssets(1 ether);
        assertGt(assetsPerShare, 1 ether, "shares should appreciate");

        // Alice's shares should be worth ~1100 ETH
        uint256 aliceAssets = vault.convertToAssets(vault.balanceOf(alice));
        assertApproxEqAbs(aliceAssets, 1100 ether, 1);
    }

    function test_new_depositor_gets_fewer_shares() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        // Add profit
        strategy.addProfit(100 ether);

        // Bob deposits same amount but gets fewer shares
        vm.prank(bob);
        uint256 bobShares = vault.deposit(1100 ether, bob);

        // Bob should get ~1000 shares (same as alice) since vault grew
        assertApproxEqAbs(bobShares, 1000 ether, 1 ether);
    }

    // ═══════════════════════════════════════════════════
    // Harvest & UBI Fees
    // ═══════════════════════════════════════════════════

    function test_harvest_routes_fees_to_ubi() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        // Simulate profit
        strategy.addProfit(100 ether);

        // Advance time for management fee
        vm.warp(block.timestamp + 30 days);

        vault.harvest();

        // Performance fee: 20% of 100 = 20 ETH
        // Management fee: 2% annual on 1000 ETH for 30 days ≈ 1.64 ETH
        // Total to UBI: ~21.64 ETH
        assertGt(ubiFee.totalReceived(), 20 ether, "UBI should get at least perf fee");
        assertGt(vault.totalUBIFunded(), 0, "totalUBIFunded should track");
    }

    function test_harvest_no_profit() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vault.harvest();

        assertEq(ubiFee.totalReceived(), 0, "no fees when no profit");
    }

    // ═══════════════════════════════════════════════════
    // Deposit Cap
    // ═══════════════════════════════════════════════════

    function test_deposit_cap_enforced() public {
        vault.setDepositCap(500 ether);

        vm.prank(alice);
        vault.deposit(500 ether, alice);

        vm.expectRevert(GoodVault.DepositCapExceeded.selector);
        vm.prank(bob);
        vault.deposit(1 ether, bob);
    }

    // ═══════════════════════════════════════════════════
    // Pause & Emergency
    // ═══════════════════════════════════════════════════

    function test_emergency_shutdown() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        assertEq(vault.totalDebt(), 1000 ether);

        vault.emergencyShutdown();

        assertTrue(vault.paused());
        assertEq(vault.totalDebt(), 0);
        assertEq(token.balanceOf(address(vault)), 1000 ether, "funds returned to vault");
    }

    function test_deposit_when_paused_reverts() public {
        vault.emergencyShutdown();

        vm.expectRevert(GoodVault.Paused.selector);
        vm.prank(alice);
        vault.deposit(100 ether, alice);
    }

    function test_withdraw_when_paused_works() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vault.emergencyShutdown();

        // Withdraw should still work
        vm.prank(alice);
        vault.redeem(1000 ether, alice, alice);
        assertEq(token.balanceOf(alice), 100_000 ether);
    }

    function test_unpause() public {
        vault.emergencyShutdown();
        assertTrue(vault.paused());
        vault.unpause();
        assertFalse(vault.paused());
    }

    // ═══════════════════════════════════════════════════
    // Strategy Migration
    // ═══════════════════════════════════════════════════

    function test_migrate_strategy() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        MockStrategy newStrategy = new MockStrategy(address(token));
        vault.migrateStrategy(address(newStrategy));

        assertEq(vault.strategy(), address(newStrategy));
        assertEq(vault.totalDebt(), 1000 ether, "debt redeployed");
    }

    function test_migrate_wrong_asset_reverts() public {
        MockToken otherToken = new MockToken();
        MockStrategy badStrategy = new MockStrategy(address(otherToken));

        vm.expectRevert(GoodVault.StrategyAssetMismatch.selector);
        vault.migrateStrategy(address(badStrategy));
    }

    // ═══════════════════════════════════════════════════
    // ERC-20 Functions
    // ═══════════════════════════════════════════════════

    function test_transfer_shares() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vm.prank(alice);
        vault.transfer(bob, 500 ether);

        assertEq(vault.balanceOf(alice), 500 ether);
        assertEq(vault.balanceOf(bob), 500 ether);
    }

    function test_approve_and_transferFrom() public {
        vm.prank(alice);
        vault.deposit(1000 ether, alice);

        vm.prank(alice);
        vault.approve(bob, 500 ether);

        vm.prank(bob);
        vault.transferFrom(alice, bob, 500 ether);

        assertEq(vault.balanceOf(alice), 500 ether);
        assertEq(vault.balanceOf(bob), 500 ether);
    }

    // ═══════════════════════════════════════════════════
    // Admin
    // ═══════════════════════════════════════════════════

    function test_only_admin_can_set_fees() public {
        vm.expectRevert(GoodVault.NotAdmin.selector);
        vm.prank(alice);
        vault.setFees(1000, 100);
    }

    function test_set_fees() public {
        vault.setFees(1000, 100);
        assertEq(vault.performanceFeeBPS(), 1000);
        assertEq(vault.managementFeeBPS(), 100);
    }

    function test_transfer_admin() public {
        vault.transferAdmin(alice);
        assertEq(vault.pendingAdmin(), alice);

        vm.prank(alice);
        vault.acceptAdmin();
        assertEq(vault.admin(), alice);
    }

    // ═══════════════════════════════════════════════════
    // VaultFactory
    // ═══════════════════════════════════════════════════

    function test_factory_create_vault() public {
        factory = new VaultFactory(address(ubiFee));

        // Approve strategy first
        factory.approveStrategy(address(strategy));

        address newVault = factory.createVault(
            address(token),
            address(strategy),
            "GoodYield ETH",
            "gyETH",
            0
        );

        assertTrue(factory.isVault(newVault));
        assertEq(factory.vaultCount(), 1);
        assertEq(factory.allVaults(0), newVault);
    }

    function test_factory_unapproved_strategy_reverts() public {
        factory = new VaultFactory(address(ubiFee));

        vm.expectRevert(VaultFactory.StrategyNotApproved.selector);
        factory.createVault(address(token), address(strategy), "Test", "TST", 0);
    }

    function test_factory_tvl_tracking() public {
        factory = new VaultFactory(address(ubiFee));
        factory.approveStrategy(address(strategy));

        address v1 = factory.createVault(address(token), address(strategy), "V1", "V1", 0);

        vm.prank(alice);
        token.approve(v1, type(uint256).max);
        vm.prank(alice);
        GoodVault(v1).deposit(1000 ether, alice);

        assertEq(factory.totalTVL(), 1000 ether);
    }

    function test_factory_vaults_by_asset() public {
        factory = new VaultFactory(address(ubiFee));
        factory.approveStrategy(address(strategy));

        factory.createVault(address(token), address(strategy), "V1", "V1", 0);
        factory.createVault(address(token), address(strategy), "V2", "V2", 0);

        address[] memory vaults = factory.getVaultsByAsset(address(token));
        assertEq(vaults.length, 2);
    }
}
