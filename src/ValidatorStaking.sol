// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Validator Staking
 * @notice Validators stake G$ to participate in sequencing.
 *         Staked G$ earns rewards. Slashed G$ goes to UBI pool.
 * @dev Phase 1: Simple staking for future decentralized sequencer.
 *      Phase 2: Sequencer auction (MEV-Share style).
 *      Phase 3: Shared sequencing (Espresso/Astria).
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
    uint256 public rewardRateBPS = 500; // 5% annual reward rate
    uint256 public slashBPS = 1000;     // 10% slash for misbehavior
    
    struct Validator {
        uint256 staked;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        bool isActive;
        string name;
        string endpoint; // RPC endpoint
    }
    
    mapping(address => Validator) public validators;
    address[] public validatorList;
    uint256 public totalStaked;
    
    address public admin;
    
    event ValidatorStaked(address indexed validator, uint256 amount, string name);
    event ValidatorUnstaked(address indexed validator, uint256 amount);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);
    event RewardsClaimed(address indexed validator, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    constructor(address _goodDollar, address _admin) {
        goodDollar = IGoodDollarToken(_goodDollar);
        admin = _admin;
    }
    
    /**
     * @notice Stake G$ to become a validator.
     */
    function stake(uint256 amount, string calldata name, string calldata endpoint) external {
        require(amount >= MIN_STAKE, "Below minimum stake");
        
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
     * @notice Unstake G$. 7-day unbonding period (simplified here).
     */
    function unstake(uint256 amount) external {
        Validator storage v = validators[msg.sender];
        require(v.isActive, "Not a validator");
        require(v.staked >= amount, "Insufficient stake");
        
        v.staked -= amount;
        totalStaked -= amount;
        
        if (v.staked < MIN_STAKE) {
            v.isActive = false;
        }
        
        goodDollar.transfer(msg.sender, amount);
        emit ValidatorUnstaked(msg.sender, amount);
    }
    
    /**
     * @notice Slash a validator. Slashed G$ goes to UBI pool.
     */
    function slash(address validator, string calldata reason) external onlyAdmin {
        Validator storage v = validators[validator];
        require(v.isActive, "Not active validator");
        
        uint256 slashAmount = (v.staked * slashBPS) / 10000;
        v.staked -= slashAmount;
        totalStaked -= slashAmount;
        
        // Slashed funds go to UBI — beautiful
        goodDollar.transfer(address(goodDollar), slashAmount);
        
        if (v.staked < MIN_STAKE) {
            v.isActive = false;
        }
        
        emit ValidatorSlashed(validator, slashAmount, reason);
    }
    
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
}
