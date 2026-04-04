// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/yield/GoodVault.sol";
import "../src/yield/VaultFactory.sol";
import "../src/yield/strategies/LendingStrategy.sol";
import "../src/yield/strategies/StablecoinStrategy.sol";

// ─── Mocks ──────────────────────────────────────────────────────────────────

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

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

contract MockUBIFeeSplitter {
    uint256 public totalFees;
    function splitFeeToken(uint256 totalFee, address, address token) external {
        MockERC20(token).transferFrom(msg.sender, address(this), totalFee);
        totalFees += totalFee;
    }
}

contract MockStrategy {
    address public asset;
    uint256 public deposited;
    uint256 public simulatedGrowth;
    bool public paused;

    constructor(address _asset) {
        asset = _asset;
    }

    function totalAssets() external view returns (uint256) {
        return deposited + simulatedGrowth;
    }

    function deposit(uint256 amount) external {
        MockERC20(asset).transferFrom(msg.sender, address(this), amount);
        deposited += amount;
    }

    function withdraw(uint256 amount) external returns (uint256) {
        if (amount > deposited + simulatedGrowth) amount = deposited + simulatedGrowth;
        deposited = deposited > amount ? deposited - amount : 0;
        MockERC20(asset).transfer(msg.sender, amount);
        return amount;
    }

    function harvest() external returns (uint256 profit, uint256 loss) {
        if (simulatedGrowth > 0) {
            profit = simulatedGrowth;
            // Mint the growth to simulate yield
            MockERC20(asset).mint(address(this), simulatedGrowth);
            deposited += simulatedGrowth;
            simulatedGrowth = 0;
        }
    }

    function emergencyWithdraw() external returns (uint256) {
        uint256 bal = deposited;
        MockERC20(asset).transfer(msg.sender, bal);
        deposited = 0;
        paused = true;
        return bal;
    }

    // Test helper: simulate yield growth
    function setGrowth(uint256 amount) external {
        simulatedGrowth = amount;
    }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

contract GoodYieldTest is Test {
    MockERC20 weth;
    MockUBIFeeSplitter ubiFee;
    MockStrategy strategy;
    GoodVault vault;
    VaultFactory factory;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        weth = new MockERC20("Wrapped ETH", "WETH");
        ubiFee = new MockUBIFeeSplitter();
        strategy = new MockStrategy(address(weth));

        vault = new GoodVault(
            address(weth),
            address(strategy),
            address(ubiFee),
            "GoodVault ETH-Lending",
            "gvETH",
            1000 ether
        );

        factory = new VaultFactory(address(ubiFee));

        // Mint tokens for testing
        weth.mint(alice, 100 ether);
        weth.mint(bob, 100 ether);

        // Approve vault
        vm.prank(alice);
        weth.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        weth.approve(address(vault), type(uint256).max);
    }

    // ─── Vault Basics ───

    function test_vaultMetadata() public view {
        assertEq(vault.name(), "GoodVault ETH-Lending");
        assertEq(vault.symbol(), "gvETH");
        assertEq(address(vault.asset()), address(weth));
    }

    function test_deposit() public {
        vm.prank(alice);
        uint256 shares = vault.deposit(10 ether, alice);

        assertEq(shares, 10 ether);
        assertEq(vault.balanceOf(alice), 10 ether);
        assertEq(vault.totalSupply(), 10 ether);
    }

    function test_depositDeploysToStrategy() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        // Assets should be in strategy
        assertEq(vault.totalDebt(), 10 ether);
        assertEq(strategy.deposited(), 10 ether);
    }

    function test_withdraw() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        vm.prank(alice);
        vault.withdraw(5 ether, alice, alice);

        assertEq(weth.balanceOf(alice), 95 ether); // 100 - 10 + 5
        assertEq(vault.balanceOf(alice), 5 ether);
    }

    function test_withdrawWithUnharvestedYield() public {
        // GOO-351: _ensureLiquidity totalDebt underflow when strategy has unharvested profit
        vm.prank(alice);
        vault.deposit(100 ether, alice);

        // Strategy earns 10 ETH (unharvested) => totalDebt=100, strategy.totalAssets()=110
        strategy.setGrowth(10 ether);

        // Alice redeems all shares — value includes the 10 ETH unharvested profit.
        // Previously caused arithmetic underflow: totalDebt(100) -= withdrawn(~110).
        uint256 shares = vault.balanceOf(alice);
        vm.prank(alice);
        vault.redeem(shares, alice, alice);

        // Funds returned, totalDebt floored at 0 (not underflowed)
        assertTrue(weth.balanceOf(alice) > 100 ether);
        assertEq(vault.totalDebt(), 0);
    }

    function test_redeem() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        vm.prank(alice);
        uint256 assets = vault.redeem(5 ether, alice, alice);

        assertEq(assets, 5 ether);
        assertEq(vault.balanceOf(alice), 5 ether);
    }

    function test_depositCapEnforced() public {
        weth.mint(alice, 2000 ether);
        vm.prank(alice);
        weth.approve(address(vault), type(uint256).max);

        vm.prank(alice);
        vm.expectRevert(GoodVault.DepositCapExceeded.selector);
        vault.deposit(1001 ether, alice);
    }

    function test_pausedVaultRejectsDeposit() public {
        vault.emergencyShutdown();

        vm.prank(alice);
        vm.expectRevert(GoodVault.Paused.selector);
        vault.deposit(10 ether, alice);
    }

    // ─── Harvest & Fees ───

    function test_harvest() public {
        vm.prank(alice);
        vault.deposit(100 ether, alice);

        // Simulate 10 ETH yield
        strategy.setGrowth(10 ether);
        vm.warp(block.timestamp + 1 hours);

        vault.harvest();

        // 20% performance fee → UBI = 2 ETH
        // Management fee ≈ tiny (2% annual on 100 ETH for 1 hour)
        assertTrue(ubiFee.totalFees() >= 2 ether);
        assertTrue(vault.totalUBIFunded() >= 2 ether);
    }

    function test_harvest_totalDebtSyncedAfterHarvest() public {
        vm.prank(alice);
        vault.deposit(100 ether, alice);

        // 10 ETH yield; performance fee = 20% → 2 ETH taken out of strategy
        strategy.setGrowth(10 ether);
        vm.warp(block.timestamp + 1 hours);
        vault.harvest();

        // totalDebt must equal strategy.totalAssets() after harvest:
        // principal (100) + profit (10) - fees withdrawn (~2 ETH + tiny mgmt fee)
        // i.e. totalDebt and strategy.totalAssets() track the same balance.
        assertEq(vault.totalDebt(), strategy.totalAssets());
    }

    function test_harvestWithNoYield() public {
        vm.prank(alice);
        vault.deposit(100 ether, alice);

        vm.warp(block.timestamp + 1 hours);

        vault.harvest();

        // No profit, so only management fees (tiny)
        assertEq(vault.totalGainSinceInception(), 0);
    }

    // ─── Multi-User ───

    function test_multiUserDeposit() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        vm.prank(bob);
        vault.deposit(20 ether, bob);

        assertEq(vault.totalSupply(), 30 ether);
        assertEq(vault.balanceOf(alice), 10 ether);
        assertEq(vault.balanceOf(bob), 20 ether);
    }

    function test_shareValueGrowsAfterHarvest() public {
        vm.prank(alice);
        vault.deposit(100 ether, alice);

        strategy.setGrowth(10 ether);
        vm.warp(block.timestamp + 1 hours);
        vault.harvest();

        // After harvest, 1 share should be worth more than 1 asset
        uint256 assetsPerShare = vault.convertToAssets(1 ether);
        assertTrue(assetsPerShare > 1 ether);
    }

    // ─── Strategy Migration ───

    function test_lendingStrategySetVault_onceOnly() public {
        MockERC20 asset2 = new MockERC20("Test", "TST");
        // Deploy with address(0) vault (chicken-and-egg scenario)
        LendingStrategy ls = new LendingStrategy(
            address(asset2),
            address(0), // lendPool (mock — not exercised here)
            address(0), // gToken
            address(0)  // vault placeholder
        );
        assertEq(ls.vault(), address(0));

        // First setVault call should succeed
        ls.setVault(address(vault));
        assertEq(ls.vault(), address(vault));

        // Second setVault call must revert (already set)
        vm.expectRevert("LendingStrategy: vault already set");
        ls.setVault(address(vault));
    }

    function test_lendingStrategySetVault_rejectsZero() public {
        MockERC20 asset2 = new MockERC20("Test", "TST");
        LendingStrategy ls = new LendingStrategy(address(asset2), address(0), address(0), address(0));
        vm.expectRevert("LendingStrategy: zero vault");
        ls.setVault(address(0));
    }

    function test_migrateStrategy() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        MockStrategy newStrategy = new MockStrategy(address(weth));

        vault.migrateStrategy(address(newStrategy));

        assertEq(vault.strategy(), address(newStrategy));
        // Assets should be moved to new strategy
        assertTrue(newStrategy.deposited() > 0);
    }

    // ─── Emergency ───

    function test_emergencyShutdown() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        vault.emergencyShutdown();

        assertTrue(vault.paused());
        assertEq(vault.totalDebt(), 0);
        // Vault should hold the WETH directly now
        assertEq(weth.balanceOf(address(vault)), 10 ether);
    }

    // ─── ERC-20 ───

    function test_transfer() public {
        vm.prank(alice);
        vault.deposit(10 ether, alice);

        vm.prank(alice);
        vault.transfer(bob, 5 ether);

        assertEq(vault.balanceOf(alice), 5 ether);
        assertEq(vault.balanceOf(bob), 5 ether);
    }

    function test_approve() public {
        vm.prank(alice);
        vault.approve(bob, 10 ether);

        assertEq(vault.allowance(alice, bob), 10 ether);
    }

    // ─── Factory ───

    function test_factoryCreateVault() public {
        MockStrategy s = new MockStrategy(address(weth));
        factory.approveStrategy(address(s));

        address v = factory.createVault(
            address(weth),
            address(s),
            "Test Vault",
            "tVault",
            100 ether
        );

        assertTrue(factory.isVault(v));
        assertEq(factory.vaultCount(), 1);
    }

    function test_factoryRejectsUnapprovedStrategy() public {
        MockStrategy s = new MockStrategy(address(weth));

        vm.expectRevert(VaultFactory.StrategyNotApproved.selector);
        factory.createVault(
            address(weth),
            address(s),
            "Test",
            "T",
            100 ether
        );
    }

    function test_factoryTotalTVL() public {
        MockStrategy s1 = new MockStrategy(address(weth));
        MockStrategy s2 = new MockStrategy(address(weth));
        factory.approveStrategy(address(s1));
        factory.approveStrategy(address(s2));

        address v1 = factory.createVault(address(weth), address(s1), "V1", "v1", 1000 ether);
        address v2 = factory.createVault(address(weth), address(s2), "V2", "v2", 1000 ether);

        // Deposit into v1
        weth.mint(address(this), 50 ether);
        weth.approve(v1, 50 ether);
        GoodVault(v1).deposit(50 ether, address(this));

        uint256 tvl = factory.totalTVL();
        assertEq(tvl, 50 ether);
    }

    function test_factoryVaultsByAsset() public {
        MockStrategy s = new MockStrategy(address(weth));
        factory.approveStrategy(address(s));

        factory.createVault(address(weth), address(s), "V1", "v1", 100 ether);
        factory.createVault(address(weth), address(s), "V2", "v2", 100 ether);

        address[] memory vaults = factory.getVaultsByAsset(address(weth));
        assertEq(vaults.length, 2);
    }

    // ─── Admin ───

    function test_setFees() public {
        vault.setFees(3000, 300); // 30% perf, 3% mgmt
        assertEq(vault.performanceFeeBPS(), 3000);
        assertEq(vault.managementFeeBPS(), 300);
    }

    function test_setFeesMaxLimit() public {
        vm.expectRevert();
        vault.setFees(6000, 200); // > 50% perf should revert
    }

    function test_unpause() public {
        vault.emergencyShutdown();
        assertTrue(vault.paused());

        vault.unpause();
        assertFalse(vault.paused());
    }
}
