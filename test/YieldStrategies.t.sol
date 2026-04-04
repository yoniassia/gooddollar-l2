// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/yield/strategies/LendingStrategy.sol";
import "../src/yield/strategies/StablecoinStrategy.sol";

// ─── Shared Mock ERC-20 ─────────────────────────────────────────────────────

contract MockToken {
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

    function burn(address from, uint256 amount) external {
        balanceOf[from] -= amount;
        totalSupply -= amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "insufficient");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ─── LendingStrategy Mocks ──────────────────────────────────────────────────

/// @dev Mock gToken: balanceOf returns `_balance[user]`, settable for testing
contract MockGToken {
    mapping(address => uint256) private _balance;
    mapping(address => uint256) private _scaledBalance;

    function setBalance(address who, uint256 amount) external {
        _balance[who] = amount;
    }

    function balanceOf(address who) external view returns (uint256) {
        return _balance[who];
    }

    function scaledBalanceOf(address who) external view returns (uint256) {
        return _scaledBalance[who];
    }
}

/// @dev Mock GoodLend pool: records calls, forwards asset tokens in/out
contract MockLendPool {
    MockToken public asset;
    MockGToken public gToken;

    // track supply/withdraw calls
    uint256 public totalSupplied;
    uint256 public totalWithdrawn;

    constructor(address _asset, address _gToken) {
        asset = MockToken(_asset);
        gToken = MockGToken(_gToken);
    }

    function supply(address, uint256 amount, address onBehalfOf) external {
        // pull asset from caller, reflect in gToken balance
        asset.transferFrom(msg.sender, address(this), amount);
        uint256 prev = gToken.balanceOf(onBehalfOf);
        gToken.setBalance(onBehalfOf, prev + amount);
        totalSupplied += amount;
    }

    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        // burn gToken balance, send asset to `to`
        uint256 prev = gToken.balanceOf(msg.sender);
        if (amount > prev) amount = prev;
        gToken.setBalance(msg.sender, prev - amount);
        asset.mint(to, amount); // simulate pool liquidity
        totalWithdrawn += amount;
        return amount;
    }

    function getReserveData(address) external pure returns (
        uint256, uint256, uint256, uint256, uint256, uint256,
        address, address, address, uint256, bool, bool, uint256
    ) {
        return (0, 0, 0, 0, 0, 0, address(0), address(0), address(0), 0, true, false, 0);
    }
}

// ─── StablecoinStrategy Mocks ────────────────────────────────────────────────

