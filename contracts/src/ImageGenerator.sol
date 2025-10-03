// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ImageGenerator is Ownable {
    IERC20 public immutable usdc;
    uint256 public constant PRICE = 1e6; // 1 USDC (6 decimals)
    
    event PaymentReceived(address indexed user, uint256 amount);
    event Withdraw(address indexed owner, uint256 amount);
    
    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }
    
    function payForImages() external {
        // USDC transfer from user to contract
        require(usdc.transferFrom(msg.sender, address(this), PRICE), "USDC transfer failed");
        
        emit PaymentReceived(msg.sender, PRICE);
    }
    
    /**
     * @dev Withdraw function that can only be called by the owner
     * Transfers all USDC tokens in the contract to the owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        require(usdc.transfer(owner(), balance), "Transfer failed");
        
        emit Withdraw(owner(), balance);
    }
}