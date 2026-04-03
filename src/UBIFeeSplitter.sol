// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UBI Fee Splitter
 * @notice Every dApp on GoodDollar L2 routes fees through this contract.
 *         A percentage of ALL fees goes to the UBI pool.
 * @dev dApps call `splitFee()` to automatically route the UBI portion.
 */
import "./interfaces/IGoodDollarToken.sol";

contract UBIFeeSplitter {
    IGoodDollarToken public immutable goodDollar;
    
    // Fee split configuration (in basis points, 10000 = 100%)
    uint256 public ubiBPS = 3333;      // 33.33% to UBI pool
    uint256 public protocolBPS = 1667; // 16.67% to protocol treasury
    // Remaining 50% goes back to the dApp (liquidity providers, lenders, etc.)
    
    address public protocolTreasury;
    address public admin;
    
    // Registered dApps
    mapping(address => bool) public registeredDApps;
    address[] public dAppList;
    
    // Stats
    uint256 public totalFeesCollected;
    uint256 public totalUBIFunded;
    
    event FeeSplit(
        address indexed dApp,
        uint256 totalFee,
        uint256 ubiShare,
        uint256 protocolShare,
        uint256 dAppShare
    );
    event DAppRegistered(address indexed dApp, string name);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    constructor(address _goodDollar, address _treasury, address _admin) {
        goodDollar = IGoodDollarToken(_goodDollar);
        protocolTreasury = _treasury;
        admin = _admin;
    }
    
    /**
     * @notice Split a fee payment. Called by dApps after collecting fees.
     * @param totalFee Total fee amount in G$
     * @param dAppRecipient Where to send the dApp's share
     * @return ubiShare Amount sent to UBI pool
     * @return protocolShare Amount sent to protocol treasury  
     * @return dAppShare Amount sent to dApp
     */
    function splitFee(uint256 totalFee, address dAppRecipient) external returns (
        uint256 ubiShare,
        uint256 protocolShare,
        uint256 dAppShare
    ) {
        require(totalFee > 0, "Zero fee");
        
        // Calculate shares
        ubiShare = (totalFee * ubiBPS) / 10000;
        protocolShare = (totalFee * protocolBPS) / 10000;
        dAppShare = totalFee - ubiShare - protocolShare;
        
        // Transfer from sender
        goodDollar.transferFrom(msg.sender, address(this), totalFee);
        
        // Route to destinations
        goodDollar.fundUBIPool(ubiShare);
        goodDollar.transfer(protocolTreasury, protocolShare);
        goodDollar.transfer(dAppRecipient, dAppShare);
        
        // Update stats
        totalFeesCollected += totalFee;
        totalUBIFunded += ubiShare;
        
        emit FeeSplit(msg.sender, totalFee, ubiShare, protocolShare, dAppShare);
    }
    
    /**
     * @notice Register a dApp. For tracking and governance.
     */
    function registerDApp(address dApp, string calldata dAppName) external onlyAdmin {
        if (!registeredDApps[dApp]) {
            registeredDApps[dApp] = true;
            dAppList.push(dApp);
            emit DAppRegistered(dApp, dAppName);
        }
    }
    
    // ============ Governance ============
    
    function setFeeSplit(uint256 _ubiBPS, uint256 _protocolBPS) external onlyAdmin {
        require(_ubiBPS + _protocolBPS <= 10000, "Exceeds 100%");
        ubiBPS = _ubiBPS;
        protocolBPS = _protocolBPS;
    }
    
    function setTreasury(address _treasury) external onlyAdmin {
        protocolTreasury = _treasury;
    }
    
    function dAppCount() external view returns (uint256) {
        return dAppList.length;
    }

    /**
     * @notice Returns the G$ balance held in this contract available for UBI claims.
     *         UBIClaimV2 queries this to determine if supplemental pool funds are ready.
     */
    function claimableBalance() external view returns (uint256) {
        return goodDollar.balanceOf(address(this));
    }
}
