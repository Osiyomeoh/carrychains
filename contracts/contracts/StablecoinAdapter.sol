// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StablecoinAdapter
 * @dev Manages multiple stablecoin payments with exchange rate functionality
 */
contract StablecoinAdapter is Ownable {
    using SafeERC20 for IERC20;

    // Mapping to track supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Mapping to store token prices/exchange rates (in USD with 8 decimals)
    mapping(address => uint256) public tokenPrices;
    
    // Mapping to store token decimals
    mapping(address => uint256) public tokenDecimals;
    
    // Array to keep track of all supported tokens
    address[] public tokenList;
    
    // Events
    event TokenAdded(address indexed token, uint256 decimals);
    event TokenRemoved(address indexed token);
    event PriceUpdated(address indexed token, uint256 price);
    event PaymentProcessed(address indexed from, address indexed to, address indexed token, uint256 amount);
    
    constructor() {}
    
    /**
     * @dev Add a supported token
     */
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        tokenList.push(token);
        
        // Set default price to $1.00 (with 8 decimals) for stablecoins
        tokenPrices[token] = 100000000;
        
        // Get decimals from token using IERC20Metadata interface
        uint256 decimals = IERC20Metadata(token).decimals();
        tokenDecimals[token] = decimals;
        
        emit TokenAdded(token, decimals);
    }
    
    /**
     * @dev Remove a supported token
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        delete tokenPrices[token];
        delete tokenDecimals[token];
        
        // Remove from tokenList array
        for (uint i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
    /**
     * @dev Update token price/exchange rate
     */
    function updateTokenPrice(address token, uint256 price) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(price > 0, "Invalid price");
        
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }
    
    /**
     * @dev Process payment from one address to another
     */
    function processPayment(
        address token,
        address from,
        address to,
        uint256 amount
    ) external {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient");
        
        IERC20(token).safeTransferFrom(from, to, amount);
        
        emit PaymentProcessed(from, to, token, amount);
    }
    
    /**
     * @dev Get exchange rate for a token (price in USD with 8 decimals)
     */
    function getExchangeRate(address token) external view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        return tokenPrices[token];
    }
    
    /**
     * @dev Check if a token is supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    /**
     * @dev Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @dev Convert amount from one token to another based on exchange rates
     */
    function convertAmount(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (uint256) {
        require(supportedTokens[fromToken], "From token not supported");
        require(supportedTokens[toToken], "To token not supported");
        
        if (fromToken == toToken) {
            return amount;
        }
        
        // Convert to USD value
        uint256 fromDecimals = tokenDecimals[fromToken];
        uint256 toDecimals = tokenDecimals[toToken];
        uint256 fromPrice = tokenPrices[fromToken];
        uint256 toPrice = tokenPrices[toToken];
        
        // Calculate: (amount * fromPrice / 10^fromDecimals) * 10^toDecimals / toPrice
        uint256 usdValue = (amount * fromPrice) / (10 ** fromDecimals);
        uint256 targetAmount = (usdValue * (10 ** toDecimals)) / toPrice;
        
        return targetAmount;
    }
}