// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/perps/FundingRate.sol";
import "../../src/perps/PerpEngine.sol";
import "../../src/GoodDollarToken.sol";
import "../../src/stocks/PriceOracle.sol";

// ============ Mock Chainlink Feed for Perps ============

contract MockPerpFeed {
    int256 public price;

    constructor(int256 _price) {
        price = _price;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function decimals() external pure returns (uint8) { return 8; }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}

// ============ Mock Fee Splitter for Perps ============

contract MockPerpFeeSplitter {
    GoodDollarToken public immutable token;
    uint256 public totalReceived;

    constructor(address _token) {
        token = GoodDollarToken(_token);
    }

    function splitFee(uint256 totalFee, address) external returns (uint256, uint256, uint256) {
        token.transferFrom(msg.sender, address(this), totalFee);
        totalReceived += totalFee;
        return (totalFee / 3, totalFee / 6, totalFee / 2);
    }
}

contract GoodPerpsTest is Test {
    GoodDollarToken public gd;
    PriceOracle public oracle;
    MarginVault public vault;
    FundingRate public fundingRate;
    PerpEngine public engine;
    MockPerpFeed public btcFeed;
    MockPerpFeeSplitter public feeSplitter;

    address public admin = address(0xAD);
    address public alice = address(0xA1);
    address public bob = address(0xB0);

    uint256 constant INITIAL_SUPPLY = 100_000_000e18;
    // BTC @ $50,000 with 8 decimal Chainlink = 5_000_000_000_000
    int256 constant BTC_PRICE = 5_000_000_000_000; // $50,000
    uint256 constant BTC_PRICE_U = 5_000_000_000_000;

    bytes32 public btcKey;
    uint256 public btcMarketId;

    function setUp() public {
        // Deploy G$
        gd = new GoodDollarToken(admin, admin, INITIAL_SUPPLY);

        // Deploy oracle with BTC feed
        oracle = new PriceOracle(admin);
        btcFeed = new MockPerpFeed(BTC_PRICE);
        vm.prank(admin);
        oracle.registerFeed("BTC", address(btcFeed));
        btcKey = keccak256(abi.encodePacked("BTC"));

        // Deploy fee splitter mock
        feeSplitter = new MockPerpFeeSplitter(address(gd));

        // Deploy vault, funding, engine
        vault = new MarginVault(address(gd), admin);
        fundingRate = new FundingRate(admin);
        engine = new PerpEngine(
            address(vault),
            address(fundingRate),
            address(oracle),
            address(feeSplitter),
            admin
        );

        // Wire up
        vm.prank(admin);
        vault.setPerpEngine(address(engine));
        vm.prank(admin);
        fundingRate.setPerpEngine(address(engine));

        // Create BTC-PERP market (50x max leverage)
        vm.prank(admin);
        btcMarketId = engine.createMarket(btcKey, 50);

        // Fund alice and bob
        vm.prank(admin);
        gd.transfer(alice, 10_000_000e18);
        vm.prank(admin);
        gd.transfer(bob, 10_000_000e18);

        // Approve vault
        vm.prank(alice);
        gd.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        gd.approve(address(vault), type(uint256).max);
    }

    // ============ MarginVault Tests ============

    function test_vault_deposit() public {
        vm.prank(alice);
        vault.deposit(100_000e18);
        assertEq(vault.balances(alice), 100_000e18);
        assertEq(vault.totalDeposited(), 100_000e18);
    }

    function test_vault_withdraw() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        uint256 aliceBefore = gd.balanceOf(alice);
        vm.prank(alice);
        vault.withdraw(50_000e18);

        assertEq(gd.balanceOf(alice), aliceBefore + 50_000e18);
        assertEq(vault.balances(alice), 50_000e18);
    }

    function test_vault_withdraw_tooMuch_reverts() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        vm.expectRevert();
        vault.withdraw(100_001e18);
    }

    function test_vault_debit_onlyEngine() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice); // not the engine
        vm.expectRevert(MarginVault.NotEngine.selector);
        vault.debit(alice, 1000e18);
    }

    function test_vault_credit_onlyEngine() public {
        vm.prank(alice);
        vm.expectRevert(MarginVault.NotEngine.selector);
        vault.credit(alice, 1000e18);
    }

    function test_vault_zeroDeposit_reverts() public {
        vm.prank(alice);
        vm.expectRevert(MarginVault.ZeroAmount.selector);
        vault.deposit(0);
    }

    // ============ FundingRate Tests ============

    function test_fundingRate_noFundingBeforeInterval() public {
        vm.prank(address(engine));
        int256 rate = fundingRate.applyFunding(btcMarketId, BTC_PRICE_U, BTC_PRICE_U);
        assertEq(rate, 0); // No interval has passed yet (just initialized)
    }

    function test_fundingRate_appliesAfterInterval() public {
        // Warp past 8 hours
        vm.warp(block.timestamp + 8 hours + 1);

        // Mark above index = longs pay shorts
        uint256 markPrice = BTC_PRICE_U + (BTC_PRICE_U / 100); // 1% premium
        vm.prank(address(engine));
        int256 rate = fundingRate.applyFunding(btcMarketId, markPrice, BTC_PRICE_U);
        assertGt(rate, 0); // Positive = longs pay
    }

    function test_fundingRate_clampedToMaxRate() public {
        vm.warp(block.timestamp + 8 hours + 1);

        // 10% premium — should be clamped
        uint256 markPrice = BTC_PRICE_U + (BTC_PRICE_U / 10);
        vm.prank(address(engine));
        int256 rate = fundingRate.applyFunding(btcMarketId, markPrice, BTC_PRICE_U);
        assertEq(rate, fundingRate.MAX_FUNDING_RATE());
    }

    function test_fundingRate_negativePremium() public {
        vm.warp(block.timestamp + 8 hours + 1);

        // Mark below index = shorts pay longs
        uint256 markPrice = BTC_PRICE_U - (BTC_PRICE_U / 100);
        vm.prank(address(engine));
        int256 rate = fundingRate.applyFunding(btcMarketId, markPrice, BTC_PRICE_U);
        assertLt(rate, 0);
    }

    function test_accruedFunding_longPaysDuringPremium() public {
        int256 entryIndex = fundingRate.cumulativeFundingIndex(btcMarketId);

        // Apply positive funding
        vm.warp(block.timestamp + 8 hours + 1);
        uint256 markPrice = BTC_PRICE_U + (BTC_PRICE_U / 1000); // 0.1% premium
        vm.prank(address(engine));
        fundingRate.applyFunding(btcMarketId, markPrice, BTC_PRICE_U);

        // Long position: should pay (positive accrued funding)
        int256 longFunding = fundingRate.accruedFunding(
            int256(100_000e18), // long 100k
            entryIndex,
            btcMarketId
        );
        assertGt(longFunding, 0); // Long pays

        // Short position: should receive (negative accrued funding)
        int256 shortFunding = fundingRate.accruedFunding(
            -int256(100_000e18), // short 100k
            entryIndex,
            btcMarketId
        );
        assertLt(shortFunding, 0); // Short receives
    }

    // ============ PerpEngine Tests ============

    function test_engine_openLongPosition() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        // Open 10x long: $100k notional with $10k margin
        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        (bool isOpen, bool isLong, uint256 size, uint256 entryPrice,,, uint256 mId) =
            _getPosition(alice, btcMarketId);

        assertTrue(isOpen);
        assertTrue(isLong);
        assertEq(size, 100_000e18);
        assertEq(entryPrice, BTC_PRICE_U);
        assertEq(mId, btcMarketId);
    }

    function test_engine_openShortPosition() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 50_000e18, false, 5_000e18);

        (, bool isLong,,,,,) = _getPosition(alice, btcMarketId);
        assertFalse(isLong);
    }

    function test_engine_openPosition_insufficientMargin_reverts() public {
        vm.prank(alice);
        vault.deposit(1_000e18); // only $1k

        // Try to open $100k with $10k margin — don't have enough deposited
        vm.prank(alice);
        vm.expectRevert();
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);
    }

    function test_engine_openPosition_leverageTooHigh_reverts() public {
        vm.prank(alice);
        vault.deposit(1_000_000e18);

        // 60x leverage on a 50x max market
        vm.prank(alice);
        vm.expectRevert();
        engine.openPosition(btcMarketId, 60_000e18, true, 1_000e18); // 60x > 50x
    }

    function test_engine_cannotOpenTwoPositions_sameMarket() public {
        vm.prank(alice);
        vault.deposit(1_000_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        vm.prank(alice);
        vm.expectRevert(PerpEngine.PositionAlreadyOpen.selector);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);
    }

    function test_engine_closeLong_withProfit() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        // BTC goes from $50k to $55k (+10%)
        btcFeed.setPrice(int256(BTC_PRICE_U + BTC_PRICE_U / 10));

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(btcMarketId);

        // PnL = 100k * 10% = 10k profit
        // Margin returned = 10k, fee = 100, so net = 10k - fee + 10k profit ≈ ~20k
        assertGt(vault.balances(alice), balBefore + 9_000e18);
    }

    function test_engine_closeLong_withLoss() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        // BTC drops from $50k to $45k (-10%)
        btcFeed.setPrice(int256(BTC_PRICE_U - BTC_PRICE_U / 10));

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(btcMarketId);

        // PnL = -10k loss. margin = 10k. Net = ~0 (wiped out)
        assertLt(vault.balances(alice), balBefore);
    }

    function test_engine_closeShort_withProfit() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, false, 10_000e18); // short

        // BTC drops from $50k to $45k (-10%)
        btcFeed.setPrice(int256(BTC_PRICE_U - BTC_PRICE_U / 10));

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(btcMarketId);

        assertGt(vault.balances(alice), balBefore + 9_000e18);
    }

    function test_engine_unrealizedPnL_long() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        // Price up 5%
        btcFeed.setPrice(int256(BTC_PRICE_U + BTC_PRICE_U / 20));

        int256 pnl = engine.unrealizedPnL(alice, btcMarketId);
        // 100k * 5% = 5k profit
        assertGt(pnl, 4_900e18);
        assertLt(pnl, 5_100e18);
    }

    function test_engine_marginRatio_decreasesOnLoss() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18); // 10x

        // Price drops 8% → margin ratio ≈ 2%
        btcFeed.setPrice(int256(BTC_PRICE_U - (BTC_PRICE_U * 8 / 100)));

        uint256 ratio = engine.marginRatio(alice, btcMarketId);
        // Remaining margin ≈ 10k - 8k = 2k; ratio = 2k/100k = 2%
        assertLe(ratio, 300); // should be around 200 BPS
    }

    function test_engine_liquidate_underwater() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18); // 10x

        // Price drops 9% → margin ratio ~1% < 2% maintenance
        btcFeed.setPrice(int256(BTC_PRICE_U - (BTC_PRICE_U * 9 / 100)));

        uint256 bobBefore = vault.balances(bob);

        vm.prank(bob);
        engine.liquidate(alice, btcMarketId);

        // Bob should have received liquidation bonus
        assertGt(vault.balances(bob), bobBefore);

        // Alice position should be closed
        (bool isOpen,,,,,,) = _getPosition(alice, btcMarketId);
        assertFalse(isOpen);
    }

    function test_engine_liquidate_healthyPosition_reverts() public {
        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);

        // No price change — position is healthy at 10% CR
        vm.prank(bob);
        vm.expectRevert();
        engine.liquidate(alice, btcMarketId);
    }

    function test_engine_closePosition_noPosition_reverts() public {
        vm.prank(alice);
        vm.expectRevert(PerpEngine.NoOpenPosition.selector);
        engine.closePosition(btcMarketId);
    }

    function test_engine_paused_blocksTrading() public {
        vm.prank(admin);
        engine.setPaused(true);

        vm.prank(alice);
        vault.deposit(100_000e18);

        vm.prank(alice);
        vm.expectRevert(PerpEngine.Paused.selector);
        engine.openPosition(btcMarketId, 100_000e18, true, 10_000e18);
    }

    function test_engine_openInterestTracked() public {
        vm.prank(alice);
        vault.deposit(1_000_000e18);

        vm.prank(alice);
        engine.openPosition(btcMarketId, 200_000e18, true, 20_000e18);

        (,,,, bool active, uint256 oi_long, uint256 oi_short) = _getMarket(btcMarketId);
        assertEq(oi_long, 200_000e18);
        assertEq(oi_short, 0);

        vm.prank(alice);
        engine.closePosition(btcMarketId);

        (,,,, , uint256 oi_long2,) = _getMarket(btcMarketId);
        assertEq(oi_long2, 0);
    }

    // ============ Helpers ============

    function _getPosition(address trader, uint256 marketId)
        internal
        view
        returns (bool isOpen, bool isLong, uint256 size, uint256 entryPrice, uint256 margin, int256 entryFunding, uint256 mId)
    {
        (isOpen, isLong, size, entryPrice, margin, entryFunding, mId) = engine.positions(trader, marketId);
    }

    function _getMarket(uint256 marketId)
        internal
        view
        returns (bytes32 oracleKey, uint256 maxLev, uint256, uint256, bool active, uint256 oiLong, uint256 oiShort)
    {
        (oracleKey, maxLev, active, oiLong, oiShort) = engine.markets(marketId);
    }
}
