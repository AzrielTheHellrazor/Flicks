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
  projectTemplate?: string;
  optimizedPrompt?: string;
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
  const PROGRESS_TOTAL = 4;
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showImagePlaceholders, setShowImagePlaceholders] = useState(false);

  // Generate unique request ID
  const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Submit prompt and show payment modal
  const submitPrompt = async () => {
    console.log('[Submit] 🎯 Submit button clicked', { 
      prompt: prompt.substring(0, 50) + '...',
      promptLength: prompt.length,
      promptTrimmed: prompt.trim(),
      hasPrompt: !!prompt.trim(),
      isGenerating, 
      isCheckingPayment, 
      showPaymentModal,
      currentRequestId
    });
    
    if (!prompt.trim() || isGenerating || isCheckingPayment || showPaymentModal) {
      console.log('[Submit] ⛔ Prevented duplicate submission', { 
        reason: !prompt.trim() ? 'No prompt' : 
                isGenerating ? 'Already generating' :
                isCheckingPayment ? 'Already checking payment' :
                'Payment modal open',
        hasPrompt: !!prompt.trim(), 
        isGenerating, 
        isCheckingPayment, 
        showPaymentModal 
      });
      return;
    }
    
    console.log('[Submit] 🚀 Starting new generation', { 
      promptLength: prompt.length,
      prompt: prompt.substring(0, 100) + '...'
    });
    
    setIsGenerating(true);
    const requestId = generateRequestId();
    setCurrentRequestId(requestId);
    
    console.log('[Submit] 📊 State updated', { 
      isGenerating: true,
      currentRequestId: requestId,
      showPaymentModal: true
    });
    
    // Show payment modal directly
    setShowPaymentModal(true);
    
    console.log('[Submit] 💳 Payment modal should be shown now');
  };

  // Generate images using OpenAI API
  const generateImages = async (prompt: string): Promise<GeneratedImage[]> => {
    try {
      console.log('[Images] 🚀 Generation START', { 
        promptLength: prompt.length, 
        prompt: prompt.substring(0, 100) + '...',
        isGeneratingImages,
        isCheckingPayment 
      });
      
      setIsGeneratingImages(true);
      setProgressCurrent(0);
      setGenerationStatus('Starting image generation...');
      setShowImagePlaceholders(true);
      setGeneratedImages([]);
      
      console.log('[Images] 📊 State updated', { 
        isGeneratingImages: true, 
        showImagePlaceholders: true,
        progressCurrent: 0 
      });
      
      const images: GeneratedImage[] = [];
      const imageTypes = ['icon', 'hero', 'og', 'splash'];
      
      console.log('[Images] 🎯 Starting loop for image types:', imageTypes);
      
      // Generate 4 different types of images for Farcaster Mini App manifest
      for (let i = 0; i < imageTypes.length; i++) {
        const imageType = imageTypes[i];
        
        console.log(`[Images] 🔄 Loop iteration ${i + 1}/${imageTypes.length}`, { 
          imageType, 
          isGeneratingImages,
          currentImagesCount: images.length 
        });
        
        // Note: Removed isGeneratingImages check as it was causing premature cancellation
        // The generation should continue until all 4 images are created

        setGenerationStatus(`Generating ${imageType} image... (${i + 1}/${imageTypes.length})`);
        const startedAt = Date.now();
        
        console.log('[Images] 📡 Making API request', { 
          imageType, 
          prompt: prompt.substring(0, 50) + '...',
          url: '/api/generate-image',
          method: 'POST'
        });
        
        const requestBody = { prompt, imageType };
        console.log('[Images] 📦 Request body:', requestBody);
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('[Images] 📨 Response received', { 
          imageType, 
          status: response.status, 
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          console.error('[Images] ❌ Request failed', { 
            imageType, 
            status: response.status, 
            statusText: response.statusText,
            text: text.substring(0, 200) 
          });
          throw new Error(`Failed to generate ${imageType} image (${response.status})`);
        }
        
        const data = await response.json();
        console.log('[Images] 📋 Response data', { 
          imageType, 
          hasImage: Boolean(data?.image), 
          hasUrl: Boolean(data?.image?.url), 
          hasBase64: Boolean(data?.image?.base64),
          base64Length: data?.image?.base64?.length,
          hasTemplate: Boolean(data?.image?.projectTemplate),
          hasOptimizedPrompt: Boolean(data?.image?.optimizedPrompt),
          fullResponse: data
        });

        if (data.image) {
          const newImage = {
            url: data.image.url,
            base64: data.image.base64,
            type: imageType,
            spec: data.image.spec,
            projectTemplate: data.image.projectTemplate,
            optimizedPrompt: data.image.optimizedPrompt
          };
          
          console.log('[Images] ✅ Image created', { 
            imageType, 
            newImage: {
              ...newImage,
              base64: newImage.base64 ? `${newImage.base64.substring(0, 20)}...` : null
            }
          });
          
          images.push(newImage);
          setGeneratedImages([...images]);
          setProgressCurrent(i + 1);
          setGenerationStatus(`✅ ${imageType} image completed! (${i + 1}/${imageTypes.length})`);
          
          console.log('[Images] 📊 State updated after image', { 
            imageType,
            totalImages: images.length,
            progressCurrent: i + 1,
            generatedImagesLength: images.length
          });
          
          // Small delay to show the image loading effect
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.error('[Images] ❌ No image in response', { imageType, data });
        }
        
        const duration = Date.now() - startedAt;
        console.log('[Images] ⏱️ Step completed', { 
          imageType, 
          durationMs: duration,
          totalImagesSoFar: images.length
        });

        // Small delay between requests to avoid rate limiting
        if (i < imageTypes.length - 1) {
          console.log('[Images] ⏳ Waiting 1 second before next request...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setGenerationStatus('🎉 All images generated successfully!');
      console.log('[Images] 🎊 Generation COMPLETE', { 
        totalImages: images.length,
        imageTypes: images.map(img => img.type),
        finalState: {
          isGeneratingImages: true, // Will be set to false in finally
          showImagePlaceholders: true,
          progressCurrent: images.length
        }
      });
      
      return images;
    } catch (error) {
      console.error('[Images] 💥 Error in generateImages:', error);
      console.error('[Images] 💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setGenerationStatus('❌ Error generating images');
      throw error;
    } finally {
      console.log('[Images] 🏁 Finally block - setting isGeneratingImages to false');
      setIsGeneratingImages(false);
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
    console.log('[Payment->Images] 🎉 Payment success triggered', { 
      currentRequestId, 
      isCheckingPayment,
      prompt: prompt.substring(0, 50) + '...',
      promptLength: prompt.length
    });
    
    if (currentRequestId && !isCheckingPayment) {
      // Generate images after payment
      try {
        console.log('[Payment->Images] 🚀 Starting image generation after payment', { 
          currentRequestId,
          prompt: prompt.substring(0, 100) + '...'
        });
        
        setIsCheckingPayment(true);
        setShowPaymentModal(false);
        
        console.log('[Payment->Images] 📊 State updated', { 
          isCheckingPayment: true, 
          showPaymentModal: false 
        });
        
        console.log('[Payment->Images] 📞 Calling generateImages...');
        const images = await generateImages(prompt);
        
        console.log('[Payment->Images] ✅ Images ready, updating state', { 
          imagesCount: images.length,
          imageTypes: images.map(img => img.type),
          images: images.map(img => ({
            type: img.type,
            hasBase64: Boolean(img.base64),
            hasUrl: Boolean(img.url),
            hasTemplate: Boolean(img.projectTemplate)
          }))
        });
        
        // Don't set imageRequest immediately - let the placeholder system handle it
        setIsGenerating(false);
        setIsCheckingPayment(false);
        setGenerationStatus('');
        
        console.log('[Payment->Images] 🏁 Final state update', { 
          isGenerating: false,
          isCheckingPayment: false,
          generationStatus: '',
          showImagePlaceholders: true // Should remain true
        });
        
        // Keep showImagePlaceholders true to show the images
      } catch (error) {
        console.error('[Payment->Images] 💥 Error generating images:', error);
        console.error('[Payment->Images] 💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        alert('Error generating images. Please try again.');
        setIsGenerating(false);
        setIsCheckingPayment(false);
        setGenerationStatus('');
        setShowImagePlaceholders(false);
        
        console.log('[Payment->Images] 🚨 Error state updated', { 
          isGenerating: false,
          isCheckingPayment: false,
          generationStatus: '',
          showImagePlaceholders: false
        });
      }
    } else {
      console.log('[Payment->Images] ⚠️ Payment success ignored', { 
        reason: !currentRequestId ? 'No currentRequestId' : 'Already checking payment',
        currentRequestId,
        isCheckingPayment
      });
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
    setProgressCurrent(0);
    setIsGeneratingImages(false);
    setGenerationStatus('');
    setGeneratedImages([]);
    setShowImagePlaceholders(false);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
      {/* Header */}
      <header className="pt-4 pr-4">
        <div className="flex justify-between items-center">
          <div className="pl-4">
            <h1 className="text-2xl font-bold text-purple-600">Flicks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Farcaster AI Image Generator • Pay $1 USDC • Get 4 Images
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
            <h2 className="text-4xl font-bold mb-4">Generate Farcaster AI Images with DALL-E</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Enter your prompt, pay $1 USDC, and receive 4 themed Farcaster-optimized AI-generated images with consistent branding
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
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isGenerating || isCheckingPayment}
                />
              <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div className="flex gap-4">
                  <span className="text-purple-600 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => setPrompt("Farcaster app icon, decentralized social media, minimalist design, purple theme, clean lines")}>
                    🎯 Farcaster Icon
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => setPrompt("Farcaster cast promotional banner, social media design, engaging visual, purple and blue colors")}>
                    🎨 Cast Banner
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setPrompt("Farcaster frame interface design, interactive elements, modern UI, decentralized social")}>
                    📱 Frame UI
                  </span>
                </div>
                <span>{prompt.length}/300</span>
              </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>• Pay exactly $1 USDC</p>
                    <p>• Receive 4 themed Farcaster-optimized images (1024×1024)</p>
                    <p>• AI creates consistent project template + optimized prompts</p>
                    <p>• Powered by OpenAI DALL-E 3 + ChatGPT</p>
                  </div>
                  
                  <button
                    onClick={submitPrompt}
                    disabled={!prompt.trim() || isGenerating || isCheckingPayment || showPaymentModal}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
                  >
                    {isGenerating || isCheckingPayment ? 'Processing...' : showPaymentModal ? 'Payment in Progress...' : 'Generate Farcaster Images ($1 USDC)'}
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
                {(isGenerating || isCheckingPayment || isGeneratingImages) && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        {generationStatus || 'Generating images...'}
                      </span>
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        {Math.round((progressCurrent/PROGRESS_TOTAL)*100)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-yellow-200 dark:bg-yellow-800/40 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 dark:from-yellow-400 dark:to-yellow-300 transition-all duration-500 ease-out relative"
                        style={{ width: `${(progressCurrent/PROGRESS_TOTAL)*100}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-yellow-700 dark:text-yellow-300">
                      <span>{progressCurrent} / {PROGRESS_TOTAL} images</span>
                      <span className="animate-pulse">✨ Creating magic...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Placeholders */}
          {showImagePlaceholders && (
            <div className="mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                  🎨 Generating Your Images
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-4">
                  Your prompt: <em>&quot;{prompt}&quot;</em>
                </p>
                {generatedImages[0]?.projectTemplate && (
                  <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-700">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      🎨 Generated Project Template:
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {generatedImages[0].projectTemplate}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {generationStatus}
                  </span>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {Math.round((progressCurrent/PROGRESS_TOTAL)*100)}%
                  </span>
                </div>
                
                <div className="w-full h-3 bg-blue-200 dark:bg-blue-800/40 rounded-full overflow-hidden relative mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-400 dark:to-blue-300 transition-all duration-500 ease-out relative"
                    style={{ width: `${(progressCurrent/PROGRESS_TOTAL)*100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                  <span>{progressCurrent} / {PROGRESS_TOTAL} images completed</span>
                  <span className="animate-pulse">✨ AI is working...</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['icon', 'hero', 'og', 'splash'].map((type, index) => {
                  const image = generatedImages.find(img => img.type === type);
                  const isGenerating = index === progressCurrent;
                  
                  return (
                    <div key={type} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                      {image ? (
                        <Image
                          src={`data:image/png;base64,${image.base64}`}
                          alt={`${image.type} image`}
                          className="w-full h-64 object-cover"
                          width={1024}
                          height={1024}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {isGenerating ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Generating...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="rounded-full h-12 w-12 bg-gray-300 dark:bg-gray-600 flex items-center justify-center mx-auto mb-2">
                                <span className="text-gray-500 dark:text-gray-400">⏳</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Waiting...</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h4 className="font-medium mb-2 capitalize">{type} Image</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {type === 'icon' && '1024x1024px - App icon (square format)'}
                          {type === 'hero' && '1024x1024px - Promotional banner (landscape style)'}
                          {type === 'og' && '1024x1024px - Social media sharing (Open Graph style)'}
                          {type === 'splash' && '1024x1024px - Loading screen (simple design)'}
                        </p>
                        
                        {image && (
                          <>
                            {image.optimizedPrompt && (
                              <details className="mb-3">
                                <summary className="text-xs text-purple-600 dark:text-purple-400 cursor-pointer hover:underline">
                                  View optimized prompt
                                </summary>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-left">
                                  {image.optimizedPrompt}
                                </p>
                              </details>
                            )}
                            <button
                              onClick={() => downloadImage(image, index)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              Download {image.type}
                            </button>
                          </>
                        )}
                        
                        {!image && (
                          <div className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium py-2 px-4 rounded-lg text-center">
                            {isGenerating ? 'Generating...' : 'Waiting...'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  Receive 4 high-quality images powered by DALL-E 3
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