// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Validator Staking
 * @notice Validators stake G$ to participate in sequencing.
 *         Staked G$ earns rewards. Slashed G$ goes to UBI pool.
 *
 *         Unstaking requires a 7-day unbonding period to prevent:
 *         - Stake-to-vote attacks (bond, vote, unbond in same block)
 *         - Slashing evasion (cannot front-run a slash transaction)
 *
 *         A validator can have at most one pending unbonding request.
 *         Slashing applies to BOTH staked AND unbonding amounts.
 */
interface IGoodDollarToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function fundUBIPool(uint256 amount) external;
    function balanceOf(address) external view returns (uint256);
}

contract ValidatorStaking {
    IGoodDollarToken public immutable goodDollar;

    uint256 public constant MIN_STAKE = 1_000_000e18; // 1M G$ minimum
    uint256 public constant UNBONDING_PERIOD = 7 days;
    uint256 public rewardRateBPS = 500; // 5% annual reward rate
    uint256 public slashBPS = 1000;     // 10% slash for misbehavior

    struct UnbondingRequest {
        uint256 amount;
        uint256 unbondAt; // timestamp when withdrawal is available
    }

    struct Validator {
        uint256 staked;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        bool isActive;
        string name;
        string endpoint; // RPC endpoint
        UnbondingRequest unbonding;
    }

    mapping(address => Validator) public validators;
    address[] public validatorList;
    uint256 public totalStaked;

    address public admin;

    event ValidatorStaked(address indexed validator, uint256 amount, string name);
    event UnstakeInitiated(address indexed validator, uint256 amount, uint256 unbondAt);
    event UnstakeCompleted(address indexed validator, uint256 amount);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);
    event RewardsClaimed(address indexed validator, uint256 amount);

    error NotAdmin();
    error NotValidator();
    error BelowMinStake();
    error InsufficientStake();
    error UnbondingAlreadyPending();
    error UnbondingNotReady(uint256 readyAt, uint256 currentTime);
    error NoUnbondingRequest();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _goodDollar, address _admin) {
        goodDollar = IGoodDollarToken(_goodDollar);
        admin = _admin;
    }

    // ============ Staking ============

    /**
     * @notice Stake G$ to become a validator.
     */
    function stake(uint256 amount, string calldata name, string calldata endpoint) external {
        if (amount < MIN_STAKE) revert BelowMinStake();

        goodDollar.transferFrom(msg.sender, address(this), amount);

        Validator storage v = validators[msg.sender];
        if (!v.isActive) {
            v.isActive = true;
            v.name = name;
            v.endpoint = endpoint;
            v.lastStakeTime = block.timestamp;
            validatorList.push(msg.sender);
        }
        v.staked += amount;
        totalStaked += amount;

        emit ValidatorStaked(msg.sender, amount, name);
    }

    /**
     * @notice Initiate unstaking. Starts the 7-day unbonding clock.
     * @dev Only one pending unbonding request allowed at a time.
     *      Slashing can still apply to unbonding amounts during this period.
     * @param amount G$ amount to unstake
     */
    function initiateUnstake(uint256 amount) external {
        Validator storage v = validators[msg.sender];
        if (!v.isActive) revert NotValidator();
        if (v.staked < amount) revert InsufficientStake();
        if (v.unbonding.amount > 0) revert UnbondingAlreadyPending();

        v.staked -= amount;
        totalStaked -= amount;

        v.unbonding = UnbondingRequest({
            amount: amount,
            unbondAt: block.timestamp + UNBONDING_PERIOD
        });

        if (v.staked < MIN_STAKE) {
            v.isActive = false;
        }

        emit UnstakeInitiated(msg.sender, amount, block.timestamp + UNBONDING_PERIOD);
    }

    /**
     * @notice Complete unstaking after the 7-day period.
     */
    function completeUnstake() external {
        Validator storage v = validators[msg.sender];
        if (v.unbonding.amount == 0) revert NoUnbondingRequest();
        if (block.timestamp < v.unbonding.unbondAt) {
            revert UnbondingNotReady(v.unbonding.unbondAt, block.timestamp);
        }

        uint256 amount = v.unbonding.amount;
        delete v.unbonding;

        goodDollar.transfer(msg.sender, amount);
        emit UnstakeCompleted(msg.sender, amount);
    }

    // ============ Slashing ============

    /**
     * @notice Slash a validator. Applies to both staked AND unbonding amounts.
     *         Slashed G$ goes to UBI pool.
     */
    function slash(address validator, string calldata reason) external onlyAdmin {
        Validator storage v = validators[validator];
        require(v.isActive || v.unbonding.amount > 0, "Not active or unbonding");

        uint256 totalExposure = v.staked + v.unbonding.amount;
        uint256 slashAmount = (totalExposure * slashBPS) / 10000;

        // Slash staked first, then unbonding
        if (slashAmount <= v.staked) {
            v.staked -= slashAmount;
            totalStaked -= slashAmount;
        } else {
            uint256 fromStaked = v.staked;
            uint256 fromUnbonding = slashAmount - fromStaked;

            totalStaked -= fromStaked;
            v.staked = 0;

            if (fromUnbonding > v.unbonding.amount) {
                fromUnbonding = v.unbonding.amount;
            }
            v.unbonding.amount -= fromUnbonding;
        }

        if (v.staked < MIN_STAKE) {
            v.isActive = false;
        }

        goodDollar.fundUBIPool(slashAmount);
        emit ValidatorSlashed(validator, slashAmount, reason);
    }

    // ============ Rewards ============

    /**
     * @notice Calculate pending rewards for a validator.
     */
    function pendingRewards(address validator) public view returns (uint256) {
        Validator storage v = validators[validator];
        if (!v.isActive || v.staked == 0) return 0;

        uint256 elapsed = block.timestamp - v.lastStakeTime;
        uint256 annualReward = (v.staked * rewardRateBPS) / 10000;
        return (annualReward * elapsed) / 365 days;
    }

    /**
     * @notice Claim accumulated staking rewards.
     */
    function claimRewards() external {
        Validator storage v = validators[msg.sender];
        require(v.isActive, "Not a validator");
        uint256 rewards = pendingRewards(msg.sender);
        require(rewards > 0, "No rewards");
        v.lastStakeTime = block.timestamp;
        goodDollar.transfer(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }

    // ============ View ============

    function activeValidatorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) count++;
        }
        return count;
    }

    function validatorCount() external view returns (uint256) {
        return validatorList.length;
    }

    function getUnbondingRequest(address validator)
        external
        view
        returns (uint256 amount, uint256 unbondAt)
    {
        return (validators[validator].unbonding.amount, validators[validator].unbonding.unbondAt);
    }
}
