// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ImageGenerator} from "../src/ImageGenerator.sol";

contract DeployScript is Script {
    function run() external {
        vm.broadcast();
        
        // Get USDC address based on network
        address usdcAddress = getUSDCAddress();
        
        console.log("Deploying ImageGenerator with USDC address:", usdcAddress);
        console.log("Network Chain ID:", block.chainid);
        
        ImageGenerator imageGenerator = new ImageGenerator(usdcAddress);
        
        console.log("ImageGenerator deployed at:", address(imageGenerator));
        console.log("Owner:", imageGenerator.owner());
        console.log("USDC Address:", address(imageGenerator.usdc()));
        console.log("Price:", imageGenerator.PRICE());
    }
    
    function getUSDCAddress() internal view returns (address) {
        uint256 chainId = block.chainid;
        
        if (chainId == 8453) {
            // Base mainnet
            return 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        } else if (chainId == 84532) {
            // Base sepolia
            return 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        } else {
            revert("Unsupported network");
        }
    }
}
