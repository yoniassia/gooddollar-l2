// Mock viem for unit tests (avoids ESM import issues)
export const createPublicClient = jest.fn(() => ({
    getBalance: jest.fn(),
    readContract: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
}));
export const createWalletClient = jest.fn(() => ({
    writeContract: jest.fn(),
}));
export const http = jest.fn((url) => ({ url }));
export const parseEther = (val) => BigInt(Math.round(parseFloat(val) * 1e18));
export const formatEther = (val) => (Number(val) / 1e18).toString();
export const formatUnits = (val, decimals) => (Number(val) / 10 ** decimals).toString();
