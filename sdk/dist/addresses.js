/**
 * Deployed contract addresses on GoodDollar L2 devnet (chain ID 42069)
 */
export const ADDRESSES = {
    // Core tokens
    GoodDollarToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    MockUSDC: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
    MockWETH: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
    // Core infrastructure
    UBIFeeSplitter: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    ValidatorStaking: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    UBIFeeHook: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    // Perpetuals
    FundingRate: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    MarginVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    PriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    // Prediction Markets
    ConditionalTokens: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    MarketFactory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    // Stocks / Synthetics
    CollateralVault: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    SyntheticAssetFactory: '0x610178dA211FEf7D417bC0e6FeD39F05609AD788',
    // Lending
    GoodLendPool: '0x322813Fd9A801c5507C9de605D63ceA4f2Ce6C44',
};
/** Chain configuration */
export const CHAIN_CONFIG = {
    id: 42069,
    name: 'GoodDollar L2',
    rpcUrl: 'http://localhost:8545',
    explorerUrl: 'https://explorer.goodclaw.org',
};
