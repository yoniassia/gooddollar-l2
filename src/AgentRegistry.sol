// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Agent Registry & Leaderboard
 * @notice Tracks AI agent wallets, their trading activity across all
 *         GoodDollar L2 protocols, and ranks them by UBI generated.
 *
 *         Every protocol (swaps, perps, predict, lend, stable, stocks, yield)
 *         calls `recordActivity()` when an agent executes a trade. The registry
 *         maintains cumulative stats and a leaderboard.
 *
 *         Supports agent profiles (name, avatar URI, strategy description) so
 *         the frontend can render a rich leaderboard.
 *
 *         33% of every fee on GoodDollar L2 funds UBI. This contract tracks
 *         how much each agent has *indirectly* contributed to UBI through fees.
 */
contract AgentRegistry {
    // ============ Types ============

    struct AgentProfile {
        string name;           // "AlphaBot", "YieldFarmer9000"
        string avatarURI;      // IPFS or https URI for avatar
        string strategy;       // "Momentum trading on perps + yield farming"
        address owner;         // who registered the agent (can update profile)
        uint256 registeredAt;  // block.timestamp of registration
        bool active;           // can be deactivated by owner
    }

    struct AgentStats {
        uint256 totalTrades;       // number of trades across all protocols
        uint256 totalVolume;       // cumulative volume in wei
        uint256 totalFeesGenerated; // fees paid (some portion → UBI)
        uint256 ubiContribution;   // estimated UBI contribution (fees * 33.33%)
        uint256 totalPnL;          // net P&L (can be negative, stored as int via offset)
        bool pnlPositive;          // true if P&L >= 0
        uint256 lastActiveAt;      // last trade timestamp
    }

    struct ProtocolActivity {
        uint256 trades;
        uint256 volume;
        uint256 fees;
    }

    // ============ State ============

    address public admin;
    uint256 public ubiBPS = 3333; // 33.33% of fees → UBI

    /// @notice Hard cap on registered agents to bound getTopAgents gas usage
    uint256 public maxAgents = 10_000;
    /// @notice Hard cap on leaderboard query size (outer × inner = count × n)
    uint256 public constant MAX_LEADERBOARD_COUNT = 200;

    // All registered agents
    address[] public agents;
    mapping(address => bool) public isRegistered;
    mapping(address => AgentProfile) public profiles;
    mapping(address => AgentStats) public stats;

    // Per-protocol breakdown: agent → protocol → activity
    mapping(address => mapping(string => ProtocolActivity)) public protocolStats;

    // Authorized reporters (protocol contracts that can record activity)
    mapping(address => bool) public authorizedReporters;
    address[] public reporters;

    // Leaderboard cache (sorted by UBI contribution, updated on query)
    uint256 public totalAgents;
    uint256 public totalTrades;
    uint256 public totalVolume;
    uint256 public totalUBIGenerated;

    // ============ Events ============

    event AgentRegistered(address indexed agent, string name, address indexed owner);
    event AgentUpdated(address indexed agent, string name);
    event AgentDeactivated(address indexed agent);
    event ActivityRecorded(
        address indexed agent,
        string protocol,
        uint256 volume,
        uint256 fees,
        uint256 ubiShare
    );
    event ReporterAdded(address indexed reporter);
    event ReporterRemoved(address indexed reporter);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "AgentRegistry: not admin");
        _;
    }

    modifier onlyReporter() {
        require(authorizedReporters[msg.sender] || msg.sender == admin, "AgentRegistry: not reporter");
        _;
    }

    // ============ Constructor ============

    constructor() {
        admin = msg.sender;
    }

    // ============ Agent Registration ============

    /// @notice Register a new AI agent wallet
    function registerAgent(
        address agent,
        string calldata name,
        string calldata avatarURI,
        string calldata strategy
    ) external {
        require(!isRegistered[agent], "AgentRegistry: already registered");
        require(bytes(name).length > 0, "AgentRegistry: name required");
        require(agents.length < maxAgents, "AgentRegistry: capacity reached");

        isRegistered[agent] = true;
        agents.push(agent);
        totalAgents++;

        profiles[agent] = AgentProfile({
            name: name,
            avatarURI: avatarURI,
            strategy: strategy,
            owner: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        stats[agent] = AgentStats({
            totalTrades: 0,
            totalVolume: 0,
            totalFeesGenerated: 0,
            ubiContribution: 0,
            totalPnL: 0,
            pnlPositive: true,
            lastActiveAt: block.timestamp
        });

        emit AgentRegistered(agent, name, msg.sender);
    }

    /// @notice Update agent profile (only owner)
    function updateProfile(
        address agent,
        string calldata name,
        string calldata avatarURI,
        string calldata strategy
    ) external {
        require(isRegistered[agent], "AgentRegistry: not registered");
        require(profiles[agent].owner == msg.sender || msg.sender == admin, "AgentRegistry: not owner");

        if (bytes(name).length > 0) profiles[agent].name = name;
        if (bytes(avatarURI).length > 0) profiles[agent].avatarURI = avatarURI;
        if (bytes(strategy).length > 0) profiles[agent].strategy = strategy;

        emit AgentUpdated(agent, profiles[agent].name);
    }

    /// @notice Deactivate agent (only owner or admin)
    function deactivateAgent(address agent) external {
        require(isRegistered[agent], "AgentRegistry: not registered");
        require(profiles[agent].owner == msg.sender || msg.sender == admin, "AgentRegistry: not owner");
        profiles[agent].active = false;
        emit AgentDeactivated(agent);
    }

    // ============ Activity Recording ============

    /// @notice Record trading activity for an agent (called by protocol contracts)
    function recordActivity(
        address agent,
        string calldata protocol,
        uint256 volume,
        uint256 fees
    ) external onlyReporter {
        // Auto-register unknown agents with a default profile
        if (!isRegistered[agent]) {
            isRegistered[agent] = true;
            agents.push(agent);
            totalAgents++;
            profiles[agent] = AgentProfile({
                name: "Anonymous Agent",
                avatarURI: "",
                strategy: "",
                owner: agent,
                registeredAt: block.timestamp,
                active: true
            });
            stats[agent] = AgentStats({
                totalTrades: 0,
                totalVolume: 0,
                totalFeesGenerated: 0,
                ubiContribution: 0,
                totalPnL: 0,
                pnlPositive: true,
                lastActiveAt: block.timestamp
            });
            emit AgentRegistered(agent, "Anonymous Agent", agent);
        }

        uint256 ubiShare = (fees * ubiBPS) / 10000;

        // Update agent stats
        stats[agent].totalTrades++;
        stats[agent].totalVolume += volume;
        stats[agent].totalFeesGenerated += fees;
        stats[agent].ubiContribution += ubiShare;
        stats[agent].lastActiveAt = block.timestamp;

        // Update per-protocol stats
        protocolStats[agent][protocol].trades++;
        protocolStats[agent][protocol].volume += volume;
        protocolStats[agent][protocol].fees += fees;

        // Update global stats
        totalTrades++;
        totalVolume += volume;
        totalUBIGenerated += ubiShare;

        emit ActivityRecorded(agent, protocol, volume, fees, ubiShare);
    }

    /// @notice Record P&L update for an agent
    function recordPnL(address agent, uint256 amount, bool positive) external onlyReporter {
        require(isRegistered[agent], "AgentRegistry: not registered");
        stats[agent].totalPnL = amount;
        stats[agent].pnlPositive = positive;
    }

    // ============ Leaderboard Queries ============

    /// @notice Get top N agents by UBI contribution (capped at MAX_LEADERBOARD_COUNT)
    function getTopAgents(uint256 count) external view returns (
        address[] memory topAddrs,
        string[] memory topNames,
        uint256[] memory topUBI,
        uint256[] memory topVolume,
        uint256[] memory topTrades
    ) {
        if (count > MAX_LEADERBOARD_COUNT) count = MAX_LEADERBOARD_COUNT;
        uint256 len = agents.length;
        if (count > len) count = len;

        // Selection sort for top N — bounded by MAX_LEADERBOARD_COUNT × maxAgents
        topAddrs = new address[](count);
        topNames = new string[](count);
        topUBI = new uint256[](count);
        topVolume = new uint256[](count);
        topTrades = new uint256[](count);

        bool[] memory used = new bool[](len);

        for (uint256 i = 0; i < count; i++) {
            uint256 bestIdx = 0;
            uint256 bestUBI = 0;
            bool found = false;

            for (uint256 j = 0; j < len; j++) {
                if (!used[j] && profiles[agents[j]].active && stats[agents[j]].ubiContribution > bestUBI) {
                    bestIdx = j;
                    bestUBI = stats[agents[j]].ubiContribution;
                    found = true;
                }
            }

            if (!found) break;

            used[bestIdx] = true;
            address a = agents[bestIdx];
            topAddrs[i] = a;
            topNames[i] = profiles[a].name;
            topUBI[i] = stats[a].ubiContribution;
            topVolume[i] = stats[a].totalVolume;
            topTrades[i] = stats[a].totalTrades;
        }
    }

    /// @notice Get agent count
    function getAgentCount() external view returns (uint256) {
        return agents.length;
    }

    /// @notice Get agent address by index
    function getAgent(uint256 index) external view returns (address) {
        return agents[index];
    }

    /// @notice Get full profile + stats for an agent
    function getAgentInfo(address agent) external view returns (
        AgentProfile memory profile,
        AgentStats memory agentStats
    ) {
        return (profiles[agent], stats[agent]);
    }

    /// @notice Get agent's per-protocol breakdown
    function getAgentProtocolStats(address agent, string calldata protocol)
        external view returns (ProtocolActivity memory)
    {
        return protocolStats[agent][protocol];
    }

    /// @notice Get global dashboard stats
    function getDashboardStats() external view returns (
        uint256 _totalAgents,
        uint256 _totalTrades,
        uint256 _totalVolume,
        uint256 _totalUBI
    ) {
        return (totalAgents, totalTrades, totalVolume, totalUBIGenerated);
    }

    // ============ Admin ============

    function addReporter(address reporter) external onlyAdmin {
        require(!authorizedReporters[reporter], "AgentRegistry: already reporter");
        authorizedReporters[reporter] = true;
        reporters.push(reporter);
        emit ReporterAdded(reporter);
    }

    function removeReporter(address reporter) external onlyAdmin {
        authorizedReporters[reporter] = false;
        emit ReporterRemoved(reporter);
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    function setUBIBPS(uint256 _bps) external onlyAdmin {
        require(_bps <= 10000, "AgentRegistry: bps too high");
        ubiBPS = _bps;
    }

    function setMaxAgents(uint256 _max) external onlyAdmin {
        require(_max >= agents.length, "AgentRegistry: below current count");
        maxAgents = _max;
    }
}
