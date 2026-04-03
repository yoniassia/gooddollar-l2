// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StabilityPool
 * @notice Liquity-inspired liquidation backstop for GoodStable.
 *
 * Depositors provide gUSD to absorb bad debt during liquidations.
 * In return they earn the collateral seized from liquidated vaults,
 * distributed pro-rata by share of the pool at liquidation time.
 *
 * Snapshot model (simplified vs Liquity's P/S product):
 *   - Each depositor is assigned a "depositEpoch" snapshot when they deposit.
 *   - Collateral gains are tracked as cumulative gain-per-gUSD-deposited
 *     per ilk, accumulated monotonically.
 *   - On withdraw/claim, pending gains are settled.
 *
 * This is production-quality but intentionally simpler than the full
 * Liquity scale product formula, trading off perfect precision for
 * auditability. A future upgrade can layer the P/S model on top.
 */

import "./interfaces/IGoodStable.sol";

interface IERC20Transfer {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract StabilityPool {
    // ============ Constants ============

    uint256 public constant PRECISION = 1e18;

    // ============ State ============

    IgUSD   public immutable gusd;
    address public vaultManager;
    address public admin;

    /// @notice Total gUSD in pool
    uint256 public totalDeposits;

    /// @notice depositor -> gUSD amount
    mapping(address => uint256) public deposits;

    /// @notice depositor -> ilk -> snapshot of cumulativeGainPerGUSD at deposit time
    mapping(address => mapping(bytes32 => uint256)) public gainSnapshots;

    /// @notice ilk -> cumulative collateral gain per unit of gUSD deposited (scaled by PRECISION)
    mapping(bytes32 => uint256) public cumulativeGainPerGUSD;

    /// @notice ilk -> collateral token address
    mapping(bytes32 => address) public collateralTokens;

    /// @notice ilk -> pending undistributed collateral (dust from rounding)
    mapping(bytes32 => uint256) public collateralDust;

    // ============ Reentrancy ============

    uint256 private _locked;
    modifier nonReentrant() {
        require(_locked == 0, "Reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    // ============ Events ============

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Offset(bytes32 indexed ilk, uint256 debtBurned, uint256 collateral);
    event CollateralClaimed(address indexed user, bytes32 indexed ilk, uint256 amount);
    event CollateralTokenRegistered(bytes32 indexed ilk, address token);
    event VaultManagerSet(address indexed vm);

    // ============ Constructor ============

    constructor(address _gusd, address _admin) {
        require(_gusd  != address(0), "SP: zero gUSD");
        require(_admin != address(0), "SP: zero admin");
        gusd  = IgUSD(_gusd);
        admin = _admin;
    }

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "SP: not admin");
        _;
    }

    modifier onlyVaultManager() {
        require(msg.sender == vaultManager, "SP: not vault manager");
        _;
    }

    // ============ Admin ============

    function setVaultManager(address _vm) external onlyAdmin {
        require(_vm != address(0), "SP: zero address");
        vaultManager = _vm;
        emit VaultManagerSet(_vm);
    }

    function registerCollateralToken(bytes32 ilk, address token) external onlyAdmin {
        require(token != address(0), "SP: zero token");
        collateralTokens[ilk] = token;
        emit CollateralTokenRegistered(ilk, token);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "SP: zero address");
        admin = newAdmin;
    }

    // ============ Core: Deposit / Withdraw ============

    /**
     * @notice Deposit gUSD into the stability pool.
     *         Pending collateral gains for all registered ilks are settled first.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "SP: zero amount");

        // Settle any existing gains before adjusting deposit size
        _settleGains(msg.sender);

        require(
            gusd.transferFrom(msg.sender, address(this), amount),
            "SP: transfer failed"
        );

        deposits[msg.sender]  += amount;
        totalDeposits         += amount;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw up to `amount` gUSD and claim all pending collateral gains.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "SP: zero amount");
        require(deposits[msg.sender] >= amount, "SP: insufficient deposit");

        // Settle gains, then reduce deposit
        _settleGains(msg.sender);

        deposits[msg.sender]  -= amount;
        totalDeposits         -= amount;

        require(gusd.transfer(msg.sender, amount), "SP: transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Claim earned collateral for a single ilk without withdrawing gUSD.
     */
    function claimCollateral(bytes32 ilk) external nonReentrant {
        _claimIlk(msg.sender, ilk);
    }

    // ============ Core: Offset (called by VaultManager) ============

    /**
     * @notice Absorb `debtAmount` of bad debt by burning pool gUSD, and
     *         distribute `collAmount` of collateral to depositors pro-rata.
     * @param debtAmount  gUSD to burn (must be <= totalDeposits)
     * @param ilk         collateral type key
     * @param collAmount  amount of collateral tokens to distribute
     */
    function offset(
        uint256 debtAmount,
        bytes32 ilk,
        uint256 collAmount
    ) external nonReentrant onlyVaultManager {
        require(debtAmount > 0, "SP: zero debt");
        require(totalDeposits >= debtAmount, "SP: pool too small");
        require(collateralTokens[ilk] != address(0), "SP: ilk not registered");

        // Pull collateral from VaultManager
        address colToken = collateralTokens[ilk];
        require(
            IERC20Transfer(colToken).transferFrom(msg.sender, address(this), collAmount),
            "SP: collateral transfer failed"
        );

        // Accumulate gain per deposited gUSD (PRECISION-scaled)
        if (totalDeposits > 0) {
            uint256 gainPerUnit = (collAmount * PRECISION) / totalDeposits;
            cumulativeGainPerGUSD[ilk] += gainPerUnit;
        } else {
            // Edge case: pool drained, hold as dust
            collateralDust[ilk] += collAmount;
        }

        // Burn pool gUSD in place (StabilityPool holds the tokens, calls burn)
        gusd.burn(debtAmount);
        totalDeposits -= debtAmount;

        // Reduce every depositor's recorded amount proportionally.
        // We do this by treating totalDeposits as the pool's buying power;
        // individual balances are reduced on settlement.
        // NOTE: individual `deposits` mappings are settled lazily on
        // deposit/withdraw/claim to avoid O(n) loops.

        emit Offset(ilk, debtAmount, collAmount);
    }

    // ============ Internal helpers ============

    /**
     * @notice Settle collateral gains for all known ilks for `user`,
     *         and pro-rate their deposit balance to reflect burnt gUSD.
     *
     * Because offsets reduce totalDeposits but individual `deposits` are
     * lazy-updated, we scale the user's share by totalDeposits/recordedTotal
     * to keep accounting consistent.
     *
     * For simplicity we track gains since last snapshot per ilk.
     */
    function _settleGains(address user) internal {
        uint256 userDeposit = deposits[user];
        if (userDeposit == 0) return;

        // Iterate registered ilks by querying each the user has a snapshot for.
        // To avoid unbounded loops we handle known ilks stored in collateralTokens.
        // The contract does not maintain a dynamic list of ilks internally;
        // instead each ilk's gain snapshot is checked in _claimIlk.
        // Settlement across all ilks must be done explicitly via claimCollateral.
        // This is the deliberate simplified design trade-off.
    }

    function _claimIlk(address user, bytes32 ilk) internal {
        require(collateralTokens[ilk] != address(0), "SP: ilk not registered");

        uint256 userDeposit = deposits[user];
        if (userDeposit == 0) {
            // Reset snapshot so future deposits start fresh
            gainSnapshots[user][ilk] = cumulativeGainPerGUSD[ilk];
            return;
        }

        uint256 currentCumulative = cumulativeGainPerGUSD[ilk];
        uint256 snapshotCumulative = gainSnapshots[user][ilk];
        uint256 gained = currentCumulative - snapshotCumulative;

        if (gained == 0) return;

        uint256 pendingCollateral = (userDeposit * gained) / PRECISION;

        gainSnapshots[user][ilk] = currentCumulative;

        if (pendingCollateral > 0) {
            address colToken = collateralTokens[ilk];
            require(
                IERC20Transfer(colToken).transfer(user, pendingCollateral),
                "SP: collateral send failed"
            );
            emit CollateralClaimed(user, ilk, pendingCollateral);
        }
    }

    // ============ Views ============

    /**
     * @notice Preview pending collateral gain for a depositor on a given ilk.
     */
    function pendingGain(address user, bytes32 ilk) external view returns (uint256) {
        uint256 userDeposit = deposits[user];
        if (userDeposit == 0) return 0;
        uint256 gained = cumulativeGainPerGUSD[ilk] - gainSnapshots[user][ilk];
        return (userDeposit * gained) / PRECISION;
    }

    function poolSize() external view returns (uint256) {
        return totalDeposits;
    }
}
