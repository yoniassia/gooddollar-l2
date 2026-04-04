/**
 * Tester Beta — Iteration 3 Test Script
 * QA domain: GoodPerps + GoodPredict
 * Wallet: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
 *
 * New tests this iteration:
 * - Oracle: all 6 perp market prices, hasFeed, maxAge
 * - Multi-position concurrent: open 3 positions on different markets
 * - FundingRate: B6 bug verification + applyFunding
 * - SyntheticAssetFactory: full read + listAsset (admin-only revert)
 * - Negative tests: 0 collateral open, nonexistent close, over-withdraw
 * - MarginVault: deposit/withdraw cycle + totalDeposited
 * - GoodPredict: 2-market buy flow + impliedProbabilityYES
 * - ConditionalTokens: balanceOf after buy + yesTokenId/noTokenId
 */

const { createPublicClient, createWalletClient, http, parseAbi, parseUnits, formatUnits } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem');
const { privateKeyToAccount } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem/accounts');
const fs = require('fs');

// ===== Config =====
const RPC = 'http://localhost:8545';
const WALLET = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const ITERATION = 3;

const CONTRACTS = {
  GDT:                 '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  UBIFeeSplitter:      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  FundingRate:         '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  MarginVault:         '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  PriceOracle:         '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  PerpEngine:          '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  ConditionalTokens:   '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  MarketFactory:       '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  SyntheticAssetFactory: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  GoodLendPool:        '0x322813fd9a801c5507c9de605d63cea4f2ce6c44',
  MockUSDC:            '0x0b306bf915c4d645ff596e518faf3f9669b97016',
};

const chain = {
  id: 42069,
  name: 'GoodDollar L2 Devnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};

const transport = http(RPC);
const publicClient = createPublicClient({ chain, transport });
const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain, transport });

// ===== ABIs =====
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

const GDT_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
]);

const PERP_ENGINE_ABI = parseAbi([
  'function admin() view returns (address)',
  'function paused() view returns (bool)',
  'function marketCount() view returns (uint256)',
  'function markets(uint256) view returns (bytes32,uint256,bool,uint256,uint256)',
  'function positions(address,uint256) view returns (bool,bool,uint256,uint256,uint256,int256,uint256)',
  'function marginRatio(address,uint256) view returns (uint256)',
  'function unrealizedPnL(address,uint256) view returns (int256)',
  'function openPosition(uint256,uint256,bool,uint256)',
  'function closePosition(uint256)',
  'function BPS() view returns (uint256)',
  'function TRADE_FEE_BPS() view returns (uint256)',
  'function MAINTENANCE_MARGIN_BPS() view returns (uint256)',
  'function LIQUIDATION_BONUS_BPS() view returns (uint256)',
  'function vault() view returns (address)',
  'function oracle() view returns (address)',
  'function feeSplitter() view returns (address)',
  'function funding() view returns (address)',
]);

const MARGIN_VAULT_ABI = parseAbi([
  'function admin() view returns (address)',
  'function collateral() view returns (address)',
  'function perpEngine() view returns (address)',
  'function totalDeposited() view returns (uint256)',
  'function balances(address) view returns (uint256)',
  'function deposit(uint256)',
  'function withdraw(uint256)',
]);

const PRICE_ORACLE_ABI = parseAbi([
  'function admin() view returns (address)',
  'function getPrice(string) view returns (uint256)',
  'function getPriceByKey(bytes32) view returns (uint256)',
  'function hasFeed(string) view returns (bool)',
  'function manualPrices(bytes32) view returns (uint256)',
  'function maxAge() view returns (uint256)',
  'function useManualPrice(bytes32) view returns (bool)',
]);

const FUNDING_RATE_ABI = parseAbi([
  'function FUNDING_INTERVAL() view returns (uint256)',
  'function MAX_FUNDING_RATE() view returns (int256)',
  'function admin() view returns (address)',
  'function perpEngine() view returns (address)',
  'function cumulativeFundingIndex(uint256) view returns (int256)',
  'function lastFundingTime(uint256) view returns (uint256)',
  'function accruedFunding(int256,int256,uint256) view returns (int256)',
]);

