// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultManager
 * @notice CDP engine for GoodStable, inspired by MakerDAO's Vat.
 *
 * Architecture:
 *   - Vaults are keyed by (ilk, owner): mapping(bytes32 => mapping(address => Vault))
 *   - Stability fees accrue per second via a per-ilk rate accumulator (chi, RAY-scaled)
 *   - drip(ilk) must be called before any state-changing vault operation
 *   - Liquidation routes to StabilityPool first; any remainder goes to liquidator
 *   - 33% of stability fees go to UBI via UBIFeeSplitter.splitFee()
 *
 * Math:
 *   WAD = 1e18, RAY = 1e27
 *   normalizedDebt * chi = actual gUSD owed
 *   healthFactor = (collateralValue * 1e18) / (actualDebt * liquidationRatio)
 *   vault is healthy iff healthFactor >= 1e18
 *
 * Fee routing:
 *   drip() collects accrued fees as gUSD and calls feeSplitter.splitFee()
 *   with the VaultManager's dApp address as recipient (protocol treasury).
 */

interface IgUSD {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface ICollateralRegistry {
    struct CollateralConfig {
        address token;
        uint256 liquidationRatio;   // WAD
        uint256 liquidationPenalty; // WAD
        uint256 debtCeiling;        // absolute gUSD
        uint256 stabilityFeeRate;   // RAY per-second
        bool    active;
    }
    function getConfig(bytes32 ilk) external view returns (CollateralConfig memory);
    function ilkExists(bytes32 ilk) external view returns (bool);
}

interface IPriceOracle {
    /// @notice Returns the USD price of the collateral for the given ilk, 18-decimal.
    function getPrice(bytes32 ilk) external view returns (uint256);
}

interface IStabilityPool {
    /// @notice Absorb debtAmount of bad debt, distributing collAmount to depositors.
    function offset(uint256 debtAmount, bytes32 ilk, uint256 collAmount) external;
    function totalDeposits() external view returns (uint256);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IUBIFeeSplitter {
    function splitFee(uint256 totalFee, address dAppRecipient)
        external
        returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare);
}

contract VaultManager {
    // ============ Constants ============

    uint256 public constant WAD = 1e18;
    uint256 public constant RAY = 1e27;

    // ============ Structs ============

    struct Vault {
        uint256 collateral;     // raw token units locked
        uint256 normalizedDebt; // debt / chi at time of mint (normalized)
    }

    struct IlkAccumulator {
        uint256 chi;       // RAY — rate accumulator (starts at RAY = 1.0)
        uint256 lastDrip;  // timestamp of last drip
        uint256 totalNormalizedDebt; // sum of all normalizedDebt for this ilk
    }

    // ============ State ============

    IgUSD               public immutable gusd;
    ICollateralRegistry public immutable registry;
    IPriceOracle        public immutable oracle;
    IStabilityPool      public stabilityPool;
    IUBIFeeSplitter     public immutable feeSplitter;

    address public admin;
    address public dAppRecipient;   // receives dApp share of stability fees
    bool    public paused;

    /// @notice ilk -> owner -> Vault
    mapping(bytes32 => mapping(address => Vault)) public vaults;

    /// @notice ilk -> rate accumulator state
    mapping(bytes32 => IlkAccumulator) public accumulators;

    /// @notice ilk -> total actual debt outstanding (in gUSD)
    mapping(bytes32 => uint256) public ilkDebt;

    // ============ Reentrancy ============

    uint256 private _locked;
    modifier nonReentrant() {
        require(_locked == 0, "Reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    // ============ Events ============

    event VaultOpened(address indexed owner, bytes32 indexed ilk);
    event CollateralDeposited(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event CollateralWithdrawn(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event GUSDMinted(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event GUSDRepaid(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event VaultClosed(address indexed owner, bytes32 indexed ilk);
    event VaultLiquidated(
        address indexed liquidator,
        address indexed owner,
        bytes32 indexed ilk,
        uint256 debtRepaid,
        uint256 collSeized
    );
    event FeeCollected(bytes32 indexed ilk, uint256 feeGUSD);
    event StabilityPoolSet(address pool);
    event Drip(bytes32 indexed ilk, uint256 newChi, uint256 feeAccrued);

    // ============ Constructor ============

    constructor(
        address _gusd,
        address _registry,
        address _oracle,
        address _feeSplitter,
        address _dAppRecipient,
        address _admin
    ) {
        require(_gusd           != address(0), "VM: zero gUSD");
        require(_registry       != address(0), "VM: zero registry");
        require(_oracle         != address(0), "VM: zero oracle");
        require(_feeSplitter    != address(0), "VM: zero splitter");
        require(_dAppRecipient  != address(0), "VM: zero dApp recipient");
        require(_admin          != address(0), "VM: zero admin");

        gusd           = IgUSD(_gusd);
        registry       = ICollateralRegistry(_registry);
        oracle         = IPriceOracle(_oracle);
        feeSplitter    = IUBIFeeSplitter(_feeSplitter);
        dAppRecipient  = _dAppRecipient;
        admin          = _admin;
    }

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "VM: not admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "VM: paused");
        _;
    }

    // ============ Admin ============

    function setStabilityPool(address _pool) external onlyAdmin {
        require(_pool != address(0), "VM: zero address");
        stabilityPool = IStabilityPool(_pool);
        emit StabilityPoolSet(_pool);
    }

    function setDAppRecipient(address _recipient) external onlyAdmin {
        require(_recipient != address(0), "VM: zero address");
        dAppRecipient = _recipient;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "VM: zero address");
        admin = newAdmin;
    }

    // ============ Rate Accumulator ============

    /**
     * @notice Update the per-ilk chi accumulator and collect accrued stability fees.
     *         Must be called before any vault state change.
     */
    function drip(bytes32 ilk) public {
        IlkAccumulator storage acc = accumulators[ilk];

        // Initialize accumulator on first use
        if (acc.chi == 0) {
            acc.chi = RAY;
            acc.lastDrip = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - acc.lastDrip;
        if (elapsed == 0) return;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 rate = cfg.stabilityFeeRate; // RAY per-second

        // Compute new chi: chi * rate^elapsed using linear approximation for gas efficiency
        // For production: use _rpow for exact compounding.
        uint256 newChi = _rpow(rate, elapsed, RAY);
        newChi = (acc.chi * newChi) / RAY;

        if (newChi <= acc.chi) {
            acc.lastDrip = block.timestamp;
            return;
        }

        uint256 chiDelta = newChi - acc.chi;
        acc.chi      = newChi;
        acc.lastDrip = block.timestamp;

        // Accrued fee = totalNormalizedDebt * chiDelta (in RAY)
        // Convert to WAD for gUSD
        uint256 feeRay = acc.totalNormalizedDebt * chiDelta;
        uint256 feeWAD = feeRay / RAY;

        if (feeWAD == 0) {
            emit Drip(ilk, newChi, 0);
            return;
        }

        // Mint accrued fee gUSD and route to UBIFeeSplitter
        gusd.mint(address(this), feeWAD);
        gusd.approve(address(feeSplitter), feeWAD);
        feeSplitter.splitFee(feeWAD, dAppRecipient);

        ilkDebt[ilk] += feeWAD;

        emit FeeCollected(ilk, feeWAD);
        emit Drip(ilk, newChi, feeWAD);
    }

    // ============ Vault Lifecycle ============

    /**
     * @notice Open a vault for `ilk`. Vaults are implicitly created on first deposit,
     *         but this function emits an event and validates the ilk exists.
     */
    function openVault(bytes32 ilk) external whenNotPaused {
        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");
        drip(ilk);
        emit VaultOpened(msg.sender, ilk);
    }

    /**
     * @notice Deposit collateral into caller's vault for `ilk`.
     * @param ilk    Collateral type key
     * @param amount Token amount to deposit (in collateral token decimals)
     */
    function depositCollateral(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");
        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");

        drip(ilk);

        address token = cfg.token;
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "VM: collateral transfer failed"
        );

        vaults[ilk][msg.sender].collateral += amount;

        emit CollateralDeposited(msg.sender, ilk, amount);
    }

    /**
     * @notice Withdraw collateral from caller's vault.
     *         Vault must remain healthy after withdrawal.
     */
    function withdrawCollateral(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");

        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        require(vault.collateral >= amount, "VM: insufficient collateral");

        vault.collateral -= amount;

        // Ensure vault stays healthy after withdrawal
        if (vault.normalizedDebt > 0) {
            require(_isHealthy(ilk, vault), "VM: vault unhealthy");
        }

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(
            IERC20(cfg.token).transfer(msg.sender, amount),
            "VM: collateral send failed"
        );

        emit CollateralWithdrawn(msg.sender, ilk, amount);
    }

    /**
     * @notice Mint gUSD against collateral in caller's vault.
     * @param ilk    Collateral type key
     * @param amount gUSD to mint (18 decimals)
     */
    function mintGUSD(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");

        drip(ilk);

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        // Normalized debt = gUSD / chi
        uint256 normalizedAmount = (amount * RAY) / chi;

        Vault storage vault = vaults[ilk][msg.sender];
        vault.normalizedDebt += normalizedAmount;
        acc.totalNormalizedDebt += normalizedAmount;

        // Check debt ceiling
        uint256 newActualDebt = (acc.totalNormalizedDebt * chi) / RAY;
        require(newActualDebt <= cfg.debtCeiling, "VM: debt ceiling exceeded");

        ilkDebt[ilk] = newActualDebt;

        // Check vault health
        require(_isHealthy(ilk, vault), "VM: collateral ratio too low");

        gusd.mint(msg.sender, amount);

        emit GUSDMinted(msg.sender, ilk, amount);
    }

    /**
     * @notice Repay gUSD debt on caller's vault.
     * @param ilk    Collateral type key
     * @param amount gUSD to repay (18 decimals). Use type(uint256).max to repay all.
     */
    function repayGUSD(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        // Compute actual debt outstanding
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        // Clamp to actual debt
        if (amount > actualDebt) amount = actualDebt;
        require(amount > 0, "VM: nothing to repay");

        // Normalize repayment amount
        uint256 normalizedRepay = (amount * RAY) / chi;
        if (normalizedRepay > vault.normalizedDebt) {
            normalizedRepay = vault.normalizedDebt;
        }

        vault.normalizedDebt         -= normalizedRepay;
        acc.totalNormalizedDebt      -= normalizedRepay;

        uint256 newIlkDebt = acc.totalNormalizedDebt * chi / RAY;
        ilkDebt[ilk] = newIlkDebt;

        gusd.burnFrom(msg.sender, amount);

        emit GUSDRepaid(msg.sender, ilk, amount);
    }

    /**
     * @notice Close vault: repay all debt and withdraw all collateral in one call.
     */
    function closeVault(bytes32 ilk) external nonReentrant whenNotPaused {
        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        if (actualDebt > 0) {
            acc.totalNormalizedDebt -= vault.normalizedDebt;
            vault.normalizedDebt = 0;
            ilkDebt[ilk] = (acc.totalNormalizedDebt * chi) / RAY;
            gusd.burnFrom(msg.sender, actualDebt);
            emit GUSDRepaid(msg.sender, ilk, actualDebt);
        }

        uint256 collateral = vault.collateral;
        if (collateral > 0) {
            vault.collateral = 0;
            ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
            require(
                IERC20(cfg.token).transfer(msg.sender, collateral),
                "VM: collateral send failed"
            );
            emit CollateralWithdrawn(msg.sender, ilk, collateral);
        }

        emit VaultClosed(msg.sender, ilk);
    }

    // ============ Liquidation ============

    /**
     * @notice Liquidate an unhealthy vault.
     *         The liquidator does NOT need to provide any funds themselves.
     *         Instead:
     *         1. StabilityPool offsets as much debt as it can (burning pool gUSD).
     *         2. Any remaining debt is repaid by the liquidator directly.
     *         3. Seized collateral (plus penalty) goes to SP first, remainder to liquidator.
     *
     * @param ilk   Collateral type key
     * @param owner Vault owner to liquidate
     */
    function liquidate(bytes32 ilk, address owner) external nonReentrant whenNotPaused {
        require(owner != address(0), "VM: zero owner");

        drip(ilk);

        Vault storage vault = vaults[ilk][owner];
        require(vault.normalizedDebt > 0, "VM: vault has no debt");
        require(!_isHealthy(ilk, vault), "VM: vault is healthy");

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;
        uint256 collateral = vault.collateral;

        // Calculate collateral value at oracle price
        uint256 price = oracle.getPrice(ilk);

        // Total collateral value in gUSD (WAD)
        uint256 collValueWAD = _collateralToGUSD(collateral, price, cfg.token);

        // Seized collateral = debt * liquidationRatio (already underwater) + penalty
        // We seize all collateral (vault is unhealthy, so all col covers debt+penalty)
        uint256 seizedCollateral = collateral; // seize everything

        // Value of seized collateral
        uint256 seizedValue = collValueWAD;

        // Wipe vault state
        acc.totalNormalizedDebt -= vault.normalizedDebt;
        vault.normalizedDebt = 0;
        vault.collateral     = 0;
        ilkDebt[ilk] = (acc.totalNormalizedDebt * chi) / RAY;

        // Approve StabilityPool to pull collateral for offset
        address colToken = cfg.token;
        uint256 spDebt    = 0;
        uint256 spColl    = 0;
        uint256 liqColl   = seizedCollateral;

        if (address(stabilityPool) != address(0)) {
            uint256 spBalance = stabilityPool.totalDeposits();

            if (spBalance > 0) {
                // SP absorbs up to min(spBalance, actualDebt)
                spDebt = actualDebt < spBalance ? actualDebt : spBalance;

                // Proportion of collateral going to SP
                // spColl = seizedCollateral * spDebt / actualDebt
                if (actualDebt > 0) {
                    spColl = (seizedCollateral * spDebt) / actualDebt;
                }
                liqColl = seizedCollateral - spColl;

                if (spColl > 0 && spDebt > 0) {
                    // Approve SP to pull collateral
                    IERC20(colToken).approve(address(stabilityPool), spColl);
                    // SP burns its own gUSD for spDebt and distributes spColl
                    stabilityPool.offset(spDebt, ilk, spColl);
                }
            }
        }

        // Remaining debt after SP offset
        uint256 remainingDebt = actualDebt - spDebt;

        if (remainingDebt > 0) {
            // Liquidator covers remaining debt
            gusd.burnFrom(msg.sender, remainingDebt);
        }

        // Send remaining collateral to liquidator
        if (liqColl > 0) {
            require(
                IERC20(colToken).transfer(msg.sender, liqColl),
                "VM: liquidator collateral send failed"
            );
        }

        emit VaultLiquidated(msg.sender, owner, ilk, actualDebt, seizedCollateral);
    }

    // ============ Internal helpers ============

    /**
     * @notice Returns true if vault health factor >= 1.0 (healthy).
     *   healthFactor = collateralValue * WAD / (actualDebt * liquidationRatio)
     */
    function _isHealthy(bytes32 ilk, Vault storage vault) internal view returns (bool) {
        if (vault.normalizedDebt == 0) return true;

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        if (actualDebt == 0) return true;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 price = oracle.getPrice(ilk);

        uint256 collValueWAD = _collateralToGUSD(vault.collateral, price, cfg.token);

        // healthFactor = collValue * WAD / (debt * liquidationRatio / WAD)
        //             = collValue * WAD * WAD / (debt * liquidationRatio)
        uint256 debtTimesRatio = actualDebt * cfg.liquidationRatio / WAD;
        if (debtTimesRatio == 0) return true;

        uint256 healthFactor = (collValueWAD * WAD) / debtTimesRatio;
        return healthFactor >= WAD;
    }

    /**
     * @notice Convert raw collateral amount to gUSD value (18-decimal).
     *         Handles token decimals: fetches from token if needed.
     *         For gas efficiency, USDC (6-decimal) must be scaled up.
     */
    function _collateralToGUSD(
        uint256 collAmount,
        uint256 price18,
        address token
    ) internal view returns (uint256) {
        // Attempt to read decimals; default to 18 on failure
        uint8 dec = 18;
        try IERC20Decimals(token).decimals() returns (uint8 d) {
            dec = d;
        } catch {}

        uint256 normalized;
        if (dec < 18) {
            normalized = collAmount * (10 ** (18 - dec));
        } else if (dec > 18) {
            normalized = collAmount / (10 ** (dec - 18));
        } else {
            normalized = collAmount;
        }

        // value = normalized * price / WAD
        return (normalized * price18) / WAD;
    }

    /**
     * @dev RAY-precision exponentiation (binary exponentiation).
     *      result = base^n with base and result in RAY units.
     */
    function _rpow(uint256 x, uint256 n, uint256 base) internal pure returns (uint256 z) {
        assembly {
            switch x
            case 0 {
                switch n
                case 0 { z := base }
                default { z := 0 }
            }
            default {
                switch mod(n, 2)
                case 0 { z := base }
                default { z := x }
                let half := div(base, 2)
                for { n := div(n, 2) } n { n := div(n, 2) } {
                    let xx := mul(x, x)
                    if iszero(eq(div(xx, x), x)) { revert(0, 0) }
                    let xxRound := add(xx, half)
                    if lt(xxRound, xx) { revert(0, 0) }
                    x := div(xxRound, base)
                    if mod(n, 2) {
                        let zx := mul(z, x)
                        if and(iszero(iszero(x)), iszero(eq(div(zx, x), z))) { revert(0, 0) }
                        let zxRound := add(zx, half)
                        if lt(zxRound, zx) { revert(0, 0) }
                        z := div(zxRound, base)
                    }
                }
            }
        }
    }

    // ============ Views ============

    /**
     * @notice Current actual debt for a vault (includes accrued fees).
     */
    function vaultDebt(bytes32 ilk, address owner) external view returns (uint256) {
        Vault storage vault = vaults[ilk][owner];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        return (vault.normalizedDebt * chi) / RAY;
    }

    /**
     * @notice Health factor of a vault (WAD-scaled). >= 1e18 is healthy.
     */
    function healthFactor(bytes32 ilk, address owner) external view returns (uint256) {
        Vault storage vault = vaults[ilk][owner];
        if (vault.normalizedDebt == 0) return type(uint256).max;

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;
        if (actualDebt == 0) return type(uint256).max;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 price = oracle.getPrice(ilk);
        uint256 collValueWAD = _collateralToGUSD(vault.collateral, price, cfg.token);

        uint256 debtTimesRatio = actualDebt * cfg.liquidationRatio / WAD;
        if (debtTimesRatio == 0) return type(uint256).max;

        return (collValueWAD * WAD) / debtTimesRatio;
    }

    /**
     * @notice Preview accrued (but not yet dripped) stability fee for an ilk.
     */
    function pendingFee(bytes32 ilk) external view returns (uint256) {
        IlkAccumulator storage acc = accumulators[ilk];
        if (acc.chi == 0 || acc.totalNormalizedDebt == 0) return 0;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 elapsed = block.timestamp - acc.lastDrip;
        if (elapsed == 0) return 0;

        uint256 newChi = _rpow(cfg.stabilityFeeRate, elapsed, RAY);
        newChi = (acc.chi * newChi) / RAY;
        if (newChi <= acc.chi) return 0;

        uint256 chiDelta = newChi - acc.chi;
        return (acc.totalNormalizedDebt * chiDelta) / RAY;
    }
}

/// @dev Minimal interface to read token decimals
interface IERC20Decimals {
    function decimals() external view returns (uint8);
}
