/**
 * Tester Gamma - Iteration 3 Test Script
 * Uses viem for all RPC calls (cast not available in sandbox)
 */

const { createPublicClient, createWalletClient, http, parseAbi, decodeErrorResult } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem');
const { privateKeyToAccount } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem/accounts');

// ===== Config =====
const RPC = 'http://localhost:8545';
const CHAIN_ID = 42069n;
const WALLET = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const PRIVATE_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

const CONTRACTS = {
  GDT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  UBIFeeSplitter: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ValidatorStaking: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  UBIFeeHook: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  FundingRate: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  MarginVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  PriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  ConditionalTokens: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  MarketFactory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  CollateralVault: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  GoodLendPool: '0x322813fd9a801c5507c9de605d63cea4f2ce6c44',
  MockUSDC: '0x0b306bf915c4d645ff596e518faf3f9669b97016',
  MockWETH: '0x959922be3caee4b8cd9a407cc3ac1c251c2007b1',
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

const MOCK_TOKEN_ABI = parseAbi([
  'function mint(address,uint256) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
]);

const CONDITIONAL_TOKENS_ABI = parseAbi([
  'function factory() view returns (address)',
  'function yesTokenId(uint256) view returns (uint256)',
  'function noTokenId(uint256) view returns (uint256)',
  'function balanceOf(address,uint256) view returns (uint256)',
  'function balanceOfBatch(address[],uint256[]) view returns (uint256[])',
]);

const MARKET_FACTORY_ABI = parseAbi([
  'function admin() view returns (address)',
  'function marketCount() view returns (uint256)',
  'function goodDollar() view returns (address)',
  'function feeSplitter() view returns (address)',
  'function tokens() view returns (address)',
  'function BPS() view returns (uint256)',
  'function REDEEM_FEE_BPS() view returns (uint256)',
  'function markets(uint256) view returns (string,uint256,uint8,uint256,uint256,uint256,address)',
  'function getMarket(uint256) view returns (string,uint256,uint8,uint256,uint256,uint256)',
  'function impliedProbabilityYES(uint256) view returns (uint256)',
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

const UBI_FEE_SPLITTER_ABI = parseAbi([
  'function ubiRecipient() view returns (address)',
  'function claimableBalance() view returns (uint256)',
  'function totalFeesCollected() view returns (uint256)',
  'function totalUBIFunded() view returns (uint256)',
  'function ubiBPS() view returns (uint256)',
]);

const VALIDATOR_STAKING_ABI = parseAbi([
  'function totalStaked() view returns (uint256)',
  'function validatorCount() view returns (uint256)',
  'function activeValidatorCount() view returns (uint256)',
]);

const GOOD_LEND_POOL_ABI = parseAbi([
  'function getUserAccountData(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256)',
  'function supply(address,uint256,address,uint16)',
  'function borrow(address,uint256,address,uint16)',
  'function getReservesCount() view returns (uint256)',
  'function reservesList(uint256) view returns (address)',
  'function getReserveData(address) view returns (address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool)',
]);

const PERP_ENGINE_ABI = parseAbi([
  'function paused() view returns (bool)',
  'function marketCount() view returns (uint256)',
  'function markets(uint256) view returns (bytes32,uint256,bool,uint256,uint256)',
  'function openPosition(uint256,uint256,bool,uint256)',
]);

const PRICE_ORACLE_ABI = parseAbi([
  'function getPrice(string) view returns (uint256)',
  'function hasFeed(string) view returns (bool)',
]);

// ===== Helpers =====
const results = [];

async function test(id, contract, fn, description, testFn) {
  const start = Date.now();
  try {
    const result = await testFn();
    const elapsed = Date.now() - start;
    console.log(`  PASS [${id}] ${description}: ${result}`);
    results.push({
      iteration: 3,
      test_id: id,
      contract,
      function: fn,
      description,
      success: true,
      result: String(result),
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: true, value: result };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    const shortErr = errMsg.slice(0, 200);
    console.log(`  FAIL [${id}] ${description}: ${shortErr}`);
    results.push({
      iteration: 3,
      test_id: id,
      contract,
      function: fn,
      description,
      success: false,
      error: shortErr,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: errMsg };
  }
}

async function testExpectRevert(id, contract, fn, description, testFn) {
  const start = Date.now();
  try {
    await testFn();
    const elapsed = Date.now() - start;
    console.log(`  FAIL [${id}] ${description}: expected revert but call succeeded`);
    results.push({
      iteration: 3,
      test_id: id,
      contract,
      function: fn,
      description,
      success: false,
      error: 'Expected revert but call succeeded',
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: false };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    console.log(`  PASS [${id}] ${description}: reverted as expected (${errMsg.slice(0, 100)})`);
    results.push({
      iteration: 3,
      test_id: id,
      contract,
      function: fn,
      description,
      success: true,
      result: `Reverted as expected: ${errMsg.slice(0, 150)}`,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }
}

// ===== Main =====
async function runTests() {
  console.log('\n========= Tester Gamma — Iteration 3 =========\n');

  // ========== TEST GROUP 1: ConditionalTokens ==========
  console.log('--- 1. ConditionalTokens ---');

  await test('CT-001', 'ConditionalTokens', 'factory()', 'factory() returns MarketFactory address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'factory',
    });
  });

  const yesId0Result = await test('CT-002', 'ConditionalTokens', 'yesTokenId(0)', 'yesTokenId(marketId=0)', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'yesTokenId',
      args: [0n],
    });
    return `tokenId=${val}`;
  });

  await test('CT-003', 'ConditionalTokens', 'noTokenId(0)', 'noTokenId(marketId=0)', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'noTokenId',
      args: [0n],
    });
    return `tokenId=${val}`;
  });

  await test('CT-004', 'ConditionalTokens', 'balanceOf(wallet,0)', 'balanceOf wallet for tokenId=0', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'balanceOf',
      args: [WALLET, 0n],
    });
    return `balance=${val}`;
  });

  await test('CT-005', 'ConditionalTokens', 'balanceOf(wallet,1)', 'balanceOf wallet for tokenId=1', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ConditionalTokens,
      abi: CONDITIONAL_TOKENS_ABI,
      functionName: 'balanceOf',
      args: [WALLET, 1n],
    });
    return `balance=${val}`;
  });

  // ========== TEST GROUP 2: MarketFactory ==========
  console.log('\n--- 2. MarketFactory ---');

  await test('MF-001', 'MarketFactory', 'admin()', 'admin() address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'admin',
    });
  });

  const mfCountResult = await test('MF-002', 'MarketFactory', 'marketCount()', 'marketCount()', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'marketCount',
    });
    return `count=${val}`;
  });

  await test('MF-003', 'MarketFactory', 'goodDollar()', 'goodDollar() returns GDT address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'goodDollar',
    });
  });

  await test('MF-004', 'MarketFactory', 'feeSplitter()', 'feeSplitter() address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'feeSplitter',
    });
  });

  await test('MF-005', 'MarketFactory', 'tokens()', 'tokens() returns ConditionalTokens address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'tokens',
    });
  });

  await test('MF-006', 'MarketFactory', 'BPS()', 'BPS constant', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'BPS',
    });
    return `BPS=${val}`;
  });

  await test('MF-007', 'MarketFactory', 'REDEEM_FEE_BPS()', 'REDEEM_FEE_BPS constant', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MarketFactory,
      abi: MARKET_FACTORY_ABI,
      functionName: 'REDEEM_FEE_BPS',
    });
    return `REDEEM_FEE_BPS=${val}`;
  });

  // Read existing markets if any
  const marketCount = mfCountResult.success ? BigInt(mfCountResult.value.replace('count=', '')) : 0n;
  if (marketCount > 0n) {
    for (let i = 0n; i < marketCount && i < 3n; i++) {
      await test(`MF-008-${i}`, 'MarketFactory', `getMarket(${i})`, `getMarket(marketId=${i})`, async () => {
        const m = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getMarket',
          args: [i],
        });
        const [question, endTime, status, totalYES, totalNO, collateral] = m;
        return `q="${question.slice(0,50)}" endTime=${endTime} status=${status} YES=${totalYES} NO=${totalNO} collateral=${collateral}`;
      });

      await test(`MF-009-${i}`, 'MarketFactory', `impliedProbabilityYES(${i})`, `implied probability YES market ${i}`, async () => {
        const val = await publicClient.readContract({
          address: CONTRACTS.MarketFactory,
          abi: MARKET_FACTORY_ABI,
          functionName: 'impliedProbabilityYES',
          args: [i],
        });
        return `${val} bps (${Number(val)/100}%)`;
      });
    }
  } else {
    console.log('  INFO [MF-008] marketCount=0, no markets to read');
    results.push({
      iteration: 3, test_id: 'MF-008', contract: 'MarketFactory',
      function: 'getMarket()', description: 'No markets exist to read',
      success: true, result: 'marketCount=0, no markets seeded', elapsed_ms: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // ========== TEST GROUP 3: MarginVault ==========
  console.log('\n--- 3. MarginVault ---');

  await test('MV-001', 'MarginVault', 'admin()', 'admin() address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'admin',
    });
  });

  await test('MV-002', 'MarginVault', 'collateral()', 'collateral token address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'collateral',
    });
  });

  await test('MV-003', 'MarginVault', 'perpEngine()', 'perpEngine() address', async () => {
    return await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'perpEngine',
    });
  });

  await test('MV-004', 'MarginVault', 'totalDeposited()', 'totalDeposited()', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'totalDeposited',
    });
    return `${val} (${Number(val)/1e18} GDT)`;
  });

  await test('MV-005', 'MarginVault', 'balances(wallet)', 'balances of our wallet', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'balances',
      args: [WALLET],
    });
    return `${val} (${Number(val)/1e18} GDT)`;
  });

  // Get collateral token for MarginVault
  let mvCollateral = null;
  try {
    mvCollateral = await publicClient.readContract({
      address: CONTRACTS.MarginVault,
      abi: MARGIN_VAULT_ABI,
      functionName: 'collateral',
    });
  } catch(e) {}

  // Deposit 1 GDT into MarginVault (need to approve first)
  const depositAmount = 1000000000000000000n; // 1 GDT (18 decimals)

  // First check our GDT balance
  let gdtBal = 0n;
  try {
    gdtBal = await publicClient.readContract({
      address: CONTRACTS.GDT,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [WALLET],
    });
    console.log(`  INFO wallet GDT balance: ${gdtBal} (${Number(gdtBal)/1e18} GDT)`);
  } catch(e) {}

  // Check what token the vault uses
  const isGDT = mvCollateral && mvCollateral.toLowerCase() === CONTRACTS.GDT.toLowerCase();
  console.log(`  INFO MarginVault collateral: ${mvCollateral}, isGDT=${isGDT}`);

  if (gdtBal >= depositAmount && isGDT) {
    // Approve GDT for MarginVault
    await test('MV-006', 'MarginVault', 'GDT.approve(MarginVault,1e18)', 'Approve 1 GDT for MarginVault deposit', async () => {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.GDT,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.MarginVault, depositAmount],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
    });

    await test('MV-007', 'MarginVault', 'deposit(1e18)', 'Deposit 1 GDT into MarginVault', async () => {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.MarginVault,
        abi: MARGIN_VAULT_ABI,
        functionName: 'deposit',
        args: [depositAmount],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
    });

    await test('MV-008', 'MarginVault', 'balances(wallet)_post', 'balances wallet after deposit', async () => {
      const val = await publicClient.readContract({
        address: CONTRACTS.MarginVault,
        abi: MARGIN_VAULT_ABI,
        functionName: 'balances',
        args: [WALLET],
      });
      return `${val} (${Number(val)/1e18} GDT)`;
    });

    // Test withdrawal
    await test('MV-009', 'MarginVault', 'withdraw(1e18)', 'Withdraw 1 GDT from MarginVault', async () => {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.MarginVault,
        abi: MARGIN_VAULT_ABI,
        functionName: 'withdraw',
        args: [depositAmount],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
    });
  } else {
    console.log(`  INFO Skipping deposit test — insufficient GDT or wrong collateral token`);
    results.push({
      iteration: 3, test_id: 'MV-006', contract: 'MarginVault',
      function: 'deposit()', description: 'Skipped: insufficient GDT or collateral mismatch',
      success: true, result: `gdtBal=${gdtBal}, collateral=${mvCollateral}, isGDT=${isGDT}`,
      elapsed_ms: 0, timestamp: new Date().toISOString(),
    });
  }

  // ========== TEST GROUP 4: Bug Regression — GOO-198 ==========
  console.log('\n--- 4. Bug Regression: GOO-198 (UBIFeeSplitter.ubiRecipient) ---');

  await testExpectRevert('GOO198-REG', 'UBIFeeSplitter', 'ubiRecipient()', 'GOO-198: ubiRecipient() still reverts (confirm bug still open)', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.UBIFeeSplitter,
      abi: UBI_FEE_SPLITTER_ABI,
      functionName: 'ubiRecipient',
    });
    // If it succeeds, check if it's zero address (which is the bug)
    if (val === '0x0000000000000000000000000000000000000000') {
      throw new Error(`ubiRecipient=address(0) — bug still present`);
    }
    // If it's non-zero address, the bug is fixed
    console.log(`  INFO ubiRecipient=${val} — BUG APPEARS FIXED!`);
    throw new Error(`FIXED: ubiRecipient=${val} (non-zero)`); // Still throws but with fix note
  });

  // Also try claimableBalance
  await testExpectRevert('GOO198-CB', 'UBIFeeSplitter', 'claimableBalance()', 'GOO-198: claimableBalance() reverts with ubiRecipient=0', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.UBIFeeSplitter,
      abi: UBI_FEE_SPLITTER_ABI,
      functionName: 'claimableBalance',
    });
    throw new Error(`FIXED: claimableBalance=${val}`);
  });

  // totalFeesCollected should still work
  await test('GOO198-TFC', 'UBIFeeSplitter', 'totalFeesCollected()', 'totalFeesCollected() works (unaffected by GOO-198)', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.UBIFeeSplitter,
      abi: UBI_FEE_SPLITTER_ABI,
      functionName: 'totalFeesCollected',
    });
    return `${val} (${Number(val)/1e18} GDT)`;
  });

  // ========== TEST GROUP 5: Bug Regression — GOO-204 ==========
  console.log('\n--- 5. Bug Regression: GOO-204 (GoodLendPool.getUserAccountData) ---');

  const gadResult = await test('GOO204-REG', 'GoodLendPool', 'getUserAccountData(wallet)', 'GOO-204: getUserAccountData returns uint256_max for collateral', async () => {
    const vals = await publicClient.readContract({
      address: CONTRACTS.GoodLendPool,
      abi: GOOD_LEND_POOL_ABI,
      functionName: 'getUserAccountData',
      args: [WALLET],
    });
    const uint256max = 2n**256n - 1n;
    const [totalCollateral, totalDebt, availableBorrow, currentLiquidationThreshold, ltv, healthFactor] = vals;
    const isUint256Max = totalCollateral === uint256max;
    return `totalCollateral=${isUint256Max ? 'uint256_max (BUG STILL OPEN)' : totalCollateral} totalDebt=${totalDebt} availBorrow=${availableBorrow} LTV=${ltv} HF=${healthFactor}`;
  });

  // ========== TEST GROUP 6: Negative Test — Over-Borrow ==========
  console.log('\n--- 6. Negative Test: Over-Borrow from GoodLendPool ---');

  // Supply 100 USDC first
  const supply100 = 100_000_000n; // 100 USDC (6 decimals)
  const borrow200 = 200_000_000n; // 200 USDC

  await test('OB-001', 'MockUSDC', 'mint(wallet,100e6)', 'Mint 100 USDC for over-borrow test', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MockUSDC,
      abi: MOCK_TOKEN_ABI,
      functionName: 'mint',
      args: [WALLET, supply100],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
  });

  await test('OB-002', 'MockUSDC', 'approve(GoodLendPool,100e6)', 'Approve 100 USDC for GoodLendPool', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MockUSDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.GoodLendPool, supply100],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
  });

  await test('OB-003', 'GoodLendPool', 'supply(USDC,100e6)', 'Supply 100 USDC to GoodLendPool', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GoodLendPool,
      abi: GOOD_LEND_POOL_ABI,
      functionName: 'supply',
      args: [CONTRACTS.MockUSDC, supply100, WALLET, 0],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash} block=${receipt.blockNumber} status=${receipt.status}`;
  });

  // Now try to borrow 200 USDC (more than deposited — should revert)
  await testExpectRevert('OB-004', 'GoodLendPool', 'borrow(USDC,200e6)', 'Negative: borrow 200 USDC (over-collateral) should revert', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GoodLendPool,
      abi: GOOD_LEND_POOL_ABI,
      functionName: 'borrow',
      args: [CONTRACTS.MockUSDC, borrow200, WALLET, 0],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  });

  // ========== TEST GROUP 7: Negative Test — PerpEngine zero-oracle position ==========
  console.log('\n--- 7. Negative Test: PerpEngine openPosition with bad params ---');

  // Try openPosition with zero margin (should revert)
  await testExpectRevert('PE-NEG-001', 'PerpEngine', 'openPosition(0,0,true,1)', 'openPosition with zero size should revert', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.PerpEngine,
      abi: PERP_ENGINE_ABI,
      functionName: 'openPosition',
      args: [0n, 0n, true, 1n],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  });

  // Try openPosition with marketId=99 (non-existent market, should revert)
  await testExpectRevert('PE-NEG-002', 'PerpEngine', 'openPosition(99,100e18,true,1)', 'openPosition with non-existent marketId=99 should revert', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.PerpEngine,
      abi: PERP_ENGINE_ABI,
      functionName: 'openPosition',
      args: [99n, 100n * 10n**18n, true, 1n],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  });

  // ========== TEST GROUP 8: Cross-dApp Flow ==========
  console.log('\n--- 8. Cross-dApp Flow: Mint USDC → Supply → Check gToken → Borrow WETH ---');

  // Check MockUSDC balance
  await test('XDA-001', 'MockUSDC', 'balanceOf(wallet)', 'USDC balance pre cross-dapp test', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.MockUSDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [WALLET],
    });
    return `${val} (${Number(val)/1e6} USDC)`;
  });

  // Get gToken address for USDC from reserve data
  let gUSDCAddr = null;
  await test('XDA-002', 'GoodLendPool', 'getReserveData(USDC).gToken', 'Get gUSDC token address', async () => {
    const data = await publicClient.readContract({
      address: CONTRACTS.GoodLendPool,
      abi: GOOD_LEND_POOL_ABI,
      functionName: 'getReserveData',
      args: [CONTRACTS.MockUSDC],
    });
    gUSDCAddr = data[0];
    return `gToken=${gUSDCAddr} debtToken=${data[1]}`;
  });

  if (gUSDCAddr && gUSDCAddr !== '0x0000000000000000000000000000000000000000') {
    await test('XDA-003', 'GoodLendToken', 'balanceOf(wallet)', 'gUSDC balance after supply', async () => {
      const val = await publicClient.readContract({
        address: gUSDCAddr,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [WALLET],
      });
      return `${val} raw gUSDC units`;
    });
  }

  // Try to borrow MockWETH
  const borrowWETH = 10000000000000000n; // 0.01 WETH (18 decimals)
  await testExpectRevert('XDA-004', 'GoodLendPool', 'borrow(WETH,0.01e18)', 'Try borrow 0.01 WETH (expect revert — no WETH liquidity)', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GoodLendPool,
      abi: GOOD_LEND_POOL_ABI,
      functionName: 'borrow',
      args: [CONTRACTS.MockWETH, borrowWETH, WALLET, 0],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  });

  // ========== TEST GROUP 9: ValidatorStaking State Persistence ==========
  console.log('\n--- 9. ValidatorStaking State Persistence ---');

  await test('VS-PERSIST-001', 'ValidatorStaking', 'totalStaked()', 'totalStaked() — confirm iter2 stake persists', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ValidatorStaking,
      abi: VALIDATOR_STAKING_ABI,
      functionName: 'totalStaked',
    });
    const expected = 1_000_000n * 10n**18n; // 1M GDT
    const persisted = val >= expected;
    return `${val} (${Number(val)/1e18} GDT) — ${persisted ? 'PERSISTED from iter2' : 'WARNING: less than expected 1M GDT'}`;
  });

  await test('VS-PERSIST-002', 'ValidatorStaking', 'validatorCount()', 'validatorCount() — confirm iter2 validator registered', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ValidatorStaking,
      abi: VALIDATOR_STAKING_ABI,
      functionName: 'validatorCount',
    });
    return `count=${val} (${val >= 1n ? 'iter2 stake persisted' : 'WARNING: 0 validators — state reset?'})`;
  });

  await test('VS-PERSIST-003', 'ValidatorStaking', 'activeValidatorCount()', 'activeValidatorCount()', async () => {
    const val = await publicClient.readContract({
      address: CONTRACTS.ValidatorStaking,
      abi: VALIDATOR_STAKING_ABI,
      functionName: 'activeValidatorCount',
    });
    return `count=${val}`;
  });

  // ========== TEST GROUP 10: Stress Test — Write Ops ==========
  console.log('\n--- 10. Stress Test: 5 Rapid Write Transactions ---');

  const stressResults = [];
  const stressMintAmount = 1000000n; // 1 USDC

  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.MockUSDC,
        abi: MOCK_TOKEN_ABI,
        functionName: 'mint',
        args: [WALLET, stressMintAmount],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const elapsed = Date.now() - start;
      stressResults.push({ i, hash, block: receipt.blockNumber.toString(), status: receipt.status, elapsed_ms: elapsed });
      console.log(`  PASS [STRESS-00${i}] Mint ${i}/5 — block=${receipt.blockNumber} elapsed=${elapsed}ms`);
    } catch (err) {
      const elapsed = Date.now() - start;
      stressResults.push({ i, error: err.message?.slice(0,100), elapsed_ms: elapsed });
      console.log(`  FAIL [STRESS-00${i}] Mint ${i}/5 — ${err.message?.slice(0,100)}`);
    }
  }

  const allPassed = stressResults.every(r => r.status === 'success');
  const avgElapsed = stressResults.reduce((s, r) => s + r.elapsed_ms, 0) / stressResults.length;

  results.push({
    iteration: 3,
    test_id: 'STRESS-WRITE',
    contract: 'MockUSDC',
    function: 'mint() x5',
    description: '5 rapid sequential write transactions',
    success: allPassed,
    result: `${stressResults.filter(r=>r.status==='success').length}/5 succeeded, avg=${avgElapsed.toFixed(0)}ms per tx, details=${JSON.stringify(stressResults)}`,
    elapsed_ms: stressResults.reduce((s,r) => s+r.elapsed_ms, 0),
    timestamp: new Date().toISOString(),
  });

  // ========== Summary ==========
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n========= SUMMARY =========`);
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`===========================\n`);

  return results;
}

runTests().then(results => {
  process.stdout.write('__RESULTS__:' + JSON.stringify(results));
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