contract MockStabilityPool {
    MockToken public asset;
    mapping(address => uint256) private _depositorBal;
    mapping(address => uint256) private _depositorGain;
    uint256 public totalDeposited;

    constructor(address _asset) {
        asset = MockToken(_asset);
    }

    function setGain(address who, uint256 gain) external {
        _depositorGain[who] = gain;
    }

    /// @dev Simulate balance shrinkage (e.g. partial liquidation loss)
    function setDepositorBalance(address who, uint256 bal) external {
        _depositorBal[who] = bal;
    }

    function deposit(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        _depositorBal[msg.sender] += amount;
        totalDeposited += amount;
    }

    function withdraw(uint256 amount) external {
        require(_depositorBal[msg.sender] >= amount, "insufficient");
        _depositorBal[msg.sender] -= amount;
        asset.mint(msg.sender, amount);
        totalDeposited -= amount;
    }

    function getDepositorBalance(address who) external view returns (uint256) {
        return _depositorBal[who];
    }

    function getDepositorGain(address who) external view returns (uint256) {
        return _depositorGain[who];
    }

    function claimGains() external returns (uint256) {
        uint256 gain = _depositorGain[msg.sender];
        _depositorGain[msg.sender] = 0;
        return gain;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LendingStrategy Tests
// ═══════════════════════════════════════════════════════════════════════════

contract LendingStrategyTest is Test {
    MockToken asset;
    MockGToken gToken;
    MockLendPool lendPool;
    LendingStrategy strategy;

    address vault = address(0xDEAD1);

    function setUp() public {
        asset = new MockToken("MockUSDC", "mUSDC");
        gToken = new MockGToken();
        lendPool = new MockLendPool(address(asset), address(gToken));

        strategy = new LendingStrategy(
            address(asset),
            address(lendPool),
            address(gToken),
            vault
        );

        // Seed vault with funds and give strategy allowance
        asset.mint(vault, 1000 ether);
        vm.prank(vault);
        asset.approve(address(strategy), type(uint256).max);
    }

    // ─── Metadata ───────────────────────────────────────────────────────────

    function test_assetAddress() public view {
        assertEq(strategy.asset(), address(asset));
    }

    function test_vaultAddress() public view {
        assertEq(strategy.vault(), vault);
    }

    // ─── Deposit ────────────────────────────────────────────────────────────

    function test_deposit() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        assertEq(strategy.totalDeposited(), 100 ether);
        assertEq(lendPool.totalSupplied(), 100 ether);
    }

    function test_depositIncreasesTotalAssets() public {
        vm.prank(vault);
        strategy.deposit(50 ether);

        assertEq(strategy.totalAssets(), 50 ether);
    }

    function test_depositOnlyVault() public {
        vm.expectRevert(LendingStrategy.NotVault.selector);
        strategy.deposit(100 ether);
    }

    function test_depositRevertsWhenPaused() public {
        // Trigger pause via emergencyWithdraw
        vm.prank(vault);
        strategy.emergencyWithdraw();

        vm.prank(vault);
        vm.expectRevert(LendingStrategy.IsPaused.selector);
        strategy.deposit(100 ether);
    }

    // ─── Withdraw ───────────────────────────────────────────────────────────

    function test_withdraw() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        vm.prank(vault);
        uint256 withdrawn = strategy.withdraw(50 ether);

        assertEq(withdrawn, 50 ether);
        assertEq(strategy.totalDeposited(), 50 ether);
        assertEq(asset.balanceOf(vault), 950 ether); // 1000 - 100 + 50
    }

    function test_withdrawCapsAtBalance() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Request more than deposited
        vm.prank(vault);
        uint256 withdrawn = strategy.withdraw(200 ether);

        assertEq(withdrawn, 100 ether); // capped
    }

    function test_withdrawOnlyVault() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        vm.expectRevert(LendingStrategy.NotVault.selector);
        strategy.withdraw(50 ether);
    }

    // ─── Harvest ────────────────────────────────────────────────────────────

    function test_harvestNoChange() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 0);
        assertEq(loss, 0);
    }

    function test_harvestProfit() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Simulate 10 ether of interest accrued: gToken balance grows
        uint256 current = gToken.balanceOf(address(strategy));
        gToken.setBalance(address(strategy), current + 10 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 10 ether);
        assertEq(loss, 0);
        // totalDeposited resets to current balance
        assertEq(strategy.totalDeposited(), 110 ether);
    }

    function test_harvestLoss() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Simulate loss (e.g. bad debt): gToken balance shrinks
        gToken.setBalance(address(strategy), 80 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 0);
        assertEq(loss, 20 ether);
        assertEq(strategy.totalDeposited(), 80 ether);
    }

    function test_harvestOnlyVault() public {
        vm.expectRevert(LendingStrategy.NotVault.selector);
        strategy.harvest();
    }

    // ─── Emergency ──────────────────────────────────────────────────────────

    function test_emergencyWithdraw() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        uint256 vaultBefore = asset.balanceOf(vault);

        vm.prank(vault);
        uint256 returned = strategy.emergencyWithdraw();

        assertEq(returned, 100 ether);
        assertEq(strategy.paused(), true);
        assertEq(strategy.totalDeposited(), 0);
        assertEq(asset.balanceOf(vault), vaultBefore + 100 ether);
    }

    function test_emergencyWithdrawOnlyVault() public {
        vm.expectRevert(LendingStrategy.NotVault.selector);
        strategy.emergencyWithdraw();
    }

    function test_emergencyWithdrawWhenEmpty() public {
        vm.prank(vault);
        uint256 returned = strategy.emergencyWithdraw();

        assertEq(returned, 0);
        assertTrue(strategy.paused());
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// StablecoinStrategy Tests
// ═══════════════════════════════════════════════════════════════════════════

contract StablecoinStrategyTest is Test {
    MockToken gUSD;
    MockToken gainToken; // WETH gains from liquidations
    MockStabilityPool pool;
    StablecoinStrategy strategy;

    address vault = address(0xDEAD2);

    function setUp() public {
        gUSD = new MockToken("gUSD", "gUSD");
        gainToken = new MockToken("Wrapped ETH", "WETH");
        pool = new MockStabilityPool(address(gUSD));

        strategy = new StablecoinStrategy(
            address(gUSD),
            address(pool),
            address(gainToken),
            vault
        );

        // Seed vault with funds
        gUSD.mint(vault, 1000 ether);
        vm.prank(vault);
        gUSD.approve(address(strategy), type(uint256).max);
    }

    // ─── Metadata ───────────────────────────────────────────────────────────

    function test_assetAddress() public view {
        assertEq(strategy.asset(), address(gUSD));
    }

    function test_vaultAddress() public view {
        assertEq(strategy.vault(), vault);
    }

    // ─── Deposit ────────────────────────────────────────────────────────────

    function test_deposit() public {
        vm.prank(vault);
        strategy.deposit(200 ether);

        assertEq(strategy.totalDeposited(), 200 ether);
        assertEq(strategy.totalAssets(), 200 ether);
    }

    function test_depositOnlyVault() public {
        vm.expectRevert(StablecoinStrategy.NotVault.selector);
        strategy.deposit(100 ether);
    }

    function test_depositRevertsWhenPaused() public {
        vm.prank(vault);
        strategy.emergencyWithdraw();

        vm.prank(vault);
        vm.expectRevert(StablecoinStrategy.IsPaused.selector);
        strategy.deposit(100 ether);
    }

    // ─── Withdraw ───────────────────────────────────────────────────────────

    function test_withdraw() public {
        vm.prank(vault);
        strategy.deposit(200 ether);

        vm.prank(vault);
        uint256 withdrawn = strategy.withdraw(100 ether);

        assertEq(withdrawn, 100 ether);
        assertEq(strategy.totalDeposited(), 100 ether);
        assertEq(gUSD.balanceOf(vault), 900 ether); // 1000 - 200 + 100
    }

    function test_withdrawCapsAtBalance() public {
        vm.prank(vault);
        strategy.deposit(200 ether);

        vm.prank(vault);
        uint256 withdrawn = strategy.withdraw(500 ether);

        assertEq(withdrawn, 200 ether);
    }

    function test_withdrawOnlyVault() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        vm.expectRevert(StablecoinStrategy.NotVault.selector);
        strategy.withdraw(50 ether);
    }

    // ─── Harvest ────────────────────────────────────────────────────────────

    function test_harvestNoChange() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 0);
        assertEq(loss, 0);
    }

    function test_harvestProfit() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Simulate pool-generated profit (stability fee distribution)
        pool.setDepositorBalance(address(strategy), 115 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 15 ether);
        assertEq(loss, 0);
        assertEq(strategy.totalDeposited(), 115 ether);
    }

    function test_harvestLoss() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Simulate partial liquidation loss
        pool.setDepositorBalance(address(strategy), 90 ether);

        vm.prank(vault);
        (uint256 profit, uint256 loss) = strategy.harvest();

        assertEq(profit, 0);
        assertEq(loss, 10 ether);
        assertEq(strategy.totalDeposited(), 90 ether);
    }

    function test_harvestClaimsETHGain() public {
        vm.prank(vault);
        strategy.deposit(100 ether);

        // Simulate liquidation gain
        pool.setGain(address(strategy), 5 ether);
        gainToken.mint(address(strategy), 5 ether);

        vm.prank(vault);
        strategy.harvest();

        // ETH gain should be transferred to vault
        assertEq(gainToken.balanceOf(vault), 5 ether);
    }

    function test_harvestNoGainTokenTransferIfZeroAddress() public {
        // Deploy with gainToken = address(0)
        StablecoinStrategy noGainStrategy = new StablecoinStrategy(
            address(gUSD),
            address(pool),
            address(0), // no gain token
            vault
        );
        gUSD.mint(vault, 200 ether);
        vm.prank(vault);
        gUSD.approve(address(noGainStrategy), type(uint256).max);

        vm.prank(vault);
        noGainStrategy.deposit(100 ether);

        // Set a gain; should not revert even though gainToken is address(0)
        pool.setGain(address(noGainStrategy), 5 ether);

        vm.prank(vault);
        (uint256 profit, ) = noGainStrategy.harvest();

        // Profit is from pool balance, not ETH gain
        assertEq(profit, 0);
    }

    function test_harvestOnlyVault() public {
        vm.expectRevert(StablecoinStrategy.NotVault.selector);
        strategy.harvest();
    }

    // ─── Emergency ──────────────────────────────────────────────────────────

    function test_emergencyWithdraw() public {
        vm.prank(vault);
        strategy.deposit(200 ether);

        uint256 vaultBefore = gUSD.balanceOf(vault);

        vm.prank(vault);
        uint256 returned = strategy.emergencyWithdraw();

        assertEq(returned, 200 ether);
        assertTrue(strategy.paused());
        assertEq(strategy.totalDeposited(), 0);
        assertEq(gUSD.balanceOf(vault), vaultBefore + 200 ether);
    }

    function test_emergencyWithdrawOnlyVault() public {
        vm.expectRevert(StablecoinStrategy.NotVault.selector);
        strategy.emergencyWithdraw();
    }

    function test_emergencyWithdrawWhenEmpty() public {
        vm.prank(vault);
        uint256 returned = strategy.emergencyWithdraw();

        assertEq(returned, 0);
        assertTrue(strategy.paused());
    }
}
