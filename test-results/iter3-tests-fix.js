/**
 * Tester Gamma - Iteration 3 Supplemental Tests (Corrected ABIs)
 */

const { createPublicClient, createWalletClient, http, parseAbi } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem');
const { privateKeyToAccount } = require('/home/goodclaw/gooddollar-l2/frontend/node_modules/viem/accounts');

const RPC = 'http://localhost:8545';
const WALLET = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const PRIVATE_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

const CONTRACTS = {
  GDT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  GoodLendPool: '0x322813fd9a801c5507c9de605d63cea4f2ce6c44',
  MockUSDC: '0x0b306bf915c4d645ff596e518faf3f9669b97016',
  MockWETH: '0x959922be3caee4b8cd9a407cc3ac1c251c2007b1',
  MarketFactory: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  ConditionalTokens: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
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

// CORRECTED ABIs based on source code
const GLP_ABI_CORRECT = parseAbi([
  'function getUserAccountData(address) view returns (uint256 healthFactor, uint256 totalCollateralUSD, uint256 totalDebtUSD)',
  'function supply(address,uint256)',
  'function borrow(address,uint256)',
  'function getReserveData(address) view returns (uint256 totalDeposits, uint256 totalBorrows, uint256 liquidityIndex, uint256 borrowIndex, uint256 supplyRate, uint256 borrowRate, uint256 accruedToTreasury)',
  'function getReservesCount() view returns (uint256)',
  'function reservesList(uint256) view returns (address)',
]);

const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function mint(address,uint256) returns (bool)',
]);

const results = [];

