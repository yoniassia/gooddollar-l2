// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC20.sol";

/**
 * @title StablecoinStrategy — gUSD Stability Pool Strategy
 * @notice Deposits assets into GoodStable's StabilityPool to earn
 *         liquidation proceeds + stability fees.
 *
 * How it works:
 *   1. Vault deposits gUSD → Strategy → StabilityPool
 *   2. Strategy earns from liquidation gains + stability pool rewards
 *   3. harvest() reports gains as profit
 */

interface IStabilityPool {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    /// @dev Matches GoodStable StabilityPool public mapping getter.
    function deposits(address depositor) external view returns (uint256);
    /// @dev Claim collateral gains from liquidations; transfers gain tokens to caller.
    function claimGains() external returns (uint256);
}

contract StablecoinStrategy {
    address public immutable asset; // gUSD
    address public immutable deployer;
    address public vault;
    IStabilityPool public stabilityPool;
    address public gainToken; // ETH/WETH gained from liquidations

    uint256 public totalDeposited;
    bool public paused;

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event Harvested(uint256 profit, uint256 loss);
    event GainsClaimed(uint256 ethGain);

    error NotVault();
    error IsPaused();
    error TransferFailed();

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    constructor(
        address _asset,
        address _stabilityPool,
        address _gainToken,
        address _vault
    ) {
        asset = _asset;
        deployer = msg.sender;
        stabilityPool = IStabilityPool(_stabilityPool);
        gainToken = _gainToken;
        vault = _vault;
    }

    /// @notice Wire the vault address after deployment (one-shot, deployer-only).
    ///         Restricted to deployer to prevent front-running on networks with a public mempool.
    function setVault(address _vault) external {
        require(msg.sender == deployer, "StablecoinStrategy: not deployer");
        require(vault == address(0), "StablecoinStrategy: vault already set");
        require(_vault != address(0), "StablecoinStrategy: zero vault");
        vault = _vault;
    }

    function totalAssets() external view returns (uint256) {
        return stabilityPool.deposits(address(this));
    }

    function deposit(uint256 amount) external onlyVault {
        if (paused) revert IsPaused();
        if (!IERC20(asset).transferFrom(vault, address(this), amount)) revert TransferFailed();
        if (!IERC20(asset).approve(address(stabilityPool), amount)) revert TransferFailed();
        stabilityPool.deposit(amount);
        totalDeposited += amount;
        emit Deposited(amount);
    }

    function withdraw(uint256 amount) external onlyVault returns (uint256) {
        uint256 bal = stabilityPool.deposits(address(this));
        if (amount > bal) amount = bal;
        stabilityPool.withdraw(amount);

        // Transfer back to vault
        if (!IERC20(asset).transfer(vault, amount)) revert TransferFailed();

        if (amount > totalDeposited) {
            totalDeposited = 0;
        } else {
            totalDeposited -= amount;
        }
        emit Withdrawn(amount);
        return amount;
    }

    function harvest() external onlyVault returns (uint256 profit, uint256 loss) {
        uint256 currentBal = stabilityPool.deposits(address(this));

        // Claim collateral gains (e.g. WETH from liquidations) and forward to vault.
        if (gainToken != address(0)) {
            stabilityPool.claimGains();
            uint256 gained = IERC20(gainToken).balanceOf(address(this));
            if (gained > 0) {
                if (!IERC20(gainToken).transfer(vault, gained)) revert TransferFailed();
                emit GainsClaimed(gained);
            }
        }

        // Report gUSD profit/loss
        if (currentBal > totalDeposited) {
            profit = currentBal - totalDeposited;
            totalDeposited = currentBal;
        } else if (currentBal < totalDeposited) {
            loss = totalDeposited - currentBal;
            totalDeposited = currentBal;
        }

        emit Harvested(profit, loss);
    }

    function emergencyWithdraw() external onlyVault returns (uint256) {
        paused = true;
        uint256 bal = stabilityPool.deposits(address(this));
        if (bal > 0) {
            stabilityPool.withdraw(bal);
            if (!IERC20(asset).transfer(vault, bal)) revert TransferFailed();
        }
        totalDeposited = 0;
        return bal;
    }
}
