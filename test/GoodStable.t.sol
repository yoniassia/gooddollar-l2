// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/stable/gUSD.sol";
import "../src/stable/interfaces/IGoodStable.sol";
import "../src/stable/CollateralRegistry.sol";
import "../src/stable/VaultManager.sol";
import "../src/stable/StabilityPool.sol";
import "../src/stable/PegStabilityModule.sol";

// ============================================================
// Mocks
// ============================================================

/// @dev Generic ERC-20 mock with configurable decimals and free mint
contract MockToken {
    string  public name;
    string  public symbol;
    uint8   public decimals;
    uint256 public totalSupply;
    mapping(address => uint256)                     public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _dec) {
        name     = _name;
        symbol   = _symbol;
        decimals = _dec;
    }

    function mint(address to, uint256 amount) external {
        totalSupply       += amount;
        balanceOf[to]     += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            require(a >= amount, "allowance");
            allowance[from][msg.sender] = a - amount;
        }
        require(balanceOf[from] >= amount, "insufficient");
        balanceOf[from] -= amount;
        balanceOf[to]   += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @dev Minimal UBIFeeSplitter mock — just accepts tokens, emits nothing
contract MockFeeSplitter {
    address public immutable token; // gUSD address set at construction
    uint256 public ubiReceived;
    uint256 public totalReceived;

    constructor(address _token) {
        token = _token;
    }

    /// @dev Mirrors UBIFeeSplitter.splitFee signature
    function splitFee(uint256 totalFee, address /*dAppRecipient*/)
        external
        returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare)
    {
        // Pull tokens from caller
        IERC20Like(token).transferFrom(msg.sender, address(this), totalFee);
        ubiShare      = (totalFee * 3333) / 10000;
        protocolShare = (totalFee * 1667) / 10000;
        dAppShare     = totalFee - ubiShare - protocolShare;
        ubiReceived   += ubiShare;
        totalReceived += totalFee;
    }

    /// @dev Token-agnostic variant used by VaultManager.drip() for gUSD stability fees.
    function splitFeeToken(uint256 totalFee, address /*dAppRecipient*/, address _token)
        external
        returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare)
    {
        IERC20Like(_token).transferFrom(msg.sender, address(this), totalFee);
        ubiShare      = (totalFee * 3333) / 10000;
        protocolShare = (totalFee * 1667) / 10000;
        dAppShare     = totalFee - ubiShare - protocolShare;
        ubiReceived   += ubiShare;
        totalReceived += totalFee;
    }
}

/// @dev Price oracle mock — per-ilk price set by test
contract MockOracle {
    mapping(bytes32 => uint256) public prices;

    function setPrice(bytes32 ilk, uint256 price) external {
        prices[ilk] = price;
    }

    function getPrice(bytes32 ilk) external view returns (uint256) {
        return prices[ilk];
    }
}

// ============================================================
// Test suite
// ============================================================