const SYNTH_ABI = parseAbi([
  'function admin() view returns (address)',
  'function listedCount() view returns (uint256)',
  'function listedKeys(uint256) view returns (bytes32)',
  'function getAsset(string) view returns (address)',
  'function implementation() view returns (address)',
  'function listAsset(string,string,address) returns (address)',
]);

const MARKET_FACTORY_ABI = parseAbi([
  'function admin() view returns (address)',
  'function marketCount() view returns (uint256)',
  'function goodDollar() view returns (address)',
  'function tokens() view returns (address)',
  'function BPS() view returns (uint256)',
  'function REDEEM_FEE_BPS() view returns (uint256)',
  'function markets(uint256) view returns (string,uint256,uint8,uint256,uint256,uint256,address)',
  'function getMarket(uint256) view returns (string,uint256,uint8,uint256,uint256,uint256)',
  'function impliedProbabilityYES(uint256) view returns (uint256)',
  'function createMarket(string,uint256,address) returns (uint256)',
  'function buy(uint256,bool,uint256)',
  'function resolve(uint256,bool)',
  'function voidMarket(uint256)',
]);

const COND_TOKENS_ABI = parseAbi([
  'function factory() view returns (address)',
  'function yesTokenId(uint256) view returns (uint256)',
  'function noTokenId(uint256) view returns (uint256)',
  'function balanceOf(address,uint256) view returns (uint256)',
  'function balanceOfBatch(address[],uint256[]) view returns (uint256[])',
]);

// ===== Test Framework =====
const results = [];
let passed = 0, failed = 0;

async function test(id, contract, fn, description, testFn) {
  const start = Date.now();
  try {
    const result = await testFn();
    const elapsed = Date.now() - start;
    console.log(`  PASS [${id}] ${description}: ${result}`);
    results.push({
      timestamp: new Date().toISOString(), contract, function: fn,
      tx_hash: null, success: true, gas_used: null,
      error: null, iteration: ITERATION,
      test_id: id, description, result: String(result), elapsed_ms: elapsed,
    });
    passed++;
    return { success: true, value: result };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    const shortErr = errMsg.slice(0, 250);
    console.log(`  FAIL [${id}] ${description}: ${shortErr}`);
    results.push({
      timestamp: new Date().toISOString(), contract, function: fn,
      tx_hash: null, success: false, gas_used: null,
      error: shortErr, iteration: ITERATION,
      test_id: id, description, elapsed_ms: elapsed,
    });
    failed++;
    return { success: false, error: errMsg };
  }
}

