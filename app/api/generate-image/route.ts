import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageType } = await request.json();
    const reqStart = Date.now();
    console.log('[API/generate-image] request', { imageType, promptLength: prompt?.length });
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Define image specifications based on type
    const imageSpecs = {
      icon: { 
        size: "1024x1024", 
        prompt: `${prompt}, square format, app icon style, clean design, no transparency, centered composition` 
      },
      screenshot: { 
        size: "1024x1024", 
        prompt: `${prompt}, portrait mobile app screenshot style, vertical layout, UI elements, modern design` 
      },
      hero: { 
        size: "1024x1024", 
        prompt: `${prompt}, landscape promotional banner style, wide format, marketing design, eye-catching` 
      },
      og: { 
        size: "1024x1024", 
        prompt: `${prompt}, social media sharing format, Open Graph style, engaging visual, shareable design` 
      },
      splash: { 
        size: "1024x1024", 
        prompt: `${prompt}, simple loading screen style, minimal design, centered logo, clean background` 
      }
    };
    
    const spec = imageSpecs[imageType as keyof typeof imageSpecs] || imageSpecs.icon;
    
    // Generate image using OpenAI DALL-E
    const genStart = Date.now();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: spec.prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: 'b64_json',
    });
    console.log('[API/generate-image] openai response', {
      durationMs: Date.now() - genStart,
      hasData: Boolean(response?.data?.[0]),
      hasUrl: Boolean(response?.data?.[0]?.url),
      hasB64: Boolean(response?.data?.[0]?.b64_json),
    });
    
    if (response.data && response.data[0]) {
      // Prefer base64 directly from API response; fall back to URL fetch if missing
      let base64Image: string | null = null;
      if (response.data[0].b64_json) {
        base64Image = response.data[0].b64_json as unknown as string;
      } else if (response.data[0].url) {
        const fetchStart = Date.now();
        const imageResponse = await fetch(response.data[0].url);
        console.log('[API/generate-image] fetch url response', { ok: imageResponse.ok, status: imageResponse.status });
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString('base64');
        console.log('[API/generate-image] url fetch duration', { durationMs: Date.now() - fetchStart });
      }

      if (!base64Image) {
        console.warn('[API/generate-image] no base64 available');
        return NextResponse.json({ error: 'No image data returned' }, { status: 502 });
      }

      console.log('[API/generate-image] success', { totalMs: Date.now() - reqStart, base64Len: base64Image.length });
      return NextResponse.json({
        image: {
          url: response.data[0].url || null,
          base64: base64Image as string,
          type: imageType,
          spec: spec
        }
      });
    } else {
      console.warn('[API/generate-image] no image in response');
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API/generate-image] error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
