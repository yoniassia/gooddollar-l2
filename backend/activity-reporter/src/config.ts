/**
 * Activity Reporter — Configuration
 *
 * Contract addresses and protocol event definitions for all
 * GoodDollar L2 protocols whose trading activity should be
 * reported to the AgentRegistry.
 */

export const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
export const CHAIN_ID = 42069;

// Deployer/reporter private key (has admin on AgentRegistry)
export const REPORTER_KEY =
  process.env.REPORTER_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Poll interval in ms (how often to scan for new events)
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 5_000;

// How many blocks to look back on first run
export const INITIAL_LOOKBACK = Number(process.env.INITIAL_LOOKBACK) || 1000;

// ─── Contract Addresses ───────────────────────────────────────────────────────

export const ADDRESSES = {
  AgentRegistry:         '0xA9d0Fb5837f9c42c874e16da96094b14Af0e2784',
  GoodSwapRouter:        '0xaC9fCBA56E42d5960f813B9D0387F3D3bC003338',
  PerpEngine:            '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  GoodLendPool:          '0x322813fd9a801c5507c9de605d63cea4f2ce6c44',
  MarketFactory:         '0xc7cDb7A2E5dDa1B7A0E792Fe1ef08ED20A6F56D4',
  CollateralVault:       '0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5', // stocks
  VaultFactory:          '0x0b27a79cb9c0b38ee06ca3d94daa68e0ed17f953',
} as const;

// ─── Protocol Definitions ─────────────────────────────────────────────────────
// Each protocol defines: contract address, events to watch,
// and how to extract (trader, volume, fees) from each event.

export interface ProtocolDef {
  name: string;
  address: string;
  events: EventDef[];
}

export interface EventDef {
  /** Solidity event signature (for topic0 hash) */
  signature: string;
  /** How to extract the trader address from decoded log */
  traderField: string;
  /** How to compute volume in wei from decoded log */
  volumeField: string;
  /** Fee BPS applied to volume to estimate fees (or a field name) */
  feeBPS?: number;
  /** Direct fee field name in the event */
  feeField?: string;
}

export const PROTOCOLS: ProtocolDef[] = [
  {
    name: 'swap',
    address: ADDRESSES.GoodSwapRouter,
    events: [
      {
        // Swap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address indexed to)
        signature: 'Swap(address,address,uint256,uint256,address)',
        traderField: 'to',       // the recipient = the trader
        volumeField: 'amountIn',
        feeBPS: 30, // 0.3% pool fee
      },
    ],
  },
  {
    name: 'perps',
    address: ADDRESSES.PerpEngine,
    events: [
      {
        // PositionOpened(address indexed trader, uint256 indexed marketId, bool isLong, uint256 size, uint256 margin, uint256 entryPrice)
        signature:
          'PositionOpened(address,uint256,bool,uint256,uint256,uint256)',
        traderField: 'trader',
        volumeField: 'size',
        feeBPS: 10, // 0.1% trade fee
      },
      {
        // PositionClosed(address indexed trader, uint256 indexed marketId, int256 pnl, uint256 exitPrice)
        signature: 'PositionClosed(address,uint256,int256,uint256)',
        traderField: 'trader',
        volumeField: 'exitPrice', // we'll use exitPrice as a proxy; real volume needs position lookup
        feeBPS: 10,
      },
    ],
  },
  {
    name: 'lend',
    address: ADDRESSES.GoodLendPool,
    events: [
      {
        // Supply(address indexed asset, address indexed user, uint256 amount)
        signature: 'Supply(address,address,uint256)',
        traderField: 'user',
        volumeField: 'amount',
        feeBPS: 0, // no direct fee on supply
      },
      {
        // Borrow(address indexed asset, address indexed user, uint256 amount)
        signature: 'Borrow(address,address,uint256)',
        traderField: 'user',
        volumeField: 'amount',
        feeBPS: 9, // flash loan fee proxy
      },
    ],
  },
  {
    name: 'predict',
    address: ADDRESSES.MarketFactory,
    events: [
      {
        // Bought(uint256 indexed marketId, address indexed buyer, bool isYES, uint256 amount, uint256 cost)
        signature: 'Bought(uint256,address,bool,uint256,uint256)',
        traderField: 'buyer',
        volumeField: 'cost',
        feeBPS: 20, // 0.2% estimated
      },
    ],
  },
  {
    name: 'stocks',
    address: ADDRESSES.CollateralVault,
    events: [
      {
        // Minted(address indexed user, bytes32 indexed ticker, uint256 syntheticAmount, uint256 collateralUsed, uint256 fee)
        signature: 'Minted(address,bytes32,uint256,uint256,uint256)',
        traderField: 'user',
        volumeField: 'collateralUsed',
        feeField: 'fee',
      },
      {
        // Burned(address indexed user, bytes32 indexed ticker, uint256 syntheticAmount, uint256 collateralReturned, uint256 fee)
        signature: 'Burned(address,bytes32,uint256,uint256,uint256)',
        traderField: 'user',
        volumeField: 'collateralReturned',
        feeField: 'fee',
      },
    ],
  },
];