async function test(id, contract, fn, description, testFn) {
  const start = Date.now();
  try {
    const result = await testFn();
    const elapsed = Date.now() - start;
    console.log(`  PASS [${id}] ${description}: ${result}`);
    results.push({
      iteration: 3,
      test_id: id + '_FIX',
      contract,
      function: fn,
      description: description + ' [corrected ABI]',
      success: true,
      result: String(result),
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: true, value: result };
  } catch (err) {
    const elapsed = Date.now() - start;
    const errMsg = err.message || String(err);
    const shortErr = errMsg.slice(0, 300);
    console.log(`  FAIL [${id}] ${description}: ${shortErr}`);
    results.push({
      iteration: 3,
      test_id: id + '_FIX',
      contract,
      function: fn,
      description: description + ' [corrected ABI]',
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
    const result = await testFn();
    const elapsed = Date.now() - start;
    console.log(`  FAIL [${id}] ${description}: expected revert but call SUCCEEDED (result=${result})`);
    results.push({
      iteration: 3,
      test_id: id + '_FIX',
      contract,
      function: fn,
      description: description + ' [corrected ABI]',
      success: false,
      error: `Expected revert but call succeeded: ${result}`,
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
      test_id: id + '_FIX',
      contract,
      function: fn,
      description: description + ' [corrected ABI]',
      success: true,
      result: `Reverted as expected: ${errMsg.slice(0, 150)}`,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }
}

async function runTests() {
  console.log('\n=== Iteration 3 Supplemental (Corrected ABI Tests) ===\n');

  // ---- GOO-204 regression with correct ABI ----
  console.log('--- GOO-204 Regression (Corrected: 3 return values) ---');

  await test('GOO204-v2', 'GoodLendPool', 'getUserAccountData(wallet)', 'GOO-204 correct ABI: returns (healthFactor, collateralUSD, debtUSD)', async () => {
    const [hf, col, debt] = await publicClient.readContract({
      address: CONTRACTS.GoodLendPool,
      abi: GLP_ABI_CORRECT,
      functionName: 'getUserAccountData',
      args: [WALLET],
    });
    const uint256max = 2n**256n - 1n;
    const hfStr = hf === uint256max ? 'uint256_max' : hf.toString();
    const colStr = col === uint256max ? 'uint256_max (BUG!)' : col.toString();
    const debtStr = debt === uint256max ? 'uint256_max (BUG!)' : debt.toString();
    return `healthFactor=${hfStr} collateralUSD=${colStr} debtUSD=${debtStr}`;
  });

  // ---- getReserveData with correct ABI ----
  console.log('\n--- getReserveData (Corrected ABI) ---');

  await test('GLP-RD-v2', 'GoodLendPool', 'getReserveData(USDC)', 'getReserveData USDC correct ABI', async () => {
    const [totalDeposits, totalBorrows, liquidityIndex, borrowIndex, supplyRate, borrowRate, accruedToTreasury] = await publicClient.readContract({
      address: CONTRACTS.GoodLendPool,
      abi: GLP_ABI_CORRECT,
      functionName: 'getReserveData',
      args: [CONTRACTS.MockUSDC],
    });
    return `totalDeposits=${totalDeposits} totalBorrows=${totalBorrows} liqIdx=${liquidityIndex} borrowIdx=${borrowIndex}`;
  });

  // ---- Supply with corrected 2-param signature ----
  console.log('\n--- Supply test (corrected 2-param signature) ---');

  // Mint fresh USDC and approve
  await test('OB-001-v2', 'MockUSDC', 'mint(wallet,100e6)', 'Mint 100 USDC for supply test', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MockUSDC,
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [WALLET, 100_000_000n],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash.slice(0,20)}... block=${receipt.blockNumber} status=${receipt.status}`;
  });

  await test('OB-002-v2', 'MockUSDC', 'approve(GoodLendPool,100e6)', 'Approve 100 USDC for GoodLendPool', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MockUSDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.GoodLendPool, 100_000_000n],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash.slice(0,20)}... block=${receipt.blockNumber} status=${receipt.status}`;
  });

  await test('OB-003-v2', 'GoodLendPool', 'supply(USDC,100e6)', 'Supply 100 USDC (correct 2-param ABI)', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GoodLendPool,
      abi: GLP_ABI_CORRECT,
      functionName: 'supply',
      args: [CONTRACTS.MockUSDC, 100_000_000n],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return `tx=${hash.slice(0,20)}... block=${receipt.blockNumber} status=${receipt.status}`;
  });

  // After supplying, check getUserAccountData again
  await test('GOO204-v3', 'GoodLendPool', 'getUserAccountData(wallet)_post_supply', 'GOO-204: getUserAccountData AFTER supply', async () => {
    const [hf, col, debt] = await publicClient.readContract({
      address: CONTRACTS.GoodLendPool,
      abi: GLP_ABI_CORRECT,
      functionName: 'getUserAccountData',
      args: [WALLET],
    });
    const uint256max = 2n**256n - 1n;
    const hfStr = hf === uint256max ? 'uint256_max (BUG STILL PRESENT)' : hf.toString();
    const colStr = col === uint256max ? 'uint256_max (BUG STILL PRESENT)' : `${col} USD`;
    const debtStr = debt === uint256max ? 'uint256_max (BUG)' : `${debt} USD`;
    return `healthFactor=${hfStr} collateralUSD=${colStr} debtUSD=${debtStr}`;
  });

  // Over-borrow: try to borrow 200 USDC (only supplied 100)
  await testExpectRevert('OB-004-v2', 'GoodLendPool', 'borrow(USDC,200e6)', 'Negative: borrow 200 USDC when only 100 supplied (over-collateral) — should revert', async () => {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.GoodLendPool,
      abi: GLP_ABI_CORRECT,
      functionName: 'borrow',
      args: [CONTRACTS.MockUSDC, 200_000_000n],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return 'tx succeeded';
  });

  // Now also test: ConditionalTokens.factory() anomaly
  console.log('\n--- ConditionalTokens factory() anomaly investigation ---');

  await test('CT-ANO-001', 'ConditionalTokens', 'factory()_deployed_addr', 'ConditionalTokens at 0x2279 factory() — is this the right contract?', async () => {
    const CT_ABI = parseAbi(['function factory() view returns (address)']);
    const val = await publicClient.readContract({
      address: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      abi: CT_ABI,
      functionName: 'factory',
    });
    const isMarketFactory = val.toLowerCase() === '0x8a791620dd6260079bf849dc5567adc3f2fdc318';
    const isDeployer = val.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    return `factory=${val} isMarketFactory=${isMarketFactory} isDeployer=${isDeployer}`;
  });

  await test('CT-ANO-002', 'MarketFactory', 'tokens()_vs_deployed', 'MarketFactory.tokens() vs deployed ConditionalTokens address', async () => {
    const MF_ABI = parseAbi(['function tokens() view returns (address)']);
    const val = await publicClient.readContract({
      address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
      abi: MF_ABI,
      functionName: 'tokens',
    });
    const matchesDeployed = val.toLowerCase() === '0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6';
    return `tokens()=${val} matchesDeployedCT=${matchesDeployed} — ${matchesDeployed ? 'OK' : 'MISMATCH: MarketFactory has its own ConditionalTokens!'}`;
  });

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\n=== SUPPLEMENTAL SUMMARY: ${passed} PASS, ${failed} FAIL of ${total} ===\n`);

  return results;
}

runTests().then(results => {
  process.stdout.write('__RESULTS__:' + JSON.stringify(results));
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