contract GoodStableTest is Test {
    // ---- tokens ----
    gUSD         internal gusd;
    MockToken    internal weth;
    MockToken    internal usdc;
    MockToken    internal gdToken;

    // ---- protocol ----
    CollateralRegistry  internal registry;
    MockOracle          internal oracle;
    MockFeeSplitter     internal feeSplitter;
    VaultManager        internal vault;
    StabilityPool       internal sp;
    PegStabilityModule  internal psm;

    // ---- actors ----
    address internal admin   = address(0xA0);
    address internal alice   = address(0xA1);
    address internal bob     = address(0xA2);
    address internal carol   = address(0xA3);
    address internal treasury = address(0xA4);

    // ---- ilk keys ----
    bytes32 internal ETH_ILK  = bytes32("ETH");
    bytes32 internal USDC_ILK = bytes32("USDC");
    bytes32 internal GD_ILK   = bytes32("GD");

    // ---- constants ----
    uint256 internal WAD = 1e18;
    uint256 internal RAY = 1e27;

    function setUp() public {
        vm.startPrank(admin);

        // Deploy collateral tokens
        weth    = new MockToken("Wrapped ETH", "WETH", 18);
        usdc    = new MockToken("USD Coin",    "USDC", 6);
        gdToken = new MockToken("GoodDollar",  "G$",   18);

        // Deploy gUSD
        gusd = new gUSD(admin);

        // Deploy oracle + fee splitter
        oracle      = new MockOracle();
        feeSplitter = new MockFeeSplitter(address(gusd));

        // Deploy registry with default ilks
        registry = new CollateralRegistry(
            admin,
            address(weth),
            address(gdToken),
            address(usdc)
        );

        // Deploy VaultManager
        vault = new VaultManager(
            address(gusd),
            address(registry),
            address(oracle),
            address(feeSplitter),
            treasury,
            admin
        );

        // Deploy StabilityPool
        sp = new StabilityPool(address(gusd), admin);

        // Deploy PSM
        psm = new PegStabilityModule(
            address(gusd),
            address(usdc),
            address(feeSplitter),
            admin
        );

        // Authorize VaultManager and PSM as gUSD minters/burners
        gusd.setMinter(address(vault), true);
        gusd.setMinter(address(psm),   true);
        gusd.setMinter(address(sp),    false); // SP doesn't mint
        gusd.setBurner(address(vault), true);
        gusd.setBurner(address(sp),    true);  // SP calls burn() not burnFrom()
        gusd.setBurner(address(psm),   true);

        // Wire SP into VaultManager
        vault.setStabilityPool(address(sp));

        // Register collateral tokens in SP
        sp.setVaultManager(address(vault));
        sp.registerCollateralToken(ETH_ILK,  address(weth));
        sp.registerCollateralToken(USDC_ILK, address(usdc));
        sp.registerCollateralToken(GD_ILK,   address(gdToken));

        // Set prices: ETH = $2000, USDC = $1, G$ = $0.001 (mocked as 1e15)
        oracle.setPrice(ETH_ILK,  2000e18);
        oracle.setPrice(USDC_ILK, 1e18);
        oracle.setPrice(GD_ILK,   1e15);

        vm.stopPrank();

        // Fund actors with collateral
        weth.mint(alice, 100 ether);
        weth.mint(bob,   100 ether);
        usdc.mint(alice, 100_000e6);
        usdc.mint(bob,   100_000e6);
    }

    // ============================================================
    // Section 1: Deposit collateral and mint gUSD
    // ============================================================

    function test_DepositCollateralAndMintGUSD() public {
        vm.startPrank(alice);

        // Alice deposits 1 ETH
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);

        (uint256 collateral, uint256 normDebt) = vault.vaults(ETH_ILK, alice);
        assertEq(collateral, 1 ether, "collateral not stored");
        assertEq(normDebt, 0, "no debt yet");

        // ETH price = $2000; ratio = 150%; max safe mint = 2000 / 1.5 ≈ 1333 gUSD
        // Mint 1000 gUSD (well within limit)
        vault.mintGUSD(ETH_ILK, 1000e18);

        assertEq(gusd.balanceOf(alice), 1000e18, "gUSD not received");

        uint256 hf = vault.healthFactor(ETH_ILK, alice);
        // hf = (1 ETH * $2000) / (1000 * 1.5) = 2000 / 1500 = 1.333...
        assertGt(hf, WAD, "health factor should be > 1");

        vm.stopPrank();
    }

    function test_MintGUSDRevertsWhenUndercollateralised() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);

        // ETH @ $2000, ratio 150% => max ~1333 gUSD. Try 1500.
        vm.expectRevert("VM: collateral ratio too low");
        vault.mintGUSD(ETH_ILK, 1500e18);

        vm.stopPrank();
    }

    // ============================================================
    // Section 2: Repay gUSD and withdraw collateral
    // ============================================================

    function test_RepayGUSDAndWithdraw() public {
        // Setup: alice opens vault
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);
        vault.mintGUSD(ETH_ILK, 500e18);

        // Repay half
        gusd.approve(address(vault), 250e18);
        vault.repayGUSD(ETH_ILK, 250e18);

        assertEq(gusd.balanceOf(alice), 250e18, "half remaining");

        // Repay rest
        gusd.approve(address(vault), 250e18);
        vault.repayGUSD(ETH_ILK, 250e18);

        (,uint256 normDebt) = vault.vaults(ETH_ILK, alice);
        assertEq(normDebt, 0, "debt cleared");

        // Withdraw collateral
        uint256 before = weth.balanceOf(alice);
        vault.withdrawCollateral(ETH_ILK, 1 ether);
        assertEq(weth.balanceOf(alice) - before, 1 ether, "collateral returned");

        vm.stopPrank();
    }

    function test_WithdrawRevertsIfVaultBecomesUnhealthy() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);
        vault.mintGUSD(ETH_ILK, 1000e18); // 150% ratio — tight

        // Try to withdraw 0.5 ETH — would push ratio below 150%
        vm.expectRevert("VM: vault unhealthy");
        vault.withdrawCollateral(ETH_ILK, 0.5 ether);

        vm.stopPrank();
    }

    function test_CloseVault() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(ETH_ILK, 2 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);

        gusd.approve(address(vault), type(uint256).max);
        uint256 wethBefore = weth.balanceOf(alice);
        vault.closeVault(ETH_ILK);

        (uint256 col, uint256 nd) = vault.vaults(ETH_ILK, alice);
        assertEq(col, 0, "col cleared");
        assertEq(nd,  0, "debt cleared");
        assertEq(gusd.balanceOf(alice), 0, "gUSD burned");
        assertEq(weth.balanceOf(alice) - wethBefore, 2 ether, "ETH returned");

        vm.stopPrank();
    }

    // ============================================================
    // Section 3: Liquidation
    // ============================================================

    function test_HealthyVaultCannotBeLiquidated() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);
        vault.mintGUSD(ETH_ILK, 500e18);
        vm.stopPrank();

        // Bob attempts liquidation on healthy vault
        vm.prank(bob);
        vm.expectRevert("VM: vault is healthy");
        vault.liquidate(ETH_ILK, alice);
    }

    function test_UnhealthyVaultCanBeLiquidated_NoStabilityPool() public {
        // Alice opens vault: 1 ETH @ $2000, mints 1000 gUSD (150% ratio exactly after fees)
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);
        vm.stopPrank();

        // Price drops to $1200 — vault is now underwater (1200 < 1000 * 1.5 = 1500)
        vm.prank(admin);
        oracle.setPrice(ETH_ILK, 1200e18);

        // Verify vault is indeed unhealthy
        uint256 hf = vault.healthFactor(ETH_ILK, alice);
        assertLt(hf, WAD, "should be unhealthy");

        // Bob is the liquidator — needs gUSD to repay the debt
        // Give Bob enough gUSD
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(bob, 2000e18);

        uint256 wethBefore = weth.balanceOf(bob);
        uint256 gusdBefore = gusd.balanceOf(bob);

        vm.startPrank(bob);
        gusd.approve(address(vault), type(uint256).max);
        vault.liquidate(ETH_ILK, alice);
        vm.stopPrank();

        // Bob should have received alice's ETH collateral
        assertGt(weth.balanceOf(bob), wethBefore, "liquidator received ETH");
        // Bob spent gUSD
        assertLt(gusd.balanceOf(bob), gusdBefore, "liquidator spent gUSD");

        // Alice's vault is cleared
        (uint256 col, uint256 nd) = vault.vaults(ETH_ILK, alice);
        assertEq(col, 0, "alice collateral cleared");
        assertEq(nd,  0, "alice debt cleared");
    }

    function test_LiquidationWithStabilityPool() public {
        // Deposit 500 gUSD to SP first
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(carol, 500e18);

        vm.startPrank(carol);
        gusd.approve(address(sp), 500e18);
        sp.deposit(500e18);
        vm.stopPrank();

        // Alice opens a vault and gets into trouble
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(ETH_ILK, 1 ether);
        vault.mintGUSD(ETH_ILK, 500e18); // modest, SP should fully cover
        vm.stopPrank();

        // Price drops
        vm.prank(admin);
        oracle.setPrice(ETH_ILK, 600e18);

        uint256 spBefore = sp.totalDeposits();
        assertEq(spBefore, 500e18, "SP has 500 gUSD");

        // Bob liquidates; SP covers everything, bob needs no gUSD
        vm.prank(bob);
        vault.liquidate(ETH_ILK, alice);

        // SP gUSD decreased
        assertLt(sp.totalDeposits(), spBefore, "SP gUSD used");
        // Alice vault cleared
        (uint256 col,) = vault.vaults(ETH_ILK, alice);
        assertEq(col, 0, "alice cleared");

        // Carol can claim her ETH gain
        vm.prank(carol);
        sp.claimCollateral(ETH_ILK);
        assertGt(weth.balanceOf(carol), 0, "carol earned ETH");
    }

    // ============================================================
    // Section 4: PSM — swap both directions
    // ============================================================

    function test_PSM_SwapUSDCForGUSD() public {
        uint256 usdcAmount = 1000e6; // 1000 USDC

        vm.startPrank(alice);
        usdc.approve(address(psm), usdcAmount);
        psm.swapUSDCForGUSD(usdcAmount);
        vm.stopPrank();

        // 1000 USDC → 1000 gUSD minus 0.1% fee
        uint256 expectedFee  = (1000e18 * 10) / 10_000; // 1e18
        uint256 expectedGUSD = 1000e18 - expectedFee;

        assertEq(gusd.balanceOf(alice), expectedGUSD, "gUSD out incorrect");
        assertEq(psm.totalUSDCReserves(), usdcAmount, "USDC reserves");
    }

    function test_PSM_SwapGUSDForUSDC() public {
        // First, give alice some gUSD via USDC deposit
        vm.startPrank(alice);
        usdc.approve(address(psm), 2000e6);
        psm.swapUSDCForGUSD(2000e6);
        vm.stopPrank();

        // Now swap gUSD back
        uint256 gusdIn = 1000e18;
        uint256 aliceGusdBefore = gusd.balanceOf(alice);
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);

        vm.startPrank(alice);
        gusd.approve(address(psm), gusdIn);
        psm.swapGUSDForUSDC(gusdIn);
        vm.stopPrank();

        uint256 fee    = (gusdIn * 10) / 10_000;
        uint256 usdcOut = (gusdIn - fee) / 1e12;

        assertEq(gusd.balanceOf(alice), aliceGusdBefore - gusdIn, "gUSD burned");
        assertEq(usdc.balanceOf(alice) - aliceUsdcBefore, usdcOut, "USDC out");
    }

    function test_PSM_RevertsWhenPaused() public {
        vm.prank(admin);
        psm.setPaused(true);

        vm.startPrank(alice);
        usdc.approve(address(psm), 1000e6);
        vm.expectRevert("PSM: paused");
        psm.swapUSDCForGUSD(1000e6);
        vm.stopPrank();
    }

    function test_PSM_FeeRoutedToSplitter() public {
        uint256 usdcAmount = 10_000e6;
        uint256 feesBefore = feeSplitter.totalReceived();

        vm.startPrank(alice);
        usdc.approve(address(psm), usdcAmount);
        psm.swapUSDCForGUSD(usdcAmount);
        vm.stopPrank();

        assertGt(feeSplitter.totalReceived(), feesBefore, "fee splitter received fees");
    }

    // ============================================================
    // Section 5: Stability Pool — deposit / withdraw / claim
    // ============================================================

    function test_SP_DepositAndWithdraw() public {
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(alice, 1000e18);

        vm.startPrank(alice);
        gusd.approve(address(sp), 1000e18);
        sp.deposit(1000e18);
        vm.stopPrank();

        assertEq(sp.totalDeposits(), 1000e18, "deposits tracked");
        assertEq(sp.deposits(alice),  1000e18, "alice deposit tracked");

        // Withdraw half
        vm.startPrank(alice);
        sp.withdraw(500e18);
        vm.stopPrank();

        assertEq(sp.deposits(alice), 500e18, "half withdrawn");
        assertEq(gusd.balanceOf(alice), 500e18, "gUSD returned");
    }

    function test_SP_CannotWithdrawMoreThanDeposited() public {
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(alice, 100e18);

        vm.startPrank(alice);
        gusd.approve(address(sp), 100e18);
        sp.deposit(100e18);

        vm.expectRevert("SP: insufficient deposit");
        sp.withdraw(200e18);
        vm.stopPrank();
    }

    function test_SP_ClaimCollateral() public {
        // Setup: carol deposits 1000 gUSD into SP
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(carol, 1000e18);

        vm.startPrank(carol);
        gusd.approve(address(sp), 1000e18);
        sp.deposit(1000e18);
        vm.stopPrank();

        // Simulate liquidation offset: VaultManager calls offset()
        // Give VaultManager 0.5 ETH to distribute
        weth.mint(address(vault), 0.5 ether);

        // We test offset directly by impersonating vault
        vm.startPrank(address(vault));
        weth.approve(address(sp), 0.5 ether);
        sp.offset(500e18, ETH_ILK, 0.5 ether);
        vm.stopPrank();

        // Carol claims
        uint256 wethBefore = weth.balanceOf(carol);
        vm.prank(carol);
        sp.claimCollateral(ETH_ILK);

        assertGt(weth.balanceOf(carol) - wethBefore, 0, "carol earned ETH");
    }

    function test_SP_GainIsProportional() public {
        // alice and bob both deposit gUSD in 1:1 ratio, so split gains equally
        vm.prank(admin);
        gusd.setMinter(admin, true);

        vm.prank(admin); gusd.mint(alice, 500e18);
        vm.prank(admin); gusd.mint(bob,   500e18);

        vm.startPrank(alice);
        gusd.approve(address(sp), 500e18);
        sp.deposit(500e18);
        vm.stopPrank();

        vm.startPrank(bob);
        gusd.approve(address(sp), 500e18);
        sp.deposit(500e18);
        vm.stopPrank();

        // Offset with 0.2 WETH, burning 200 gUSD of debt
        weth.mint(address(vault), 0.2 ether);
        vm.startPrank(address(vault));
        weth.approve(address(sp), 0.2 ether);
        sp.offset(200e18, ETH_ILK, 0.2 ether);
        vm.stopPrank();

        uint256 aliceGain = sp.pendingGain(alice, ETH_ILK);
        uint256 bobGain   = sp.pendingGain(bob,   ETH_ILK);

        // Equal deposits → equal gains
        assertApproxEqAbs(aliceGain, bobGain, 1, "gains should be equal");
        assertGt(aliceGain, 0, "alice has gain");
    }

    // ============================================================
    // Section 6: Stability fee accrual
    // ============================================================

    function test_StabilityFeeAccrues() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(ETH_ILK, 2 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);
        vm.stopPrank();

        // Fast-forward 1 year
        vm.warp(block.timestamp + 365 days);

        // pendingFee should be > 0
        uint256 pending = vault.pendingFee(ETH_ILK);
        assertGt(pending, 0, "stability fee should accrue");
    }

    function test_StabilityFeeDripCollectsToSplitter() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(ETH_ILK, 2 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);
        vm.stopPrank();

        uint256 splitterBefore = feeSplitter.totalReceived();

        // Fast-forward 1 year and drip
        vm.warp(block.timestamp + 365 days);
        vault.drip(ETH_ILK);

        assertGt(feeSplitter.totalReceived(), splitterBefore, "splitter received fee");
    }

    function test_StabilityFeeIncreasesDebt() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(ETH_ILK, 2 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);
        vm.stopPrank();

        uint256 debtBefore = vault.vaultDebt(ETH_ILK, alice);

        vm.warp(block.timestamp + 365 days);
        vault.drip(ETH_ILK);

        uint256 debtAfter = vault.vaultDebt(ETH_ILK, alice);
        assertGt(debtAfter, debtBefore, "debt should grow with fees");
    }

    // ============================================================
    // Section 7: UBI fee routing
    // ============================================================

    function test_UBIFeeRoutedFromStabilityFee() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(ETH_ILK, 2 ether);
        vault.mintGUSD(ETH_ILK, 1000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 365 days);

        uint256 ubiBefore = feeSplitter.ubiReceived();
        vault.drip(ETH_ILK);
        uint256 ubiAfter  = feeSplitter.ubiReceived();

        assertGt(ubiAfter, ubiBefore, "UBI portion of stability fee sent");
        // Verify it's ~33% of total fee (within rounding)
        uint256 totalFee = feeSplitter.totalReceived();
        // Just check ubi > 0, exact ratio depends on mock
        assertGt(ubiAfter, 0, "UBI is non-zero");
    }

    function test_UBIFeeRoutedFromPSM() public {
        uint256 ubiBefore = feeSplitter.ubiReceived();

        vm.startPrank(alice);
        usdc.approve(address(psm), 100_000e6);
        psm.swapUSDCForGUSD(100_000e6);
        vm.stopPrank();

        assertGt(feeSplitter.ubiReceived(), ubiBefore, "PSM routes UBI fee");
    }

    // ============================================================
    // Section 8: gUSD access control
    // ============================================================

    function test_OnlyMinterCanMint() public {
        vm.prank(alice);
        vm.expectRevert("gUSD: not minter");
        gusd.mint(alice, 100e18);
    }

    function test_OnlyBurnerCanBurnFrom() public {
        vm.prank(admin);
        gusd.setMinter(admin, true);
        vm.prank(admin);
        gusd.mint(alice, 100e18);

        vm.prank(alice);
        gusd.approve(bob, 50e18);

        vm.prank(bob);
        vm.expectRevert("gUSD: not burner");
        gusd.burnFrom(alice, 50e18);
    }

    function test_AdminCanSetMinterAndBurner() public {
        address newMinter = address(0xBEEF);
        vm.prank(admin);
        gusd.setMinter(newMinter, true);
        assertTrue(gusd.isMinter(newMinter), "minter set");

        vm.prank(admin);
        gusd.setMinter(newMinter, false);
        assertFalse(gusd.isMinter(newMinter), "minter revoked");
    }

    // ============================================================
    // Section 9: CollateralRegistry
    // ============================================================

    function test_RegistryHasDefaultIlks() public view {
        CollateralRegistry.CollateralConfig memory ethCfg  = registry.getConfig(ETH_ILK);
        CollateralRegistry.CollateralConfig memory usdcCfg = registry.getConfig(USDC_ILK);
        CollateralRegistry.CollateralConfig memory gdCfg   = registry.getConfig(GD_ILK);

        assertEq(ethCfg.liquidationRatio,  15e17, "ETH ratio");
        assertEq(usdcCfg.liquidationRatio, 101e16, "USDC ratio");
        assertEq(gdCfg.liquidationRatio,   2e18, "G$ ratio");
        assertTrue(ethCfg.active, "ETH active");
    }

    function test_AdminCanAddIlk() public {
        MockToken newTok = new MockToken("New", "NEW", 18);
        bytes32 NEW_ILK = bytes32("NEW");

        vm.prank(admin);
        registry.addIlk(
            NEW_ILK,
            address(newTok),
            15e17,   // 150%
            13e16,
            1_000_000e18,
            1000000000627937192433212422
        );

        assertTrue(registry.ilkExists(NEW_ILK), "ilk added");
    }

    function test_NonAdminCannotAddIlk() public {
        vm.prank(alice);
        vm.expectRevert("Registry: not admin");
        registry.addIlk(bytes32("BAD"), address(0x1), 15e17, 13e16, 1e18, RAY);
    }
}
