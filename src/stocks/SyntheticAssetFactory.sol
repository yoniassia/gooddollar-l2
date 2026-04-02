// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SyntheticAsset.sol";

/**
 * @title SyntheticAssetFactory
 * @notice Deploys and tracks SyntheticAsset ERC-20 tokens for listed stocks.
 *         Called by the admin (governance) to list new stocks. The vault
 *         address passed at listing time becomes the sole minter.
 */
contract SyntheticAssetFactory {
    // ============ State ============

    address public admin;

    /// @notice ticker key → SyntheticAsset address
    mapping(bytes32 => address) public assets;

    /// @notice All listed tickers (display/enumeration)
    bytes32[] public listedKeys;
    mapping(bytes32 => string) public keyToTicker;

    // ============ Events ============

    event AssetListed(string indexed ticker, address asset, address vault);
    event AssetDelisted(string indexed ticker, address asset);

    // ============ Errors ============

    error NotAdmin();
    error ZeroAddress();
    error AlreadyListed(string ticker);
    error NotListed(string ticker);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ============ Constructor ============

    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ============ Listing ============

    /**
     * @notice Deploy a new SyntheticAsset token for a stock.
     * @param ticker Trading symbol (e.g., "AAPL")
     * @param assetName Full name (e.g., "Apple Inc. — Synthetic")
     * @param vault CollateralVault address (will be the sole minter)
     * @return asset Address of the deployed SyntheticAsset
     */
    function listAsset(
        string calldata ticker,
        string calldata assetName,
        address vault
    ) external onlyAdmin returns (address asset) {
        if (vault == address(0)) revert ZeroAddress();
        bytes32 key = _key(ticker);
        if (assets[key] != address(0)) revert AlreadyListed(ticker);

        string memory syntheticSymbol = string(abi.encodePacked("s", ticker));
        asset = address(new SyntheticAsset(assetName, syntheticSymbol, vault));

        assets[key] = asset;
        listedKeys.push(key);
        keyToTicker[key] = ticker;

        emit AssetListed(ticker, asset, vault);
    }

    /**
     * @notice Remove a stock from the listed set (doesn't destroy the token).
     */
    function delistAsset(string calldata ticker) external onlyAdmin {
        bytes32 key = _key(ticker);
        address asset = assets[key];
        if (asset == address(0)) revert NotListed(ticker);

        delete assets[key];

        // Remove from listedKeys array
        uint256 len = listedKeys.length;
        for (uint256 i = 0; i < len; i++) {
            if (listedKeys[i] == key) {
                listedKeys[i] = listedKeys[len - 1];
                listedKeys.pop();
                break;
            }
        }

        emit AssetDelisted(ticker, asset);
    }

    // ============ View ============

    /**
     * @notice Get asset address by ticker
     */
    function getAsset(string calldata ticker) external view returns (address) {
        return assets[_key(ticker)];
    }

    /**
     * @notice Total number of listed assets
     */
    function listedCount() external view returns (uint256) {
        return listedKeys.length;
    }

    /**
     * @notice Transfer admin
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    // ============ Internal ============

    function _key(string calldata ticker) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(ticker));
    }
}
