'use client';

import { useState, useEffect } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { parseEther, formatUnits } from 'viem';
import PaymentModal from './components/PaymentModal';

interface GeneratedImage {
  url: string;
  base64: string;
}

interface ImageRequest {
  ready: boolean;
  images?: GeneratedImage[];
  prompt?: string;
  timestamp?: string;
  txHash?: string;
  status?: string;
  message?: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [imageRequest, setImageRequest] = useState<ImageRequest | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Generate unique request ID
  const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Submit prompt and show payment modal
  const submitPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    const requestId = generateRequestId();
    setCurrentRequestId(requestId);
    
    // Show payment modal directly
    setShowPaymentModal(true);
  };

  // Generate images using OpenAI API
  const generateImages = async (prompt: string): Promise<GeneratedImage[]> => {
    try {
      const images: GeneratedImage[] = [];
      
      // Generate 5 images (DALL-E 3 can only generate 1 image per request)
      for (let i = 0; i < 5; i++) {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate image');
        }
        
        const data = await response.json();
        
        if (data.image) {
          images.push({
            url: data.image.url,
            base64: data.image.base64
          });
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return images;
    } catch (error) {
      console.error('Error generating images:', error);
      throw error;
    }
  };

  // Download image
  const downloadImage = (image: GeneratedImage, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image.base64}`;
    link.download = `generated-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle payment modal close
  const handlePaymentModalClose = async () => {
    setShowPaymentModal(false);
    if (currentRequestId) {
      // Generate images after payment
      try {
        setIsCheckingPayment(true);
        const images = await generateImages(prompt);
        
        setImageRequest({
          ready: true,
          images,
          prompt,
          timestamp: new Date().toISOString()
        });
        
        setIsGenerating(false);
        setIsCheckingPayment(false);
      } catch (error) {
        console.error('Error generating images:', error);
        alert('Error generating images. Please try again.');
        setIsGenerating(false);
        setIsCheckingPayment(false);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setPrompt('');
    setIsGenerating(false);
    setCurrentRequestId(null);
    setImageRequest(null);
    setIsCheckingPayment(false);
    setShowPaymentModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
      {/* Header */}
      <header className="pt-4 pr-4">
        <div className="flex justify-between items-center">
          <div className="pl-4">
            <h1 className="text-2xl font-bold text-blue-600">Flicks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI Image Generator • Pay $1 USDC • Get 5 Images
            </p>
          </div>
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Generate AI Images with DALL-E</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Enter your prompt, pay $1 USDC, and receive 5 high-quality AI-generated images instantly
            </p>
          </div>

          {/* Prompt Input Section */}
          {!imageRequest && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-semibold mb-4">Describe Your Image</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A beautiful sunset over mountains with a lake reflection..."
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isGenerating || isCheckingPayment}
                />
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>• Pay exactly $1 USDC</p>
                    <p>• Receive 5 images (1024×1024)</p>
                    <p>• Powered by OpenAI DALL-E 3</p>
                  </div>
                  
                  <button
                    onClick={submitPrompt}
                    disabled={!prompt.trim() || isGenerating || isCheckingPayment}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                  >
                    {isGenerating || isCheckingPayment ? 'Processing...' : 'Generate Images ($1 USDC)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {currentRequestId && !imageRequest && (
            <div className="mb-8">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Waiting for Payment
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Your prompt has been submitted. Please complete the payment to generate your images.
                </p>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  <p>Request ID: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">{currentRequestId}</code></p>
                  {isCheckingPayment && (
                    <p className="mt-2">🔄 Checking for payment confirmation...</p>
                  )}
                </div>
                {!isCheckingPayment && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Complete Payment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Generated Images */}
          {imageRequest && imageRequest.ready && imageRequest.images && (
            <div className="mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Images Generated Successfully!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Your prompt: <em>"{imageRequest.prompt}"</em>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageRequest.images.map((image, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <img
                      src={`data:image/png;base64,${image.base64}`}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-medium mb-2">Image {index + 1}</h4>
                      <button
                        onClick={() => downloadImage(image, index)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Generate New Images
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">1. Enter Prompt</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Describe the image you want to generate in detail
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">2. Pay $1 USDC</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your wallet and pay exactly 1 USDC via smart contract
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">3. Get Images</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Receive 5 high-quality images powered by DALL-E 3
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
              <h4 className="font-medium mb-2">Technical Details:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Network: Base Mainnet</li>
                <li>• Payment: USDC (ERC-20)</li>
                <li>• AI Model: OpenAI DALL-E 3</li>
                <li>• Image Size: 1024×1024 pixels</li>
                <li>• Format: PNG</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && currentRequestId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          requestId={currentRequestId}
          prompt={prompt}
        />
      )}
    </div>
  );
}