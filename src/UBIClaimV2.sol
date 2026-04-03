// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UBIClaimV2
 * @notice Standalone UBI claim contract for GoodDollar L2.
 *
 * Design goals:
 *   - Gas-free claims: a trusted relayer submits claims on behalf of users
 *   - Epoch-based anti-double-claim: one claim per address per 24-hour epoch
 *   - Batch claim: process up to 1000 claims in a single transaction (Phase 4 target)
 *   - Identity: delegates proof-of-personhood to GoodDollarToken.isVerifiedHuman()
 *   - Mint authority: calls GoodDollarToken.mint() — must be authorized as a minter
 *   - UBI pool supplement: optionally pull accrued fees from UBIFeeSplitter
 */

import "./interfaces/IGoodDollarToken.sol";

interface IUBIFeeSplitter {
    function claimableBalance() external view returns (uint256);
}

contract UBIClaimV2 {
    // ============ Constants ============

    uint256 public constant EPOCH_DURATION = 24 hours;

    // ============ State ============

    IGoodDollarToken public immutable goodDollar;
    IUBIFeeSplitter public feeSplitter;

    address public admin;

    /// @notice Addresses authorized to relay gas-free claims on behalf of users.
    mapping(address => bool) public trustedRelayers;

    /// @notice Last epoch in which each address claimed UBI.
    ///         epoch = block.timestamp / EPOCH_DURATION
    mapping(address => uint256) public lastClaimEpoch;

    /// @notice Whether individual self-claiming (user pays gas) is enabled.
    bool public selfClaimEnabled = true;

    // ============ Stats ============

    uint256 public totalClaims;
    uint256 public totalMinted;

    // ============ Events ============

    event UBIClaimed(address indexed claimer, uint256 amount, uint256 epoch);
    event BatchClaimed(uint256 count, uint256 totalAmount, uint256 epoch);
    event RelayerSet(address indexed relayer, bool authorized);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // ============ Errors ============

    error NotVerifiedHuman(address account);
    error AlreadyClaimedThisEpoch(address account, uint256 epoch);
    error NotAuthorizedRelayer();
    error SelfClaimDisabled();
    error ZeroAddress();

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyRelayer() {
        if (!trustedRelayers[msg.sender]) revert NotAuthorizedRelayer();
        _;
    }

    // ============ Constructor ============

    constructor(
        address _goodDollar,
        address _feeSplitter,
        address _admin
    ) {
        if (_goodDollar == address(0) || _admin == address(0)) revert ZeroAddress();
        goodDollar = IGoodDollarToken(_goodDollar);
        feeSplitter = IUBIFeeSplitter(_feeSplitter);
        admin = _admin;
    }

    // ============ View ============

    /**
     * @notice Current epoch number (increments every 24 hours).
     */
    function currentEpoch() public view returns (uint256) {
        return block.timestamp / EPOCH_DURATION;
    }

    /**
     * @notice Whether an address can claim in the current epoch.
     */
    function canClaim(address account) public view returns (bool) {
        return
            goodDollar.isVerifiedHuman(account) &&
            lastClaimEpoch[account] < currentEpoch();
    }

    // ============ Claiming ============

    /**
     * @notice Self-claim UBI for the caller. Caller pays gas.
     *         Reverts if self-claiming is disabled (relayer-only mode).
     */
    function claim() external {
        if (!selfClaimEnabled) revert SelfClaimDisabled();
        _claim(msg.sender);
    }

    /**
     * @notice Relay a claim on behalf of a single user. Gas paid by relayer.
     * @param user The verified human to claim for.
     */
    function claimFor(address user) external onlyRelayer {
        _claim(user);
    }

    /**
     * @notice Batch claim UBI for multiple users in a single transaction.
     *         Gas paid by the relayer. Silently skips addresses that are
     *         not verified or have already claimed this epoch, so the batch
     *         never reverts due to one ineligible address.
     *
     * @param users Array of addresses to claim for. Max 1000 per call.
     * @return claimed Number of addresses that successfully received UBI.
     */
    function batchClaim(address[] calldata users)
        external
        onlyRelayer
        returns (uint256 claimed)
    {
        require(users.length <= 1000, "Batch too large");
        uint256 epoch = currentEpoch();
        uint256 amount = goodDollar.dailyUBIAmount();
        uint256 batchTotal;

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (
                user == address(0) ||
                !goodDollar.isVerifiedHuman(user) ||
                lastClaimEpoch[user] >= epoch
            ) {
                continue;
            }
            lastClaimEpoch[user] = epoch;
            goodDollar.mint(user, amount);
            batchTotal += amount;
            unchecked { claimed++; }
            emit UBIClaimed(user, amount, epoch);
        }

        if (claimed > 0) {
            unchecked {
                totalClaims += claimed;
                totalMinted += batchTotal;
            }
            emit BatchClaimed(claimed, batchTotal, epoch);
        }
    }

    // ============ Internal ============

    function _claim(address user) internal {
        if (!goodDollar.isVerifiedHuman(user)) revert NotVerifiedHuman(user);

        uint256 epoch = currentEpoch();
        if (lastClaimEpoch[user] >= epoch) {
            revert AlreadyClaimedThisEpoch(user, epoch);
        }

        lastClaimEpoch[user] = epoch;

        uint256 amount = goodDollar.dailyUBIAmount();
        goodDollar.mint(user, amount);

        unchecked {
            totalClaims++;
            totalMinted += amount;
        }

        emit UBIClaimed(user, amount, epoch);
    }

    // ============ Governance ============

    function setRelayer(address relayer, bool authorized) external onlyAdmin {
        trustedRelayers[relayer] = authorized;
        emit RelayerSet(relayer, authorized);
    }

    function setSelfClaimEnabled(bool enabled) external onlyAdmin {
        selfClaimEnabled = enabled;
    }

    function setFeeSplitter(address _feeSplitter) external onlyAdmin {
        feeSplitter = IUBIFeeSplitter(_feeSplitter);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