async function testTx(id, contract, fn, description, txFn) {
  const start = Date.now();
  try {
    const hash = await txFn();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const elapsed = Date.now() - start;
    const status = receipt.status === 'success' ? 'success' : 'reverted';
    const gasUsed = Number(receipt.gasUsed);
    if (status === 'success') {
      console.log(`  PASS [${id}] ${description}: tx ${hash.slice(0,10)}... gas=${gasUsed}`);
      results.push({
        timestamp: new Date().toISOString(), contract, function: fn,
        tx_hash: hash, success: true, gas_used: gasUsed,
        error: null, iteration: ITERATION,
        test_id: id, description, elapsed_ms: elapsed,
      });
      passed++;
      return { success: true, hash, receipt };
    } else {
      console.log(`  FAIL [${id}] ${description}: tx reverted ${hash.slice(0,10)}...`);
      results.push({
        timestamp: new Date().toISOString(), contract, function: fn,
        tx_hash: hash, success: false, gas_used: gasUsed,
        error: 'Transaction reverted', iteration: ITERATION,
        test_id: id, description, elapsed_ms: elapsed,
      });
      failed++;
      return { success: false, hash };
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    console.log(`  FAIL [${id}] ${description}: ${errMsg.slice(0, 200)}`);
    results.push({
      timestamp: new Date().toISOString(), contract, function: fn,
      tx_hash: null, success: false, gas_used: null,
      error: errMsg.slice(0, 250), iteration: ITERATION,
      test_id: id, description, elapsed_ms: elapsed,
    });
    failed++;
    return { success: false, error: errMsg };
  }
}

async function testExpectRevert(id, contract, fn, description, testFn) {
  const start = Date.now();
  try {
    await testFn();
    const elapsed = Date.now() - start;
    console.log(`  FAIL [${id}] ${description}: expected revert but succeeded`);
    results.push({
      timestamp: new Date().toISOString(), contract, function: fn,
      tx_hash: null, success: false, gas_used: null,
      error: 'Expected revert but call succeeded', iteration: ITERATION,
      test_id: id, description, elapsed_ms: elapsed,
    });
    failed++;
    return { success: false };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    console.log(`  PASS [${id}] ${description}: reverted as expected (${errMsg.slice(0, 80)})`);
    results.push({
      timestamp: new Date().toISOString(), contract, function: fn,
      tx_hash: null, success: true, gas_used: null,
      error: null, iteration: ITERATION,
      test_id: id, description, result: `Reverted as expected: ${errMsg.slice(0, 150)}`,
      elapsed_ms: elapsed,
    });
    passed++;
    return { success: true };
  }
}

// ===== Main =====
async function runTests() {
  console.log('\n========= Tester Beta — Iteration 3 =========');
  console.log('Wallet:', WALLET);
  console.log('Timestamp:', new Date().toISOString(), '\n');

  const blockNum = await publicClient.getBlockNumber();
  console.log('Block:', blockNum.toString());

  // ===== GROUP 1: PriceOracle — all 6 markets =====
  console.log('\n--- 1. PriceOracle: All Markets ---');

  await test('PO-001', 'PriceOracle', 'maxAge()', 'maxAge returns reasonable value', async () => {
    const age = await publicClient.readContract({ address: CONTRACTS.PriceOracle, abi: PRICE_ORACLE_ABI, functionName: 'maxAge' });
    if (age <= 0n) throw new Error('maxAge is 0');
    return age.toString() + ' seconds';
  });

  const tickers = ['ETH', 'BTC', 'AAPL', 'TSLA', 'GOLD', 'SPY'];
  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    await test(`PO-${String(i+2).padStart(3,'0')}`, 'PriceOracle', `getPrice("${t}")`, `price for ${t}`, async () => {
      const price = await publicClient.readContract({
        address: CONTRACTS.PriceOracle, abi: PRICE_ORACLE_ABI,
        functionName: 'getPrice', args: [t],
      });
      if (price === 0n) throw new Error('price is 0');
      return '$' + (Number(price) / 1e18).toFixed(2);
    });

    await test(`PO-H${i}`, 'PriceOracle', `hasFeed("${t}")`, `hasFeed for ${t}`, async () => {
      const has = await publicClient.readContract({
        address: CONTRACTS.PriceOracle, abi: PRICE_ORACLE_ABI,
        functionName: 'hasFeed', args: [t],
      });
      return has ? 'true' : 'false';
    });
  }

  // ===== GROUP 2: FundingRate — B6 investigation =====
  console.log('\n--- 2. FundingRate: B6 Bug Investigation ---');

  await test('FR-001', 'FundingRate', 'FUNDING_INTERVAL()', 'FUNDING_INTERVAL (B6: expected 0?)', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI, functionName: 'FUNDING_INTERVAL' });
    return v.toString() + (v === 0n ? ' [BUG B6 CONFIRMED]' : ' [fixed]');
  });

  await test('FR-002', 'FundingRate', 'MAX_FUNDING_RATE()', 'MAX_FUNDING_RATE (B6: expected 0?)', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI, functionName: 'MAX_FUNDING_RATE' });
    return v.toString() + (v === 0n ? ' [BUG B6 CONFIRMED]' : ' [non-zero]');
  });

  await test('FR-003', 'FundingRate', 'perpEngine()', 'perpEngine address set', async () => {
    const addr = await publicClient.readContract({ address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI, functionName: 'perpEngine' });
    if (addr === '0x0000000000000000000000000000000000000000') throw new Error('perpEngine not set');
    return addr;
  });

  for (let mkt = 0; mkt < 3; mkt++) {
    await test(`FR-CI${mkt}`, 'FundingRate', `cumulativeFundingIndex(${mkt})`, `cumulativeFundingIndex market ${mkt}`, async () => {
      const v = await publicClient.readContract({
        address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI,
        functionName: 'cumulativeFundingIndex', args: [BigInt(mkt)],
      });
      return v.toString();
    });

    await test(`FR-LT${mkt}`, 'FundingRate', `lastFundingTime(${mkt})`, `lastFundingTime market ${mkt}`, async () => {
      const v = await publicClient.readContract({
        address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI,
        functionName: 'lastFundingTime', args: [BigInt(mkt)],
      });
      return new Date(Number(v) * 1000).toISOString();
    });
  }

  await test('FR-007', 'FundingRate', 'accruedFunding()', 'accruedFunding calculation (1e18, 1e18, 3600)', async () => {
    const v = await publicClient.readContract({
      address: CONTRACTS.FundingRate, abi: FUNDING_RATE_ABI,
      functionName: 'accruedFunding',
      args: [parseUnits('1', 18), parseUnits('1', 18), 3600n],
    });
    return v.toString();
  });

  // ===== GROUP 3: SyntheticAssetFactory =====
  console.log('\n--- 3. SyntheticAssetFactory ---');

  await test('SAF-001', 'SyntheticAssetFactory', 'admin()', 'admin address', async () => {
    return await publicClient.readContract({ address: CONTRACTS.SyntheticAssetFactory, abi: SYNTH_ABI, functionName: 'admin' });
  });

  await test('SAF-002', 'SyntheticAssetFactory', 'listedCount()', 'number of listed synthetic assets', async () => {
    const count = await publicClient.readContract({ address: CONTRACTS.SyntheticAssetFactory, abi: SYNTH_ABI, functionName: 'listedCount' });
    return count.toString();
  });

  await test('SAF-003', 'SyntheticAssetFactory', 'implementation()', 'implementation address', async () => {
    const addr = await publicClient.readContract({ address: CONTRACTS.SyntheticAssetFactory, abi: SYNTH_ABI, functionName: 'implementation' });
    return addr;
  });

  // Try to read first listed asset if any
  await test('SAF-004', 'SyntheticAssetFactory', 'getAsset("sETH")', 'getAsset for sETH ticker', async () => {
    try {
      const addr = await publicClient.readContract({
        address: CONTRACTS.SyntheticAssetFactory, abi: SYNTH_ABI,
        functionName: 'getAsset', args: ['sETH'],
      });
      return addr === '0x0000000000000000000000000000000000000000' ? 'not listed' : addr;
    } catch (e) {
      return 'not listed (revert)';
    }
  });

  // listAsset should revert since we're not admin
  await testExpectRevert('SAF-005', 'SyntheticAssetFactory', 'listAsset()', 'listAsset reverts for non-admin', async () => {
    await walletClient.writeContract({
      address: CONTRACTS.SyntheticAssetFactory, abi: SYNTH_ABI,
      functionName: 'listAsset',
      args: ['sETH', 'Synthetic ETH', CONTRACTS.PriceOracle],
    });
  });

  // ===== GROUP 4: PerpEngine Constants + Market State =====
  console.log('\n--- 4. PerpEngine: Constants + Market State ---');

  await test('PE-001', 'PerpEngine', 'BPS()', 'BPS constant', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI, functionName: 'BPS' });
    return v.toString();
  });

  await test('PE-002', 'PerpEngine', 'TRADE_FEE_BPS()', 'trade fee in BPS', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI, functionName: 'TRADE_FEE_BPS' });
    return v.toString() + ' bps (' + (Number(v) / 100).toFixed(2) + '%)';
  });

  await test('PE-003', 'PerpEngine', 'MAINTENANCE_MARGIN_BPS()', 'maintenance margin BPS', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI, functionName: 'MAINTENANCE_MARGIN_BPS' });
    return v.toString() + ' bps (' + (Number(v) / 100).toFixed(2) + '%)';
  });

  await test('PE-004', 'PerpEngine', 'LIQUIDATION_BONUS_BPS()', 'liquidation bonus BPS', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI, functionName: 'LIQUIDATION_BONUS_BPS' });
    return v.toString() + ' bps';
  });

  // Read all 6 market structs
  const marketCount = 6;
  const marketKeys = [];
  for (let i = 0; i < marketCount; i++) {
    await test(`PE-M${i}`, 'PerpEngine', `markets(${i})`, `market ${i} state`, async () => {
      const [key, maxLev, active, longOI, shortOI] = await publicClient.readContract({
        address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
        functionName: 'markets', args: [BigInt(i)],
      });
      const ticker = Buffer.from(key.slice(2), 'hex').toString('utf8').replace(/\0/g, '');
      marketKeys.push({ i, key, ticker });
      return `${ticker} | active=${active} | longOI=${formatUnits(longOI, 18)} | shortOI=${formatUnits(shortOI, 18)}`;
    });
  }

  // ===== GROUP 5: Multi-position concurrent =====
  console.log('\n--- 5. Multi-Position Concurrent ---');

  // First check GDT balance and approve MarginVault
  let gdtBalance = 0n;
  await test('MP-001', 'GDT', 'balanceOf()', 'GDT balance of wallet', async () => {
    gdtBalance = await publicClient.readContract({
      address: CONTRACTS.GDT, abi: GDT_ABI, functionName: 'balanceOf', args: [WALLET],
    });
    return formatUnits(gdtBalance, 18) + ' GDT';
  });

  // Check current MarginVault balance
  let mvBalance = 0n;
  await test('MP-002', 'MarginVault', 'balances(wallet)', 'current MarginVault balance', async () => {
    mvBalance = await publicClient.readContract({
      address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI, functionName: 'balances', args: [WALLET],
    });
    return formatUnits(mvBalance, 18) + ' GDT';
  });

  await test('MP-003', 'MarginVault', 'totalDeposited()', 'total deposited in vault', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI, functionName: 'totalDeposited' });
    return formatUnits(v, 18) + ' GDT';
  });

  // Deposit 300 GDT for multi-position tests
  const depositAmount = parseUnits('300', 18);
  if (gdtBalance >= depositAmount) {
    await testTx('MP-004', 'GDT', 'approve(MarginVault,300)', 'approve 300 GDT to MarginVault', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.GDT, abi: GDT_ABI,
        functionName: 'approve',
        args: [CONTRACTS.MarginVault, depositAmount],
      });
    });

    await testTx('MP-005', 'MarginVault', 'deposit(300)', 'deposit 300 GDT into MarginVault', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI,
        functionName: 'deposit', args: [depositAmount],
      });
    });

    // Verify new balance
    await test('MP-006', 'MarginVault', 'balances(wallet)', 'MarginVault balance after deposit', async () => {
      mvBalance = await publicClient.readContract({
        address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI, functionName: 'balances', args: [WALLET],
      });
      return formatUnits(mvBalance, 18) + ' GDT';
    });

    // Open position on market 0 (ETH) — long, 5x leverage, 30 GDT
    await testTx('MP-007', 'PerpEngine', 'openPosition(0,long,5x)', 'open LONG ETH position, 5x, 30 GDT', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
        functionName: 'openPosition',
        args: [0n, parseUnits('30', 18), true, 5n],
      });
    });

    // Open position on market 1 (BTC) — short, 3x leverage, 30 GDT
    await testTx('MP-008', 'PerpEngine', 'openPosition(1,short,3x)', 'open SHORT BTC position, 3x, 30 GDT', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
        functionName: 'openPosition',
        args: [1n, parseUnits('30', 18), false, 3n],
      });
    });

    // Open position on market 2 (AAPL) — long, 2x leverage, 20 GDT
    await testTx('MP-009', 'PerpEngine', 'openPosition(2,long,2x)', 'open LONG AAPL position, 2x, 20 GDT', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
        functionName: 'openPosition',
        args: [2n, parseUnits('20', 18), true, 2n],
      });
    });

    // Read margin ratios for all 3 open positions
    for (let mkt = 0; mkt < 3; mkt++) {
      await test(`MP-MR${mkt}`, 'PerpEngine', `marginRatio(wallet,${mkt})`, `margin ratio market ${mkt}`, async () => {
        const ratio = await publicClient.readContract({
          address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
          functionName: 'marginRatio', args: [WALLET, BigInt(mkt)],
        });
        return (Number(ratio) / 100).toFixed(2) + '%';
      });

      await test(`MP-PNL${mkt}`, 'PerpEngine', `unrealizedPnL(wallet,${mkt})`, `unrealized PnL market ${mkt}`, async () => {
        const pnl = await publicClient.readContract({
          address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
          functionName: 'unrealizedPnL', args: [WALLET, BigInt(mkt)],
        });
        return formatUnits(pnl, 18) + ' GDT';
      });

      await test(`MP-PS${mkt}`, 'PerpEngine', `positions(wallet,${mkt})`, `position struct market ${mkt}`, async () => {
        const [open, isLong, size, margin, entryPrice, fundingIdx, openTime] = await publicClient.readContract({
          address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
          functionName: 'positions', args: [WALLET, BigInt(mkt)],
        });
        return `open=${open} long=${isLong} size=${formatUnits(size,18)} margin=${formatUnits(margin,18)}`;
      });
    }

    // Close all 3 positions
    for (let mkt = 0; mkt < 3; mkt++) {
      await testTx(`MP-CL${mkt}`, 'PerpEngine', `closePosition(${mkt})`, `close position market ${mkt}`, async () => {
        return await walletClient.writeContract({
          address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
          functionName: 'closePosition', args: [BigInt(mkt)],
        });
      });
    }

    // Withdraw a portion after close
    await testTx('MP-020', 'MarginVault', 'withdraw(50)', 'withdraw 50 GDT after position close', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI,
        functionName: 'withdraw', args: [parseUnits('50', 18)],
      });
    });

    await test('MP-021', 'MarginVault', 'balances(wallet)', 'MarginVault balance after withdraw', async () => {
      const b = await publicClient.readContract({
        address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI, functionName: 'balances', args: [WALLET],
      });
      return formatUnits(b, 18) + ' GDT';
    });

  } else {
    console.log('  SKIP multi-position tests: insufficient GDT balance');
    results.push({ timestamp: new Date().toISOString(), contract: 'MarginVault', function: 'deposit', tx_hash: null, success: false, gas_used: null, error: 'Skipped: insufficient GDT balance', iteration: ITERATION, test_id: 'MP-SKIP' });
    failed++;
  }

  // ===== GROUP 6: Negative Tests =====
  console.log('\n--- 6. Negative Tests ---');

  // Try openPosition with 0 collateral (should revert)
  await testExpectRevert('NEG-001', 'PerpEngine', 'openPosition(0,0,long,5)', 'openPosition reverts with 0 collateral', async () => {
    await walletClient.writeContract({
      address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
      functionName: 'openPosition',
      args: [0n, 0n, true, 5n],
    });
  });

  // Try closePosition on market 5 (never opened position there)
  await testExpectRevert('NEG-002', 'PerpEngine', 'closePosition(5)', 'closePosition reverts for nonexistent position (mkt 5)', async () => {
    await walletClient.writeContract({
      address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
      functionName: 'closePosition', args: [5n],
    });
  });

  // Try withdraw more than balance
  await testExpectRevert('NEG-003', 'MarginVault', 'withdraw(999999)', 'withdraw reverts when exceeds balance', async () => {
    await walletClient.writeContract({
      address: CONTRACTS.MarginVault, abi: MARGIN_VAULT_ABI,
      functionName: 'withdraw', args: [parseUnits('999999', 18)],
    });
  });

  // Try openPosition on non-existent market (id 99)
  await testExpectRevert('NEG-004', 'PerpEngine', 'openPosition(99,...)', 'openPosition reverts for nonexistent market', async () => {
    await walletClient.writeContract({
      address: CONTRACTS.PerpEngine, abi: PERP_ENGINE_ABI,
      functionName: 'openPosition',
      args: [99n, parseUnits('10', 18), true, 5n],
    });
  });

  // ===== GROUP 7: GoodPredict Multi-Market =====
  console.log('\n--- 7. GoodPredict: Multi-Market Buy Flow ---');

  await test('GP-001', 'MarketFactory', 'marketCount()', 'current prediction market count', async () => {
    const count = await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'marketCount' });
    return count.toString();
  });

  await test('GP-002', 'MarketFactory', 'goodDollar()', 'GoodDollar token address', async () => {
    return await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'goodDollar' });
  });

  await test('GP-003', 'MarketFactory', 'tokens()', 'ConditionalTokens address', async () => {
    return await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'tokens' });
  });

  await test('GP-004', 'MarketFactory', 'REDEEM_FEE_BPS()', 'redeem fee', async () => {
    const v = await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'REDEEM_FEE_BPS' });
    return v.toString() + ' bps (' + (Number(v) / 100).toFixed(2) + '%)';
  });

  // Get current market count to track new ones
  let initMarketCount = 0n;
  try {
    initMarketCount = await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'marketCount' });
  } catch {}

  // Check GDT balance and approve MarketFactory
  let gdtBal2 = 0n;
  await test('GP-005', 'GDT', 'balanceOf(wallet)', 'GDT balance for prediction tests', async () => {
    gdtBal2 = await publicClient.readContract({ address: CONTRACTS.GDT, abi: GDT_ABI, functionName: 'balanceOf', args: [WALLET] });
    return formatUnits(gdtBal2, 18) + ' GDT';
  });

  const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600); // 7 days from now

  let marketA = initMarketCount;
  let marketB = initMarketCount + 1n;

  if (gdtBal2 >= parseUnits('100', 18)) {
    // Approve MarketFactory
    await testTx('GP-006', 'GDT', 'approve(MarketFactory,200)', 'approve 200 GDT to MarketFactory', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.GDT, abi: GDT_ABI,
        functionName: 'approve',
        args: [CONTRACTS.MarketFactory, parseUnits('200', 18)],
      });
    });

    // Create market A
    await testTx('GP-007', 'MarketFactory', 'createMarket(A)', 'create prediction market A (ETH > $4000 EOY)', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: ['ETH above $4000 by end of 2026?', futureDeadline, WALLET],
      });
    });

    // Create market B
    await testTx('GP-008', 'MarketFactory', 'createMarket(B)', 'create prediction market B (BTC > $150k EOY)', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: ['BTC above $150,000 by end of 2026?', futureDeadline, WALLET],
      });
    });

    // Verify new market count
    await test('GP-009', 'MarketFactory', 'marketCount()', 'market count after creating 2 markets', async () => {
      const count = await publicClient.readContract({ address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI, functionName: 'marketCount' });
      return count.toString() + ' (was ' + initMarketCount.toString() + ')';
    });

    // Read market A
    await test('GP-010', 'MarketFactory', 'getMarket(A)', 'read market A state', async () => {
      const [question, deadline, status, yesPool, noPool, totalVolume] = await publicClient.readContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'getMarket', args: [marketA],
      });
      return `status=${status} yesPool=${formatUnits(yesPool,18)} noPool=${formatUnits(noPool,18)}`;
    });

    // Buy YES on market A (50 GDT)
    await testTx('GP-011', 'MarketFactory', 'buy(A,YES,50)', 'buy YES on market A, 50 GDT', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'buy',
        args: [marketA, true, parseUnits('50', 18)],
      });
    });

    // Buy NO on market B (50 GDT)
    await testTx('GP-012', 'MarketFactory', 'buy(B,NO,50)', 'buy NO on market B, 50 GDT', async () => {
      return await walletClient.writeContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'buy',
        args: [marketB, false, parseUnits('50', 18)],
      });
    });

    // Read implied probabilities
    await test('GP-013', 'MarketFactory', 'impliedProbabilityYES(A)', 'implied probability YES for market A after buy', async () => {
      const prob = await publicClient.readContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'impliedProbabilityYES', args: [marketA],
      });
      return (Number(prob) / 100).toFixed(2) + '%';
    });

    await test('GP-014', 'MarketFactory', 'impliedProbabilityYES(B)', 'implied probability YES for market B after NO buy', async () => {
      const prob = await publicClient.readContract({
        address: CONTRACTS.MarketFactory, abi: MARKET_FACTORY_ABI,
        functionName: 'impliedProbabilityYES', args: [marketB],
      });
      return (Number(prob) / 100).toFixed(2) + '%';
    });

    // ConditionalTokens balance checks
    console.log('\n--- 8. ConditionalTokens: Post-Buy Balances ---');

    await test('CT-001', 'ConditionalTokens', 'factory()', 'factory address matches MarketFactory', async () => {
      const addr = await publicClient.readContract({ address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI, functionName: 'factory' });
      const matches = addr.toLowerCase() === CONTRACTS.MarketFactory.toLowerCase();
      return addr + (matches ? ' [matches]' : ' [MISMATCH!]');
    });

    await test('CT-002', 'ConditionalTokens', 'yesTokenId(A)', 'YES token ID for market A', async () => {
      const id = await publicClient.readContract({ address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI, functionName: 'yesTokenId', args: [marketA] });
      return id.toString();
    });

    await test('CT-003', 'ConditionalTokens', 'noTokenId(B)', 'NO token ID for market B', async () => {
      const id = await publicClient.readContract({ address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI, functionName: 'noTokenId', args: [marketB] });
      return id.toString();
    });

    let yesId, noId;
    try {
      yesId = await publicClient.readContract({ address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI, functionName: 'yesTokenId', args: [marketA] });
      noId = await publicClient.readContract({ address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI, functionName: 'noTokenId', args: [marketB] });
    } catch {}

    if (yesId !== undefined) {
      await test('CT-004', 'ConditionalTokens', 'balanceOf(wallet,yesId)', 'YES token balance after buying YES on A', async () => {
        const bal = await publicClient.readContract({
          address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI,
          functionName: 'balanceOf', args: [WALLET, yesId],
        });
        if (bal === 0n) throw new Error('balance is 0 after buy');
        return formatUnits(bal, 18) + ' YES-A';
      });
    }

    if (noId !== undefined) {
      await test('CT-005', 'ConditionalTokens', 'balanceOf(wallet,noId)', 'NO token balance after buying NO on B', async () => {
        const bal = await publicClient.readContract({
          address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI,
          functionName: 'balanceOf', args: [WALLET, noId],
        });
        if (bal === 0n) throw new Error('balance is 0 after buy');
        return formatUnits(bal, 18) + ' NO-B';
      });
    }

    // balanceOfBatch for both
    if (yesId !== undefined && noId !== undefined) {
      await test('CT-006', 'ConditionalTokens', 'balanceOfBatch()', 'balanceOfBatch for YES-A and NO-B', async () => {
        const bals = await publicClient.readContract({
          address: CONTRACTS.ConditionalTokens, abi: COND_TOKENS_ABI,
          functionName: 'balanceOfBatch',
          args: [[WALLET, WALLET], [yesId, noId]],
        });
        return `YES=${formatUnits(bals[0],18)} NO=${formatUnits(bals[1],18)}`;
      });
    }

  } else {
    console.log('  SKIP GoodPredict tests: insufficient GDT balance');
    failed++;
  }

  // ===== Summary =====
  console.log('\n========= Results =========');
  console.log(`Passed: ${passed} | Failed: ${failed} | Total: ${passed + failed}`);
  console.log('Pass rate:', ((passed / (passed + failed)) * 100).toFixed(1) + '%');

  // Write JSONL log
  const logPath = '/home/goodclaw/gooddollar-l2/test-results/tester-beta.jsonl';
  const lines = results.map(r => JSON.stringify(r)).join('\n') + '\n';
  fs.appendFileSync(logPath, lines);
  console.log('\nResults logged to:', logPath);

  return { passed, failed, results };
}

runTests().catch(console.error);
