'use client';

import { useEffect, useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
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

// Contract address - deployed contract
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// USDC contract address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

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

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, requestId, prompt }: PaymentModalProps) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<'approve' | 'pay' | 'success'>('approve');
  const [isApproving, setIsApproving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // USDC approval transaction
  const { writeContract: writeUSDCContract, data: approveHash, isPending: isApprovePending } = useWriteContract();
  
  // Wait for approval transaction
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess, isError: isApproveError } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Payment transaction
  const { writeContract: writeContract, data: paymentHash, isPending: isPaymentPending } = useWriteContract();
  
  // Wait for payment transaction
  const { isLoading: isPaymentConfirming, isSuccess: isPaymentSuccess, isError: isPaymentError } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Debug logs for environment and props
  useEffect(() => {
    console.log('[PaymentModal] mounted/props', {
      CONTRACT_ADDRESS,
      USDC_ADDRESS,
      isOpen,
      requestId,
      prompt,
    });
  }, [isOpen, requestId, prompt]);

  // Log account/connection changes
  useEffect(() => {
    console.log('[PaymentModal] account state', { address, isConnected });
  }, [address, isConnected]);

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
      console.log('[Approval] sending approve tx', {
        owner: address,
        spender: CONTRACT_ADDRESS,
        token: USDC_ADDRESS,
        amount: amount?.toString?.() ?? String(amount),
      });

      await writeUSDCContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
      });

      console.log('[Approval] approve tx sent', { approveHash });
    } catch (error) {
      console.error('[Approval] failed:', error);
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
      console.log('[Payment] sending payment tx', {
        contractAddress: CONTRACT_ADDRESS,
        functionName: 'payForImages',
        userAddress: address
      });
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payForImages',
        args: [],
      });
      
      console.log('[Payment] payment tx sent', { paymentHash });
    } catch (error) {
      console.error('[Payment] failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPaying(false);
    }
  };

  // React to approval receipt
  useEffect(() => {
    console.log('[Approval] receipt state', {
      approveHash,
      isApproveConfirming,
      isApproveSuccess,
      isApproveError,
    });
    if (approveHash && isApproveSuccess) {
      console.log('[Approval] confirmed, moving to pay step');
      setStep('pay');
    }
    if (approveHash && isApproveError) {
      console.warn('[Approval] tx error');
    }
  }, [approveHash, isApproveConfirming, isApproveSuccess, isApproveError]);

  // React to payment receipt
  useEffect(() => {
    console.log('[Payment] receipt state', {
      paymentHash,
      isPaymentConfirming,
      isPaymentSuccess,
      isPaymentError,
    });
    if (paymentHash && isPaymentSuccess) {
      console.log('[Payment] confirmed, marking success and invoking callback');
      setStep('success');
      if (onPaymentSuccess) {
        try {
          onPaymentSuccess();
        } catch (e) {
          console.error('[Payment] onPaymentSuccess callback threw', e);
        }
      }
    }
    if (paymentHash && isPaymentError) {
      console.warn('[Payment] tx error');
    }
  }, [paymentHash, isPaymentConfirming, isPaymentSuccess, isPaymentError, onPaymentSuccess]);

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
            <p className="font-medium">&ldquo;{prompt}&rdquo;</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💰 You will pay exactly <strong>$1 USDC</strong> and receive <strong>4 AI images</strong>
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
