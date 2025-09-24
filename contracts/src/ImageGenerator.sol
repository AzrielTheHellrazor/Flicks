// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ImageGenerator {
    IERC20 public immutable usdc;
    uint256 public constant PRICE = 1e6; // 1 USDC (6 decimals)
    
    address public owner;
    
    event PaymentReceived(address indexed user, uint256 amount);
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }
    
    function payForImages() external {
        // USDC transfer from user to contract
        require(usdc.transferFrom(msg.sender, address(this), PRICE), "USDC transfer failed");
        
        emit PaymentReceived(msg.sender, PRICE);
    }
}