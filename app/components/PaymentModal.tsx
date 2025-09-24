'use client';

import { useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  prompt: string;
}

// Contract ABI - only the function we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "payForImages",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Contract address - will be set after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// USDC contract address on Base mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC ABI for approval
const USDC_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function PaymentModal({ isOpen, onClose, requestId, prompt }: PaymentModalProps) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<'approve' | 'pay' | 'success'>('approve');
  const [isApproving, setIsApproving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // USDC approval transaction
  const { writeContract: writeUSDCContract, data: approveHash, isPending: isApprovePending } = useWriteContract();
  
  // Wait for approval transaction
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Payment transaction
  const { writeContract: writeContract, data: paymentHash, isPending: isPaymentPending } = useWriteContract();
  
  // Wait for payment transaction
  const { isLoading: isPaymentConfirming } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Handle USDC approval
  const handleApprove = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsApproving(true);
    
    try {
      // Approve 1 USDC (6 decimals)
      const amount = parseUnits('1', 6);
      
      await writeUSDCContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
      });
      
      setStep('pay');
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsPaying(true);
    
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payForImages',
        args: [],
      });
      
      setStep('success');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Complete Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your prompt:</p>
            <p className="font-medium">"{prompt}"</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💰 You will pay exactly <strong>$1 USDC</strong> and receive <strong>5 AI images</strong>
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-4">
              <p className="text-red-600 dark:text-red-400 mb-4">
                Please connect your wallet to continue
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 'approve' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    First, approve the contract to spend your USDC tokens.
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isApprovePending || isApproveConfirming}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {isApproving || isApprovePending || isApproveConfirming
                      ? 'Approving...'
                      : 'Approve USDC'}
                  </button>
                </div>
              )}

              {step === 'pay' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Now pay $1 USDC to generate your images.
                  </p>
                  <button
                    onClick={handlePayment}
                    disabled={isPaying || isPaymentPending || isPaymentConfirming}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {isPaying || isPaymentPending || isPaymentConfirming
                      ? 'Processing Payment...'
                      : 'Pay $1 USDC'}
                  </button>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-4">
                  <div className="text-green-600 dark:text-green-400 text-4xl mb-2">✅</div>
                  <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    Payment Successful!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your images are being generated. You can close this modal and wait for the results.
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>Request ID: {requestId}</p>
            <p>Network: Base Mainnet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
