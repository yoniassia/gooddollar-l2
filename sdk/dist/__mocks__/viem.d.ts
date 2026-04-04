export declare const createPublicClient: jest.Mock<{
    getBalance: jest.Mock<any, any, any>;
    readContract: jest.Mock<any, any, any>;
    waitForTransactionReceipt: jest.Mock<any, any, any>;
}, [], any>;
export declare const createWalletClient: jest.Mock<{
    writeContract: jest.Mock<any, any, any>;
}, [], any>;
export declare const http: jest.Mock<{
    url: string;
}, [url: string], any>;
export declare const parseEther: (val: string) => bigint;
export declare const formatEther: (val: bigint) => string;
export declare const formatUnits: (val: bigint, decimals: number) => string;
export type PublicClient = ReturnType<typeof createPublicClient>;
export type WalletClient = ReturnType<typeof createWalletClient>;
export type Transport = any;
export type Chain = any;
export type Account = {
    address: string;
};
export type Address = string;
