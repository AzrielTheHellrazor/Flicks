import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate project template from user prompt
async function generateProjectTemplate(userPrompt: string): Promise<string> {
  const systemPrompt = `You are a creative director and brand strategist specializing in Farcaster ecosystem projects. 
  Given a user's prompt, create a comprehensive project template that defines the visual theme, style, and branding elements.
  
  The template should include:
  - Visual theme and aesthetic direction
  - Color palette and mood
  - Style characteristics (minimalist, modern, playful, etc.)
  - Key visual elements and motifs
  - Brand personality and tone
  - Target audience and use case
  
  This template will be used to generate 4 consistent, themed images for a Farcaster project.
  Focus on creating a cohesive visual identity that works across different image types.
  
  Return a detailed template description (150-200 words) that captures the essence of the project.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User prompt: "${userPrompt}"` }
      ],
      temperature: 0.8,
      max_tokens: 400
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from ChatGPT');

    return response.trim();
  } catch (error) {
    console.error('[Template Generation] Error:', error);
    // Fallback template
    return `Modern, minimalist design with a focus on clean lines and professional aesthetics. The visual theme centers around ${userPrompt} with a sophisticated color palette featuring deep purples, electric blues, and subtle gradients. The style emphasizes geometric shapes, contemporary typography, and a tech-forward approach that resonates with the Farcaster ecosystem. Key visual elements include abstract patterns, subtle animations, and a balance between digital innovation and human connection. The brand personality is confident, innovative, and community-focused, targeting decentralized social media enthusiasts and blockchain-savvy users.`;
  }
}

// Function to generate optimized prompts for each image type from template
async function generateOptimizedPrompts(projectTemplate: string): Promise<Record<string, string>> {
  const systemPrompt = `You are a prompt engineering expert for AI image generation, specializing in Farcaster ecosystem content. 
  Given a project template, create 4 optimized prompts for different Farcaster use cases:
  
  1. ICON: Farcaster app icon design (square, minimalist, clean, no text, fills entire frame, purple/blue theme)
  2. HERO: Farcaster cast promotional banner (landscape, social media visual, eye-catching, engaging)
  3. OG: Farcaster Open Graph card (shareable, social media optimized, engaging design)
  4. SPLASH: Farcaster app loading screen (minimal, clean, centered, calming, purple theme)
  
  Each prompt should:
  - Follow the project template's visual theme and style
  - Maintain consistency across all 4 images
  - Include Farcaster branding elements: purple/blue color schemes, decentralized social media themes
  - Be 50-100 words, specific to Farcaster ecosystem
  - Include technical details like "1024x1024 pixels", "professional", "high quality"
  
  Return ONLY a JSON object with keys: icon, hero, og, splash`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Project template: "${projectTemplate}"` }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from ChatGPT');

    // Parse JSON response
    const optimizedPrompts = JSON.parse(response);
    
    // Validate that all required keys exist
    const requiredKeys = ['icon', 'hero', 'og', 'splash'];
    for (const key of requiredKeys) {
      if (!optimizedPrompts[key]) {
        throw new Error(`Missing ${key} prompt`);
      }
    }

    return optimizedPrompts;
  } catch (error) {
    console.error('[Prompt Optimization] Error:', error);
    // Fallback to template-based prompts if ChatGPT fails
    return {
      icon: `${projectTemplate}, Farcaster app icon design, square format, minimalist, clean lines, professional, centered composition, high contrast, no text, vector-style, modern UI icon, 1024x1024 pixels, crisp edges, solid background, icon fills entire frame, purple and blue theme, decentralized social media`,
      hero: `${projectTemplate}, Farcaster cast promotional banner design, landscape format, social media visual, eye-catching, professional, modern design, high impact, 1024x1024 pixels, vibrant colors, engaging composition, purple and blue theme, decentralized social media`,
      og: `${projectTemplate}, Farcaster Open Graph card design, social media optimized, shareable visual, engaging design, professional, modern, 1024x1024 pixels, high quality, social media optimized, eye-catching, purple and blue theme, decentralized social media`,
      splash: `${projectTemplate}, Farcaster app loading screen, splash screen design, minimal, clean, centered logo, simple background, professional, modern, 1024x1024 pixels, calming colors, elegant, purple theme, decentralized social media`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageType } = await request.json();
    const reqStart = Date.now();
    console.log('[API/generate-image] request', { imageType, promptLength: prompt?.length });
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Step 1: Generate project template from user prompt
    console.log('[Template Generation] Starting template creation for:', prompt);
    const projectTemplate = await generateProjectTemplate(prompt);
    console.log('[Template Generation] Generated template:', projectTemplate.substring(0, 100) + '...');
    
    // Step 2: Generate optimized prompts from template
    console.log('[Prompt Optimization] Starting optimization from template');
    const optimizedPrompts = await generateOptimizedPrompts(projectTemplate);
    console.log('[Prompt Optimization] Generated prompts:', Object.keys(optimizedPrompts));
    
    // Use the optimized prompt for the specific image type
    const optimizedPrompt = optimizedPrompts[imageType];
    if (!optimizedPrompt) {
      return NextResponse.json({ error: `Invalid image type: ${imageType}` }, { status: 400 });
    }
    
    console.log('[Prompt Optimization] Using optimized prompt for', imageType, ':', optimizedPrompt.substring(0, 100) + '...');
    
    // Generate image using OpenAI DALL-E with optimized prompt
    const genStart = Date.now();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: optimizedPrompt,
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
          originalPrompt: prompt,
          projectTemplate: projectTemplate,
          optimizedPrompt: optimizedPrompt
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
