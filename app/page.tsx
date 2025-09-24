'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PaymentModal from './components/PaymentModal';

interface GeneratedImage {
  url: string;
  base64: string;
  type?: string;
  spec?: unknown;
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
  const PROGRESS_TOTAL = 5;
  const [progressCurrent, setProgressCurrent] = useState(0);

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
      console.log('[Images] generation start', { promptLength: prompt.length });
      const images: GeneratedImage[] = [];
      const imageTypes = ['icon', 'screenshot', 'hero', 'og', 'splash'];
      setProgressCurrent(0);
      
      // Generate 5 different types of images for Farcaster Mini App manifest
      for (const imageType of imageTypes) {
        const startedAt = Date.now();
        console.log('[Images] requesting', { imageType });
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, imageType }),
        });
        
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          console.error('[Images] request failed', { imageType, status: response.status, text });
          throw new Error(`Failed to generate ${imageType} image (${response.status})`);
        }
        
        const data = await response.json();
        console.log('[Images] response received', { imageType, hasImage: Boolean(data?.image), url: data?.image?.url, base64Len: data?.image?.base64?.length });

        if (data.image) {
          images.push({
            url: data.image.url,
            base64: data.image.base64,
            type: imageType,
            spec: data.image.spec
          });
          setProgressCurrent((prev) => Math.min(prev + 1, PROGRESS_TOTAL));
        }
        console.log('[Images] step done', { imageType, durationMs: Date.now() - startedAt });

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('[Images] generation complete', { count: images.length });
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

  // Handle payment success
  const handlePaymentSuccess = async () => {
    if (currentRequestId) {
      // Generate images after payment
      try {
        console.log('[Payment->Images] starting image generation after payment', { currentRequestId });
        setIsCheckingPayment(true);
        const images = await generateImages(prompt);
        
        console.log('[Payment->Images] images ready, updating state', { imagesCount: images.length });
        setImageRequest({
          ready: true,
          images,
          prompt,
          timestamp: new Date().toISOString()
        });
        
        setIsGenerating(false);
        setIsCheckingPayment(false);
      } catch (error) {
        console.error('[Payment->Images] error generating images:', error);
        alert('Error generating images. Please try again.');
        setIsGenerating(false);
        setIsCheckingPayment(false);
      }
    }
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
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
            <ConnectButton />
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
                maxLength={300}
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isGenerating || isCheckingPayment}
                />
              <div className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
                {prompt.length}/300
              </div>
                
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
                {(isGenerating || isCheckingPayment) && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">Generating images...</span>
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">{Math.round((progressCurrent/PROGRESS_TOTAL)*100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-yellow-200 dark:bg-yellow-800/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 dark:bg-yellow-400 transition-all duration-500"
                        style={{ width: `${(progressCurrent/PROGRESS_TOTAL)*100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">{progressCurrent} / {PROGRESS_TOTAL} images</div>
                  </div>
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
                  Your prompt: <em>&quot;{imageRequest.prompt}&quot;</em>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageRequest.images.map((image, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src={`data:image/png;base64,${image.base64}`}
                      alt={`${image.type} image`}
                      className="w-full h-64 object-cover"
                      width={1024}
                      height={1024}
                    />
                    <div className="p-4">
                      <h4 className="font-medium mb-2 capitalize">{image.type} Image</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {image.type === 'icon' && '1024x1024px - App icon (square format)'}
                        {image.type === 'screenshot' && '1024x1024px - App screenshot (portrait style)'}
                        {image.type === 'hero' && '1024x1024px - Promotional banner (landscape style)'}
                        {image.type === 'og' && '1024x1024px - Social media sharing (Open Graph style)'}
                        {image.type === 'splash' && '1024x1024px - Loading screen (simple design)'}
                      </p>
                      <button
                        onClick={() => downloadImage(image, index)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Download {image.type}
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
          onPaymentSuccess={handlePaymentSuccess}
          requestId={currentRequestId}
          prompt={prompt}
        />
      )}
    </div>
  );
}