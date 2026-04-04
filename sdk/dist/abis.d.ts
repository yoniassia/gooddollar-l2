/**
 * Contract ABIs for all GoodDollar L2 protocols
 * Extracted from frontend/src/lib/abi.ts — canonical source
 */
export declare const ERC20ABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const PerpEngineABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "size";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly type: "bool";
    }, {
        readonly name: "minPrice";
        readonly type: "uint256";
    }];
    readonly name: "openPosition";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "closePosition";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "markets";
    readonly outputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
    }, {
        readonly name: "maxLeverage";
        readonly type: "uint256";
    }, {
        readonly name: "isActive";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "marketCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "positions";
    readonly outputs: readonly [{
        readonly name: "size";
        readonly type: "uint256";
    }, {
        readonly name: "entryPrice";
        readonly type: "uint256";
    }, {
        readonly name: "isLong";
        readonly type: "bool";
    }, {
        readonly name: "collateral";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "unrealizedPnL";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "int256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const MarketFactoryABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "question";
        readonly type: "string";
    }, {
        readonly name: "endTime";
        readonly type: "uint256";
    }, {
        readonly name: "resolver";
        readonly type: "address";
    }];
    readonly name: "createMarket";
    readonly outputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "isYES";
        readonly type: "bool";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "buy";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "redeem";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "getMarket";
    readonly outputs: readonly [{
        readonly name: "question";
        readonly type: "string";
    }, {
        readonly name: "endTime";
        readonly type: "uint256";
    }, {
        readonly name: "status";
        readonly type: "uint8";
    }, {
        readonly name: "totalYES";
        readonly type: "uint256";
    }, {
        readonly name: "totalNO";
        readonly type: "uint256";
    }, {
        readonly name: "collateral";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "marketCount";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "marketId";
        readonly type: "uint256";
    }];
    readonly name: "impliedProbabilityYES";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const GoodLendPoolABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "supply";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "borrow";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "repay";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "getUserAccountData";
    readonly outputs: readonly [{
        readonly name: "healthFactor";
        readonly type: "uint256";
    }, {
        readonly name: "totalCollateralUSD";
        readonly type: "uint256";
    }, {
        readonly name: "totalDebtUSD";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "address";
    }];
    readonly name: "getReserveData";
    readonly outputs: readonly [{
        readonly name: "totalDeposits";
        readonly type: "uint256";
    }, {
        readonly name: "totalBorrows";
        readonly type: "uint256";
    }, {
        readonly name: "liquidityIndex";
        readonly type: "uint256";
    }, {
        readonly name: "borrowIndex";
        readonly type: "uint256";
    }, {
        readonly name: "supplyRate";
        readonly type: "uint256";
    }, {
        readonly name: "borrowRate";
        readonly type: "uint256";
    }, {
        readonly name: "accruedToTreasury";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const CollateralVaultABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "collateralAmount";
        readonly type: "uint256";
    }, {
        readonly name: "syntheticAmount";
        readonly type: "uint256";
    }];
    readonly name: "depositAndMint";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "burn";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdrawCollateral";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getPosition";
    readonly outputs: readonly [{
        readonly name: "userCollateral";
        readonly type: "uint256";
    }, {
        readonly name: "userDebt";
        readonly type: "uint256";
    }, {
        readonly name: "ratio";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getCollateralRatio";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const SyntheticAssetFactoryABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "ticker";
        readonly type: "string";
    }];
    readonly name: "getAsset";
    readonly outputs: readonly [{
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "allTickers";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string[]";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const MarginVaultABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "deposit";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "balances";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const UBIFeeHookABI: readonly [{
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "calculateUBIFee";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalSwapsProcessed";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
    readonly name: "totalUBIFees";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
