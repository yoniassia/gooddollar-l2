// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/PriceOracle.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/SyntheticAssetFactory.sol";
import "../../src/stocks/CollateralVault.sol";
import "../../src/GoodDollarToken.sol";

// ============ Mock Chainlink Feed ============

contract MockChainlinkFeed {
    int256 public price;
    uint256 public updatedAt;
    uint8 public constant decimals = 8;

    constructor(int256 _price) {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, price, block.timestamp, updatedAt, 1);
    }
}

// ============ Mock Fee Splitter ============

contract MockFeeSplitter {
    GoodDollarToken public immutable token;
    uint256 public totalReceived;

    constructor(address _token) {
        token = GoodDollarToken(_token);
    }

    function splitFee(uint256 totalFee, address) external returns (uint256, uint256, uint256) {
        token.transferFrom(msg.sender, address(this), totalFee);
        totalReceived += totalFee;
        return (totalFee / 3, totalFee / 6, totalFee / 2);
    }
}

