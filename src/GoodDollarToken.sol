// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC20.sol";

/**
 * @title GoodDollar Token (G$) — L2 Native
 * @notice The native UBI token of the GoodDollar L2 chain.
 * @dev Deployed as a precompile on the L2 genesis. Supports:
 *   - Daily UBI claims for verified humans
 *   - Fee collection from all dApps → UBI pool
 *   - Validator staking
 */
contract GoodDollarToken {
    string public constant name = "GoodDollar";
    string public constant symbol = "G$";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // UBI Configuration
    uint256 public dailyUBIAmount = 1e18; // 1 G$ per day per person (adjustable)
    uint256 public constant CLAIM_INTERVAL = 24 hours;
    
    // UBI Pool — funded by dApp fees
    uint256 public ubiPool;
    
    // Identity & Claims
    mapping(address => bool) public isVerifiedHuman;
    mapping(address => uint256) public lastClaimTime;
    uint256 public totalVerifiedHumans;
    
    // Governance
    address public admin;
    address public identityOracle; // Updates verified status

    // Authorized minters (e.g. UBIClaimV2)
    mapping(address => bool) public minters;

    // Fee Splitter — dApps register here
    uint256 public constant UBI_FEE_BPS = 1000; // 10% of fees go to UBI pool
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event UBIClaimed(address indexed claimer, uint256 amount, uint256 timestamp);
    event HumanVerified(address indexed human, bool status);
    event UBIPoolFunded(address indexed from, uint256 amount);
    event DailyUBIDistributed(uint256 totalAmount, uint256 recipients);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    modifier onlyIdentityOracle() {
        require(msg.sender == identityOracle, "Not identity oracle");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized minter");
        _;
    }
    
    constructor(address _admin, address _identityOracle, uint256 _initialSupply) {
        admin = _admin;
        identityOracle = _identityOracle;
        _mint(_admin, _initialSupply);
    }
    
    // ============ ERC20 Standard ============
    
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "Insufficient allowance");
            allowance[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }
    
    // ============ UBI Claims ============
    
    /**
     * @notice Claim daily UBI. Must be a verified human. One claim per 24h.
     * @dev The claim amount comes from two sources:
     *   1. Base UBI (newly minted G$)
     *   2. Share of UBI pool (funded by dApp fees)
     */
    function claimUBI() external {
        require(isVerifiedHuman[msg.sender], "Not verified human");
        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + CLAIM_INTERVAL,
            "Already claimed today"
        );
        
        lastClaimTime[msg.sender] = block.timestamp;
        
        // Base UBI: mint new G$
        uint256 baseAmount = dailyUBIAmount;
        _mint(msg.sender, baseAmount);
        
        // Pool UBI: distribute share of fee pool
        uint256 poolShare = 0;
        if (ubiPool > 0 && totalVerifiedHumans > 0) {
            poolShare = ubiPool / totalVerifiedHumans;
            if (poolShare > 0) {
                ubiPool -= poolShare;
                _transfer(address(this), msg.sender, poolShare);
            }
        }
        
        emit UBIClaimed(msg.sender, baseAmount + poolShare, block.timestamp);
    }
    
    /**
     * @notice Fund the UBI pool. Called by dApps sending their UBI fee share.
     */
    function fundUBIPool(uint256 amount) external {
        _transfer(msg.sender, address(this), amount);
        ubiPool += amount;
        emit UBIPoolFunded(msg.sender, amount);
    }
    
    /**
     * @notice Calculate the UBI fee for a given amount (used by dApps).
     */
    function calculateUBIFee(uint256 amount) external pure returns (uint256) {
        return (amount * UBI_FEE_BPS) / 10000;
    }
    
    // ============ Identity ============
    
    function verifyHuman(address human, bool status) external onlyIdentityOracle {
        if (status && !isVerifiedHuman[human]) {
            totalVerifiedHumans++;
        } else if (!status && isVerifiedHuman[human]) {
            totalVerifiedHumans--;
        }
        isVerifiedHuman[human] = status;
        emit HumanVerified(human, status);
    }
    
    // Batch verify (for migration from Celo)
    function batchVerifyHumans(address[] calldata humans) external onlyIdentityOracle {
        for (uint256 i = 0; i < humans.length; i++) {
            if (!isVerifiedHuman[humans[i]]) {
                isVerifiedHuman[humans[i]] = true;
                totalVerifiedHumans++;
                emit HumanVerified(humans[i], true);
            }
        }
    }
    
    // ============ Governance ============
    
    function setDailyUBIAmount(uint256 amount) external onlyAdmin {
        dailyUBIAmount = amount;
    }
    
    function setIdentityOracle(address _oracle) external onlyAdmin {
        identityOracle = _oracle;
    }
    
    function setAdmin(address _admin) external onlyAdmin {
        admin = _admin;
    }

    function setMinter(address minter, bool authorized) external onlyAdmin {
        minters[minter] = authorized;
    }

    /**
     * @notice Mint G$ tokens. Only callable by authorized minters (e.g. UBIClaimV2).
     */
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
    
    // ============ Internal ============
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
