/**
 * Multi-Agent Orchestration Helpers for GoodDollar L2
 *
 * Enables AI agent swarms to coordinate trading, lending, market-making,
 * and arbitrage — all while funding UBI.
 *
 * Key concepts:
 * - AgentRole: predefined strategies (trader, arbitrageur, liquidator, market-maker)
 * - AgentSwarm: coordinate multiple agents with shared state
 * - SignalBus: pub/sub message passing between agents
 * - PortfolioAggregator: unified view across all agent wallets
 */
import { type Address } from 'viem';
import { GoodDollarSDK } from './client';
export type AgentRole = 'trader' | 'arbitrageur' | 'liquidator' | 'market-maker' | 'oracle' | 'custom';
export interface AgentConfig {
    /** Unique name for this agent */
    name: string;
    /** Agent's role/strategy */
    role: AgentRole;
    /** Private key for signing transactions */
    privateKey: `0x${string}`;
    /** RPC URL override (optional) */
    rpcUrl?: string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
export interface Signal {
    /** Signal type identifier */
    type: string;
    /** Sender agent name */
    from: string;
    /** Signal payload */
    data: Record<string, unknown>;
    /** Timestamp */
    timestamp: number;
}
export type SignalHandler = (signal: Signal) => void | Promise<void>;
export interface AgentState {
    name: string;
    role: AgentRole;
    address: Address;
    balances: {
        eth: bigint;
        gd: bigint;
        usdc: bigint;
    };
    lastActive: number;
    metadata: Record<string, unknown>;
}
export interface SwarmSnapshot {
    agents: AgentState[];
    totalEth: bigint;
    totalGd: bigint;
    totalUsdc: bigint;
    signalCount: number;
    timestamp: number;
}
/**
 * In-process pub/sub for agent-to-agent communication.
 *
 * Usage:
 *   const bus = new SignalBus()
 *   bus.on('price-alert', async (signal) => { ... })
 *   bus.emit({ type: 'price-alert', from: 'oracle', data: { price: 3000 } })
 */
export declare class SignalBus {
    private handlers;
    private history;
    private maxHistory;
    constructor(maxHistory?: number);
    /** Subscribe to a signal type */
    on(type: string, handler: SignalHandler): () => void;
    /** Subscribe to all signals */
    onAny(handler: SignalHandler): () => void;
    /** Emit a signal to all matching subscribers */
    emit(signal: Omit<Signal, 'timestamp'>): Promise<void>;
    /** Get signal history, optionally filtered by type */
    getHistory(type?: string, limit?: number): Signal[];
    /** Total signals emitted */
    get signalCount(): number;
    /** Clear all handlers and history */
    reset(): void;
}
/**
 * A managed agent wraps a GoodDollarSDK instance with orchestration metadata.
 */
export declare class ManagedAgent {
    readonly sdk: GoodDollarSDK;
    readonly name: string;
    readonly role: AgentRole;
    readonly metadata: Record<string, unknown>;
    private _lastActive;
    constructor(config: AgentConfig);
    get address(): Address;
    get lastActive(): number;
    touch(): void;
    /** Get full agent state including on-chain balances */
    getState(): Promise<AgentState>;
}
/**
 * Coordinate multiple AI agents operating on GoodDollar L2.
 *
 * Usage:
 *   const swarm = new AgentSwarm()
 *   swarm.addAgent({ name: 'trader-1', role: 'trader', privateKey: '0x...' })
 *   swarm.addAgent({ name: 'arb-1', role: 'arbitrageur', privateKey: '0x...' })
 *
 *   // Agents can signal each other
 *   swarm.bus.on('opportunity', async (signal) => {
 *     const trader = swarm.getAgent('trader-1')
 *     // execute trade...
 *   })
 *
 *   // Get unified portfolio view
 *   const snapshot = await swarm.snapshot()
 */
export declare class AgentSwarm {
    private agents;
    readonly bus: SignalBus;
    constructor(busHistorySize?: number);
    /** Add an agent to the swarm */
    addAgent(config: AgentConfig): ManagedAgent;
    /** Remove an agent from the swarm */
    removeAgent(name: string): boolean;
    /** Get a specific agent */
    getAgent(name: string): ManagedAgent;
    /** Get all agents, optionally filtered by role */
    getAgents(role?: AgentRole): ManagedAgent[];
    /** Number of agents in the swarm */
    get size(): number;
    /** Get a unified snapshot of all agents' states */
    snapshot(): Promise<SwarmSnapshot>;
    /** Broadcast a signal from the swarm coordinator */
    broadcast(type: string, data: Record<string, unknown>): Promise<void>;
    /** Run a task across all agents of a given role in parallel */
    runParallel<T>(role: AgentRole, task: (agent: ManagedAgent) => Promise<T>): Promise<Array<{
        agent: string;
        result?: T;
        error?: Error;
    }>>;
    /** Run a task sequentially across agents (for order-dependent operations) */
    runSequential<T>(agents: string[], task: (agent: ManagedAgent) => Promise<T>): Promise<Array<{
        agent: string;
        result?: T;
        error?: Error;
    }>>;
    /** Reset the swarm (remove all agents, clear signal bus) */
    reset(): void;
}
export interface ProtocolExposure {
    perpPositions: Array<{
        agent: string;
        marketId: bigint;
        size: bigint;
        isLong: boolean;
    }>;
    lendingDeposits: Array<{
        agent: string;
        asset: string;
        collateral: bigint;
        debt: bigint;
    }>;
    predictPositions: Array<{
        agent: string;
        marketId: bigint;
        question: string;
    }>;
    stockPositions: Array<{
        agent: string;
        ticker: string;
        collateral: bigint;
        debt: bigint;
    }>;
}
/**
 * Aggregates portfolio data across an entire agent swarm.
 */
export declare class PortfolioAggregator {
    private swarm;
    constructor(swarm: AgentSwarm);
    /** Get combined balance summary */
    getBalanceSummary(): Promise<{
        agents: Array<{
            name: string;
            address: Address;
            eth: string;
            gd: string;
            usdc: string;
        }>;
        totals: {
            eth: string;
            gd: string;
            usdc: string;
        };
    }>;
    /** Scan all agents for protocol positions */
    getProtocolExposure(): Promise<ProtocolExposure>;
}
/**
 * Pre-built strategy patterns for common agent coordination scenarios.
 */
export declare const Strategies: {
    /**
     * Create a standard trading swarm with role-based agents.
     * Uses Anvil's deterministic test keys for devnet.
     */
    createDevnetSwarm(config?: {
        rpcUrl?: string;
        traders?: number;
        arbitrageurs?: number;
        liquidators?: number;
    }): AgentSwarm;
    /**
     * Wire up standard signal patterns for a trading swarm:
     * - Oracle agents broadcast price updates
     * - Arbitrageurs listen for price deviations
     * - Liquidators listen for unhealthy positions
     * - Traders listen for entry signals
     */
    wireStandardSignals(swarm: AgentSwarm): void;
};
