export interface PredictContractAddresses {
    marketFactory: string;
    conditionalTokens: string;
    goodDollar: string;
    ubiFeeSplitter: string;
}
export interface OnChainMarketData {
    marketId: number;
    question: string;
    endTime: number;
    status: number;
    totalYES: bigint;
    totalNO: bigint;
    collateral: bigint;
    impliedProbYES: number;
}
export interface SettlementResult {
    txHash: string;
    marketId: number;
    buyer: string;
    isYES: boolean;
    amount: string;
    gasUsed: string;
    blockNumber: number;
}
export declare class PredictContractInteraction {
    private provider;
    private signer;
    private marketFactory;
    private conditionalTokens;
    private goodDollar;
    private addresses;
    private nonce;
    constructor(rpcUrl: string, privateKey: string, addresses: PredictContractAddresses);
    /**
     * Initialize — sync nonce and ensure token approvals.
     */
    init(): Promise<void>;
    /**
     * Create a new market on-chain.
     */
    createMarket(question: string, endTime: number, resolver?: string): Promise<{
        txHash: string;
        marketId: number;
    }>;
    /**
     * Settle a matched trade by calling buy() on-chain.
     * The CLOB matches orders off-chain; this executes the on-chain settlement.
     *
     * In production, each trader would sign their own transactions.
     * For devnet, the operator executes on behalf of traders.
     */
    settleBuy(marketId: number, isYES: boolean, amount: string, buyer: string): Promise<SettlementResult>;
    /**
     * Settle a batch of trades from the CLOB.
     * Groups buys by market and side, then executes on-chain.
     */
    settleBatch(trades: Array<{
        marketId: number;
        isYES: boolean;
        amount: string;
        buyer: string;
    }>): Promise<SettlementResult[]>;
    /**
     * Close a market after its end time.
     */
    closeMarket(marketId: number): Promise<string>;
    /**
     * Resolve a market as YES or NO.
     */
    resolveMarket(marketId: number, yesWon: boolean): Promise<string>;
    /**
     * Void a market (return collateral).
     */
    voidMarket(marketId: number): Promise<string>;
    /**
     * Get on-chain market data.
     */
    getMarket(marketId: number): Promise<OnChainMarketData>;
    /**
     * Get on-chain market count.
     */
    getMarketCount(): Promise<number>;
    /**
     * Get a user's outcome token balance.
     */
    getTokenBalance(user: string, marketId: number, isYES: boolean): Promise<string>;
    /**
     * Get a user's G$ balance.
     */
    getGoodDollarBalance(user: string): Promise<string>;
    /**
     * Sync all on-chain markets into the resolver service.
     * Called on startup to populate the backend with existing markets.
     */
    syncMarkets(): Promise<OnChainMarketData[]>;
    /**
     * Listen for on-chain events.
     */
    onMarketCreated(callback: (marketId: number, question: string, endTime: number) => void): void;
    onBought(callback: (marketId: number, buyer: string, isYES: boolean, amount: string) => void): void;
    onMarketResolved(callback: (marketId: number, status: string) => void): void;
    /**
     * Remove all event listeners.
     */
    removeAllListeners(): void;
}
//# sourceMappingURL=ContractInteraction.d.ts.map